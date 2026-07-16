import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const PROTECTED_COLUMNS = new Set([
  "state_json", "source_status_json", "source_functions_json", "raw_json",
  "trigger_json", "commands_json", "action_json", "result_json",
]);
const APPROVED_HELPERS = new Set([
  "parseJson", "normalizeJson", "stringifyValidatedAutomationTrigger", "stringifyValidatedAutomationActions",
]);
const APPROVED_ENCODERS = new Map<string, Set<string>>([
  ["DeviceEncryptedFields", new Set(["encodeState"])],
  ["ProviderSourceEncryptedFields", new Set(["encodeStatus", "encodeFunctions", "encodeRaw"])],
  ["SceneEncryptedFields", new Set(["encodeTrigger", "encodeCommands"])],
  ["AutomationEncryptedFields", new Set(["encodeTriggerJson", "encodeActionJson"])],
]);
const PRODUCTION_ENCRYPTED_REPOSITORIES = resolve(import.meta.dirname, "../../src/db/encrypted-repositories.ts");
type EvaluationContext = {
  declaration: ts.FunctionLikeDeclaration;
  call: ts.CallExpression;
  parent?: EvaluationContext;
};

export function auditProtectedPersistenceSource(source: string, path = "source.ts"): string[] {
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  return auditSourceFile(ast);
}

export function auditProtectedPersistenceFile(path: string): string[] {
  const absolutePath = resolve(path);
  const program = ts.createProgram([absolutePath], programOptions());
  const sourceFile = program.getSourceFile(absolutePath);
  if (!sourceFile) throw new Error(`Unable to load audit source: ${absolutePath}`);
  return auditSourceFile(sourceFile, program.getTypeChecker());
}

export function auditProtectedPersistenceTree(directory: string): string[] {
  const files = walkTypescript(directory);
  const program = ts.createProgram(files, programOptions());
  const checker = program.getTypeChecker();
  return files.flatMap((path) => {
    const sourceFile = program.getSourceFile(path);
    return sourceFile
      ? auditSourceFile(sourceFile, checker).map((violation) => `${path}: ${violation}`)
      : [`${path}: unable to load source`];
  });
}

