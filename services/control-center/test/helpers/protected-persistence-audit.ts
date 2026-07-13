import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const PROTECTED_COLUMNS = new Set([
  "state_json", "source_status_json", "source_functions_json", "raw_json",
  "trigger_json", "commands_json", "action_json", "result_json",
]);

const APPROVED_ENCRYPTED_HELPERS = new Set([
  "parseJson", "normalizeJson", "stringifyValidatedAutomationTrigger",
  "stringifyValidatedAutomationActions",
]);

const APPROVED_ENCODERS = /(?:^|\.)encryptedRepositories\.(?:devices|providerSources|scenes|automations)\.encode(?:State|TriggerJson|ActionJson|Trigger|Commands|Status|Functions|Raw)$/;

export function auditProtectedPersistenceSource(source: string, path = "source.ts"): string[] {
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const tainted = new Set<string>();
  const serialized = new Set<string>();
  const preparedSql = new Map<string, string>();
  const violations: string[] = [];

  const expressionIsTainted = (expression: ts.Expression | undefined): boolean => {
    if (!expression) return false;
    if (ts.isIdentifier(expression)) return tainted.has(expression.text);
    if (ts.isPropertyAccessExpression(expression)) return PROTECTED_COLUMNS.has(expression.name.text);
    if (ts.isElementAccessExpression(expression) && expression.argumentExpression &&
        (ts.isStringLiteral(expression.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(expression.argumentExpression))) {
      return PROTECTED_COLUMNS.has(expression.argumentExpression.text);
    }
    if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression)) {
      return expressionIsTainted(expression.expression);
    }
    if (ts.isConditionalExpression(expression)) {
      return expressionIsTainted(expression.whenTrue) || expressionIsTainted(expression.whenFalse);
    }
    return false;
  };

  const expressionIsSerialized = (expression: ts.Expression | undefined): boolean => {
    if (!expression) return false;
    if (ts.isIdentifier(expression)) return serialized.has(expression.text);
    if (isJsonCall(expression)) return expression.expression.name.text === "stringify";
    if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression)) {
      return expressionIsSerialized(expression.expression);
    }
    if (ts.isConditionalExpression(expression)) {
      return expressionIsSerialized(expression.whenTrue) || expressionIsSerialized(expression.whenFalse);
    }
    return false;
  };

  const markBinding = (name: ts.BindingName, initializer: ts.Expression | undefined): boolean => {
    let changed = false;
    if (ts.isIdentifier(name)) {
      if (expressionIsTainted(initializer) && !tainted.has(name.text)) {
        tainted.add(name.text);
        changed = true;
      }
      return changed;
    }
    for (const element of name.elements) {
      if (ts.isOmittedExpression(element)) continue;
      const propertyName = element.propertyName && (ts.isIdentifier(element.propertyName) || ts.isStringLiteral(element.propertyName))
        ? element.propertyName.text
        : ts.isIdentifier(element.name) ? element.name.text : undefined;
      const elementIsTainted = (propertyName !== undefined && PROTECTED_COLUMNS.has(propertyName)) || expressionIsTainted(initializer);
      if (ts.isIdentifier(element.name)) {
        if (elementIsTainted && !tainted.has(element.name.text)) {
          tainted.add(element.name.text);
          changed = true;
        }
      } else if (elementIsTainted) {
        changed = markBinding(element.name, initializer) || changed;
      }
    }
    return changed;
  };

  let changed = true;
  while (changed) {
    changed = false;
    const collect = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node)) {
        changed = markBinding(node.name, node.initializer) || changed;
        if (ts.isIdentifier(node.name) && expressionIsSerialized(node.initializer) && !serialized.has(node.name.text)) {
          serialized.add(node.name.text);
          changed = true;
        }
        if (ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) &&
            ts.isPropertyAccessExpression(node.initializer.expression) && node.initializer.expression.name.text === "prepare") {
          const sql = literalText(node.initializer.arguments[0]);
          if (sql !== undefined) preparedSql.set(node.name.text, sql);
        }
      } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
                 ts.isIdentifier(node.left) && expressionIsTainted(node.right)) {
        if (!tainted.has(node.left.text)) {
          tainted.add(node.left.text);
          changed = true;
        }
      } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
                 ts.isIdentifier(node.left) && expressionIsSerialized(node.right) && !serialized.has(node.left.text)) {
        serialized.add(node.left.text);
        changed = true;
      }
      ts.forEachChild(node, collect);
    };
    collect(ast);
  }

  if (source.includes("PlaintextResultCodec")) violations.push("production plaintext result codec");

  const visit = (node: ts.Node): void => {
    if (isJsonCall(node)) {
      const approvedHelper = path.endsWith("encrypted-repositories.ts") &&
        APPROVED_ENCRYPTED_HELPERS.has(enclosingFunctionName(node) ?? "");
      if (expressionIsTainted(node.arguments[0]) && !approvedHelper && !hasApprovedEncoderAncestor(node)) {
        violations.push(`${node.expression.name.text} of protected value at line ${lineOf(ast, node)}`);
      }
    }
    if (isRunCall(node)) {
      const sql = sqlForRunCall(node, preparedSql);
      if (sql) {
        const protectedIndexes = protectedBindIndexes(sql);
        node.arguments.forEach((argument, index) => {
          if (protectedIndexes.has(index) && expressionIsSerialized(argument) && !hasApprovedEncoderAncestor(argument)) {
            violations.push(`serialized value bound to protected SQL column at line ${lineOf(ast, argument)}`);
          }
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return [...new Set(violations)];
}

export function auditProtectedPersistenceTree(directory: string): string[] {
  return walkTypescript(directory).flatMap((path) =>
    auditProtectedPersistenceSource(readFileSync(path, "utf8"), path).map((violation) => `${path}: ${violation}`),
  );
}

function isJsonCall(node: ts.Node): node is ts.CallExpression & { expression: ts.PropertyAccessExpression } {
  return ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "JSON" &&
    (node.expression.name.text === "parse" || node.expression.name.text === "stringify");
}

function isRunCall(node: ts.Node): node is ts.CallExpression & { expression: ts.PropertyAccessExpression } {
  return ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "run";
}

function hasApprovedEncoderAncestor(node: ts.Node): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isCallExpression(current) && APPROVED_ENCODERS.test(current.expression.getText())) return true;
    if (ts.isStatement(current)) return false;
  }
  return false;
}

function enclosingFunctionName(node: ts.Node): string | undefined {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current)) return current.name?.text;
    if (ts.isMethodDeclaration(current) && current.name && ts.isIdentifier(current.name)) return current.name.text;
  }
  return undefined;
}

function sqlForRunCall(call: ts.CallExpression, preparedSql: Map<string, string>): string | undefined {
  if (!ts.isPropertyAccessExpression(call.expression)) return undefined;
  const receiver = call.expression.expression;
  if (ts.isIdentifier(receiver)) return preparedSql.get(receiver.text);
  if (ts.isCallExpression(receiver) && ts.isPropertyAccessExpression(receiver.expression) && receiver.expression.name.text === "prepare") {
    return literalText(receiver.arguments[0]);
  }
  return undefined;
}

function literalText(node: ts.Expression | undefined): string | undefined {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
}

function protectedBindIndexes(sql: string): Set<number> {
  const indexes = new Set<number>();
  const insert = /\binsert\s+into\s+[^\s(]+\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/is.exec(sql);
  if (insert) {
    const columns = insert[1].split(",").map((column) => column.trim().replace(/["`\[\]]/g, "").toLowerCase());
    const values = insert[2].split(",");
    let bindIndex = 0;
    columns.forEach((column, columnIndex) => {
      const bindCount = (values[columnIndex]?.match(/\?/g) ?? []).length;
      if (PROTECTED_COLUMNS.has(column)) {
        for (let offset = 0; offset < bindCount; offset += 1) indexes.add(bindIndex + offset);
      }
      bindIndex += bindCount;
    });
    return indexes;
  }
  const update = /\bupdate\s+[^\s]+\s+set\s+(.+?)(?:\s+where\s+|$)/is.exec(sql);
  if (update) {
    let bindIndex = 0;
    for (const assignment of update[1].split(",")) {
      const column = /^\s*([\w"`\[\]]+)\s*=/.exec(assignment)?.[1].replace(/["`\[\]]/g, "").toLowerCase();
      const bindCount = (assignment.match(/\?/g) ?? []).length;
      if (column && PROTECTED_COLUMNS.has(column)) {
        for (let offset = 0; offset < bindCount; offset += 1) indexes.add(bindIndex + offset);
      }
      bindIndex += bindCount;
    }
  }
  return indexes;
}

function lineOf(ast: ts.SourceFile, node: ts.Node): number {
  return ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
}

function walkTypescript(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walkTypescript(path) : entry.name.endsWith(".ts") ? [path] : [];
  });
}