function auditSourceFile(ast: ts.SourceFile, checker?: ts.TypeChecker): string[] {
  const tainted = new Set<string>();
  const serialized = new Set<string>();
  const preparedSql = new Map<string, string>();
  const violations: string[] = [];

  const symbolKey = (identifier: ts.Identifier): string => {
    const symbol = checker?.getSymbolAtLocation(identifier);
    return symbol ? `${symbol.getName()}@${symbol.declarations?.[0]?.pos ?? identifier.pos}` : identifier.text;
  };

  const resolveLocalFunction = (call: ts.CallExpression): ts.FunctionLikeDeclaration | undefined => {
    if (!ts.isIdentifier(call.expression)) return undefined;
    const functionName = call.expression.text;
    const symbol = checker?.getSymbolAtLocation(call.expression);
    const declaration = symbol?.declarations?.map(functionLikeFromDeclaration).find((value) => value !== undefined);
    if (declaration && declaration.getSourceFile() === ast) return declaration;
    let found: ts.FunctionLikeDeclaration | undefined;
    const find = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) && node.name?.text === functionName) found = node;
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        found = functionLikeFromDeclaration(node);
      }
      if (!found) ts.forEachChild(node, find);
    };
    find(ast);
    return found;
  };

  const jsonOperation = (call: ts.CallExpression, seen = new Set<ts.Node>()): "parse" | "stringify" | undefined => {
    if (seen.has(call.expression)) return undefined;
    seen.add(call.expression);
    if (ts.isPropertyAccessExpression(call.expression) && ts.isIdentifier(call.expression.expression) &&
        call.expression.expression.text === "JSON" && (call.expression.name.text === "parse" || call.expression.name.text === "stringify")) {
      return call.expression.name.text;
    }
    if (!ts.isIdentifier(call.expression)) return undefined;
    const symbol = checker?.getSymbolAtLocation(call.expression);
    const declaration = symbol?.declarations?.find(ts.isVariableDeclaration);
    const initializer = declaration?.initializer;
    if (initializer && ts.isPropertyAccessExpression(initializer) && ts.isIdentifier(initializer.expression) &&
        initializer.expression.text === "JSON" && (initializer.name.text === "parse" || initializer.name.text === "stringify")) {
      return initializer.name.text;
    }
    if (initializer && ts.isIdentifier(initializer)) {
      const synthetic = ts.factory.createCallExpression(initializer, undefined, []);
      return jsonOperation(synthetic, seen);
    }
    return undefined;
  };

  const substituteParameter = (
    identifier: ts.Identifier,
    declaration: ts.FunctionLikeDeclaration,
    call: ts.CallExpression,
  ): ts.Expression | undefined => {
    const index = declaration.parameters.findIndex((parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === identifier.text);
    return index >= 0 ? call.arguments[index] : undefined;
  };

  const returnExpressions = (declaration: ts.FunctionLikeDeclaration): ts.Expression[] => {
    const expressions: ts.Expression[] = [];
    if (!declaration.body) return expressions;
    if (!ts.isBlock(declaration.body)) return [declaration.body];
    const visit = (node: ts.Node): void => {
      if (ts.isReturnStatement(node) && node.expression) expressions.push(node.expression);
      else if (!ts.isFunctionLike(node) || node === declaration) ts.forEachChild(node, visit);
    };
    visit(declaration.body);
    return expressions;
  };

  const expressionIsTainted = (
    expression: ts.Expression | undefined,
    functionContext?: EvaluationContext,
    seen = new Set<ts.Node>(),
  ): boolean => {
    if (!expression || seen.has(expression)) return false;
    seen.add(expression);
    if (ts.isIdentifier(expression)) {
      const substituted = functionContext && substituteParameter(expression, functionContext.declaration, functionContext.call);
      return substituted ? expressionIsTainted(substituted, functionContext?.parent, seen) : tainted.has(symbolKey(expression));
    }
    if (ts.isPropertyAccessExpression(expression)) return PROTECTED_COLUMNS.has(expression.name.text);
    if (ts.isElementAccessExpression(expression) && expression.argumentExpression && ts.isStringLiteralLike(expression.argumentExpression)) {
      return PROTECTED_COLUMNS.has(expression.argumentExpression.text);
    }
    if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression)) {
      return expressionIsTainted(expression.expression, functionContext, seen);
    }
    if (ts.isConditionalExpression(expression)) {
      return expressionIsTainted(expression.whenTrue, functionContext, seen) || expressionIsTainted(expression.whenFalse, functionContext, seen);
    }
    if (ts.isCallExpression(expression)) {
      if (isApprovedEncoderCall(expression, checker)) return false;
      const declaration = resolveLocalFunction(expression);
      const returnedTaint = declaration && returnExpressions(declaration).some((returned) =>
        expressionIsTainted(returned, { declaration, call: expression, parent: functionContext }, new Set(seen)));
      return returnedTaint === true || expression.arguments.some((argument) =>
        expressionIsTainted(argument, functionContext, new Set(seen)));
    }
    return false;
  };

  const expressionIsSerialized = (
    expression: ts.Expression | undefined,
    functionContext?: EvaluationContext,
    seen = new Set<ts.Node>(),
  ): boolean => {
    if (!expression || seen.has(expression)) return false;
    seen.add(expression);
    if (ts.isIdentifier(expression)) {
      const substituted = functionContext && substituteParameter(expression, functionContext.declaration, functionContext.call);
      return substituted ? expressionIsSerialized(substituted, functionContext?.parent, seen) : serialized.has(symbolKey(expression));
    }
    if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression) || ts.isNonNullExpression(expression)) {
      return expressionIsSerialized(expression.expression, functionContext, seen);
    }
    if (ts.isConditionalExpression(expression)) {
      return expressionIsSerialized(expression.whenTrue, functionContext, seen) || expressionIsSerialized(expression.whenFalse, functionContext, seen);
    }
    if (ts.isCallExpression(expression)) {
      if (isApprovedEncoderCall(expression, checker)) return false;
      if (jsonOperation(expression) === "stringify") return true;
      const declaration = resolveLocalFunction(expression);
      const returnedSerialization = declaration && returnExpressions(declaration).some((returned) =>
        expressionIsSerialized(returned, { declaration, call: expression, parent: functionContext }, new Set(seen)));
      return returnedSerialization === true || expression.arguments.some((argument) =>
        expressionIsSerialized(argument, functionContext, new Set(seen)));
    }
    return false;
  };

  const markBinding = (name: ts.BindingName, initializer: ts.Expression | undefined): boolean => {
    let changed = false;
    if (ts.isIdentifier(name)) {
      if (expressionIsTainted(initializer) && !tainted.has(symbolKey(name))) { tainted.add(symbolKey(name)); changed = true; }
      if (expressionIsSerialized(initializer) && !serialized.has(symbolKey(name))) { serialized.add(symbolKey(name)); changed = true; }
      return changed;
    }
    for (const element of name.elements) {
      if (ts.isOmittedExpression(element)) continue;
      const propertyName = element.propertyName && ts.isIdentifier(element.propertyName)
        ? element.propertyName.text : ts.isIdentifier(element.name) ? element.name.text : undefined;
      if (ts.isIdentifier(element.name) &&
          ((propertyName !== undefined && PROTECTED_COLUMNS.has(propertyName)) || expressionIsTainted(initializer)) &&
          !tainted.has(symbolKey(element.name))) {
        tainted.add(symbolKey(element.name));
        changed = true;
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
        if (ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) &&
            ts.isPropertyAccessExpression(node.initializer.expression) && node.initializer.expression.name.text === "prepare") {
          const sql = literalText(node.initializer.arguments[0]);
          if (sql !== undefined) preparedSql.set(symbolKey(node.name), sql);
        }
      } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(node.left)) {
        if (expressionIsTainted(node.right) && !tainted.has(symbolKey(node.left))) { tainted.add(symbolKey(node.left)); changed = true; }
        if (expressionIsSerialized(node.right) && !serialized.has(symbolKey(node.left))) { serialized.add(symbolKey(node.left)); changed = true; }
      }
      ts.forEachChild(node, collect);
    };
    collect(ast);
  }

  if (ast.text.includes("PlaintextResultCodec")) violations.push("production plaintext result codec");
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const operation = jsonOperation(node);
      if (operation) {
        const approvedHelper = resolve(ast.fileName) === PRODUCTION_ENCRYPTED_REPOSITORIES &&
          APPROVED_HELPERS.has(enclosingFunctionName(node) ?? "");
        if (expressionIsTainted(node.arguments[0]) && !approvedHelper && !hasApprovedEncoderAncestor(node, checker)) {
          violations.push(`${operation} of protected value at line ${lineOf(ast, node)}`);
        }
      }
      if (isRunCall(node)) {
        const sql = sqlForRunCall(node, preparedSql, symbolKey);
        if (sql) {
          const protectedIndexes = protectedBindIndexes(sql);
          node.arguments.forEach((argument, index) => {
            if (protectedIndexes.has(index) && expressionIsSerialized(argument) && !hasApprovedEncoderAncestor(argument, checker)) {
              violations.push(`serialized value bound to protected SQL column at line ${lineOf(ast, argument)}`);
            }
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return [...new Set(violations)];
}

function functionLikeFromDeclaration(declaration: ts.Declaration): ts.FunctionLikeDeclaration | undefined {
  if (ts.isFunctionDeclaration(declaration)) return declaration;
  if (ts.isVariableDeclaration(declaration) && declaration.initializer &&
      (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
    return declaration.initializer;
  }
  return undefined;
}

function hasApprovedEncoderAncestor(node: ts.Node, checker?: ts.TypeChecker): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isCallExpression(current) && isApprovedEncoderCall(current, checker)) return true;
    if (ts.isStatement(current)) return false;
  }
  return false;
}

function isApprovedEncoderCall(call: ts.CallExpression, checker?: ts.TypeChecker): boolean {
  if (!checker || !ts.isPropertyAccessExpression(call.expression)) return false;
  const methodName = call.expression.name.text;
  let symbol = checker.getSymbolAtLocation(call.expression.name);
  if (symbol && (symbol.flags & ts.SymbolFlags.Alias)) symbol = checker.getAliasedSymbol(symbol);
  return symbol?.declarations?.some((declaration) => {
    if (!ts.isMethodDeclaration(declaration) || !ts.isClassDeclaration(declaration.parent) || !declaration.parent.name) return false;
    const methods = APPROVED_ENCODERS.get(declaration.parent.name.text);
    return resolve(declaration.getSourceFile().fileName) === PRODUCTION_ENCRYPTED_REPOSITORIES && methods?.has(methodName) === true;
  }) === true;
}

function isRunCall(node: ts.CallExpression): boolean {
  return ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "run";
}

function enclosingFunctionName(node: ts.Node): string | undefined {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current)) return current.name?.text;
    if (ts.isMethodDeclaration(current) && ts.isIdentifier(current.name)) return current.name.text;
  }
  return undefined;
}

function sqlForRunCall(
  call: ts.CallExpression,
  preparedSql: Map<string, string>,
  symbolKey: (identifier: ts.Identifier) => string,
): string | undefined {
  if (!ts.isPropertyAccessExpression(call.expression)) return undefined;
  const receiver = call.expression.expression;
  if (ts.isIdentifier(receiver)) return preparedSql.get(symbolKey(receiver));
  if (ts.isCallExpression(receiver) && ts.isPropertyAccessExpression(receiver.expression) && receiver.expression.name.text === "prepare") {
    return literalText(receiver.arguments[0]);
  }
  return undefined;
}

function literalText(node: ts.Expression | undefined): string | undefined {
  return node && ts.isStringLiteralLike(node) ? node.text : undefined;
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
      if (PROTECTED_COLUMNS.has(column)) for (let offset = 0; offset < bindCount; offset += 1) indexes.add(bindIndex + offset);
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
      if (column && PROTECTED_COLUMNS.has(column)) for (let offset = 0; offset < bindCount; offset += 1) indexes.add(bindIndex + offset);
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

function programOptions(): ts.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    skipLibCheck: true,
    types: ["node"],
  };
}
