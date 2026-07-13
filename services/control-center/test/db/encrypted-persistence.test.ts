import { describe, expect, it } from "vitest";
import { EncryptedFieldCodec, EncryptedDataInvalidError } from "../../src/security/encrypted-field-codec";
import { EncryptedRepositories } from "../../src/db/encrypted-repositories";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import ts from "typescript";
import { apiInject, buildApp, createTestEncryptedRepositories, demoInject } from "../helpers/build-test-app";
import { closeDatabase, getDb, initDatabase } from "../helpers/test-database";
import type { VendorDeviceProvider } from "../../src/integrations/vendor-provider";

function repositories(): EncryptedRepositories {
  return new EncryptedRepositories(new EncryptedFieldCodec(new Map([["test", Buffer.alloc(32, 7)]]), "test"));
}

describe("EncryptedRepositories", () => {
  it("encrypts device state with exact physical binding and validates decoded shape", () => {
    const repository = repositories();
    const value = repository.devices.encodeState("light-1", { power: true, updatedAt: 1, online: true });
    expect(value).toMatch(/^ENC1:/);
    expect(repository.devices.decodeState("light-1", value)).toEqual({ power: true, updatedAt: 1, online: true });
    expect(() => repository.devices.decodeState("light-2", value)).toThrow(EncryptedDataInvalidError);
  });

  it("fails closed for plaintext, corrupted, and shape-invalid protected values", () => {
    const repository = repositories();
    expect(() => repository.devices.decodeState("light-1", '{"power":true}')).toThrow(EncryptedDataInvalidError);
    expect(() => repository.devices.decodeState("light-1", "ENC1:corrupt")).toThrow(EncryptedDataInvalidError);
    const invalid = repository.codec.encode([], { table: "devices", recordId: "light-1", field: "state_json" });
    expect(() => repository.devices.decodeState("light-1", invalid)).toThrow(EncryptedDataInvalidError);
  });

  it("validates each decrypted domain shape and gates legacy plaintext reads explicitly", () => {
    const repository = repositories();
    const invalidDevice = repository.codec.encode(
      { online: "yes", updatedAt: 1 },
      { table: "devices", recordId: "light-1", field: "state_json" },
    );
    const invalidStatus = repository.codec.encode(
      [1],
      { table: "device_provider_sources", recordId: "provider-1", field: "source_status_json" },
    );
    const invalidRaw = repository.codec.encode(
      [],
      { table: "device_provider_sources", recordId: "provider-1", field: "raw_json" },
    );
    const invalidTrigger = repository.codec.encode(
      { type: "button", label: "Run" },
      { table: "scenes", recordId: "scene-1", field: "trigger_json" },
    );
    const invalidCommands = repository.codec.encode(
      [{ deviceId: "light-1", name: "switch" }],
      { table: "scenes", recordId: "scene-1", field: "commands_json" },
    );
    const emptyAutomationActions = repository.codec.encode(
      [],
      { table: "automations", recordId: "auto-1", field: "action_json" },
    );

    expect(() => repository.devices.decodeState("light-1", invalidDevice)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.providerSources.decodeStatus("provider-1", invalidStatus)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.providerSources.decodeRaw("provider-1", invalidRaw)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.scenes.decodeTrigger("scene-1", invalidTrigger)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.scenes.decodeCommands("scene-1", invalidCommands)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.automations.decodeActionJson("auto-1", emptyAutomationActions)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.devices.decodeState("legacy", '{"online":true,"updatedAt":1}')).toThrow(EncryptedDataInvalidError);

    const legacy = new EncryptedRepositories(repository.codec, { allowLegacyPlaintextReads: true });
    expect(legacy.devices.decodeState("legacy", '{"online":true,"updatedAt":1}')).toEqual({ online: true, updatedAt: 1 });
  });

  it("rejects authenticated but semantically invalid automation payloads", () => {
    const repository = repositories();
    const garbageTrigger = repository.codec.encode(
      [{ garbage: 1 }],
      { table: "automations", recordId: "auto-garbage", field: "trigger_json" },
    );
    const mismatchedTrigger = repository.codec.encode(
      [{ type: "device_state_changed", deviceId: "light-1", property: "power", operator: "==", threshold: true }],
      { table: "automations", recordId: "auto-mismatch", field: "trigger_json" },
    );
    const incompleteDeviceAction = repository.codec.encode(
      [{ type: "device" }],
      { table: "automations", recordId: "auto-device", field: "action_json" },
    );
    const outOfRangeDeviceAction = repository.codec.encode(
      [{ type: "device_command", deviceId: "light-1", command: "brightness:101" }],
      { table: "automations", recordId: "auto-range", field: "action_json" },
    );

    expect(() => repository.automations.decodeTriggerJson("auto-garbage", "time", garbageTrigger)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.automations.decodeTriggerJson("auto-mismatch", "time", mismatchedTrigger)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.automations.decodeActionJson("auto-device", incompleteDeviceAction)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.automations.decodeActionJson("auto-range", outOfRangeDeviceAction)).toThrow(EncryptedDataInvalidError);

    const explicitAction = '[{"type":"device_command","deviceId":"light-1","name":"switch","payload":{"on":true}}]';
    expect(repository.automations.decodeActionJson(
      "auto-valid",
      repository.automations.encodeActionJson("auto-valid", explicitAction),
    )).toBe(explicitAction);
  });

  it("rejects authenticated provider entries without their domain fields", () => {
    const repository = repositories();
    const emptyStatus = repository.codec.encode(
      [{}],
      { table: "device_provider_sources", recordId: "provider-empty", field: "source_status_json" },
    );
    const blankFunctionCode = repository.codec.encode(
      [{ code: "", type: "Boolean" }],
      { table: "device_provider_sources", recordId: "provider-empty", field: "source_functions_json" },
    );
    const oversizedRaw = repository.codec.encode(
      { blob: "x".repeat(1_000_001) },
      { table: "device_provider_sources", recordId: "provider-empty", field: "raw_json" },
    );

    expect(() => repository.providerSources.decodeStatus("provider-empty", emptyStatus)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.providerSources.decodeFunctions("provider-empty", blankFunctionCode)).toThrow(EncryptedDataInvalidError);
    expect(() => repository.providerSources.decodeRaw("provider-empty", oversizedRaw)).toThrow(EncryptedDataInvalidError);
  });

  it("encrypts provider, scene, automation, and idempotency fields independently", () => {
    const repository = repositories();
    expect(repository.providerSources.encodeStatus("tuya:1", []).startsWith("ENC1:")).toBe(true);
    expect(repository.scenes.decodeCommands("scene-1", repository.scenes.encodeCommands("scene-1", []))).toEqual([]);
    expect(repository.automations.decodeTriggerJson("auto-1", "time", repository.automations.encodeTriggerJson("auto-1", "[{\"type\":\"time\",\"time\":\"22:00\"}]")))
      .toBe('[{"type":"time","time":"22:00"}]');
    const result = { statusCode: 200, body: { ok: true } };
    const codec = repository.commandResults.forRequest("app", "request-1");
    expect(codec.decode(codec.encode(result))).toEqual(result);
  });

  it("persists ENC1 values in sqlite and rejects AAD relocation", () => {
    const repository = repositories();
    const db = new Database(":memory:");
    db.exec("CREATE TABLE devices (id TEXT PRIMARY KEY, state_json TEXT NOT NULL)");
    const encrypted = repository.devices.encodeState("device-1", { online: true, updatedAt: 1 });
    db.prepare("INSERT INTO devices VALUES (?, ?)").run("device-1", encrypted);
    const raw = db.prepare("SELECT state_json FROM devices WHERE id = ?").get("device-1") as { state_json: string };
    expect(raw.state_json).toMatch(/^ENC1:/);
    expect(repository.devices.decodeState("device-1", raw.state_json)).toEqual({ online: true, updatedAt: 1 });
    expect(() => repository.devices.decodeState("device-2", raw.state_json)).toThrow(EncryptedDataInvalidError);
    db.close();
  });

  it("encrypts every protected column through public app operations", async () => {
    const directory = mkdtempSync(join(tmpdir(), "encrypted-persistence-"));
    const repositories = createTestEncryptedRepositories();
    const provider: VendorDeviceProvider = {
      providerId: "fake",
      discoverDevices: async () => [{
        provider: "fake", externalDeviceId: "lamp-1", originalName: "Cloud Lamp", online: true,
        deviceType: "light", state: { power: false, brightness: 10, colorTemperature: 3000, updatedAt: 10, online: true },
        capabilities: ["switch"], status: [{ code: "switch", value: false }], functions: [{ code: "switch", type: "Boolean" }],
        raw: { productId: "secret-product" },
      }],
      getDiscoveredDeviceStatus: async () => [], getDiscoveredDeviceCapabilities: async () => [],
      listDevices: async () => [], getDevice: async () => undefined, ownsDevice: () => false,
      executeCommand: async () => ({ ok: false, code: "DEVICE_NOT_FOUND", message: "not found" }),
    };
    try {
      initDatabase(join(directory, "app.db"));
      const db = getDb();
      const insert = db.prepare("INSERT INTO devices (id,name,type,room_id,state_json,updated_at,version,is_deleted,lifecycle_state) VALUES (?,?,?,?,?,?,?,0,'active')");
      insert.run("light-living-room", "Living Light", "light", "living-room", repositories.devices.encodeState("light-living-room", { power: false, brightness: 0, colorTemperature: 3000, updatedAt: 1, online: true }), 1, 1);
      insert.run("sensor-living-room", "Environment", "environment-sensor", "living-room", repositories.devices.encodeState("sensor-living-room", { temperature: 20, humidity: 40, aqi: 20, filterLife: 90, purifierActive: false, updatedAt: 1, online: true }), 1, 2);
      const app = buildApp(undefined, { vendorProvider: provider });

      const command = { requestId: "encrypted-command", timestamp: Date.now(), deviceId: "light-living-room", name: "switch", payload: { on: true } };
      expect((await apiInject(app, { method: "POST", url: "/api/commands", payload: command })).statusCode).toBe(200);
      expect((await apiInject(app, { method: "POST", url: "/api/commands", payload: command })).statusCode).toBe(200);
      expect((await demoInject(app, { method: "POST", url: "/api/demo/environment", payload: { temperature: 31, humidity: 55, aqi: 30, filterLife: 80, purifierActive: true } })).statusCode).toBe(200);
      expect((await apiInject(app, { method: "POST", url: "/api/providers/fake/discover" })).statusCode).toBe(200);

      const sceneResponse = await apiInject(app, { method: "POST", url: "/api/scenes", payload: {
        name: "Encrypted Scene", description: "test", enabled: true, trigger: { type: "manual", label: "Run" }, repeat: [],
        actionsLabel: ["Light on"], commands: [{ deviceId: "light-living-room", name: "switch", payload: { on: true } }],
      }});
      expect(sceneResponse.statusCode).toBe(201);
      const sceneId = sceneResponse.json().scene.id as string;
      expect((await apiInject(app, { method: "PUT", url: `/api/scenes/${sceneId}`, payload: { description: "updated" } })).statusCode).toBe(200);

      const automationResponse = await apiInject(app, { method: "POST", url: "/api/automations", payload: {
        name: "Encrypted Automation", triggerType: "device",
        triggerJson: '[{"type":"device","deviceId":"light-living-room","property":"power","operator":"==","threshold":true}]',
        actionJson: '[{"type":"device","deviceId":"light-living-room","command":"power:false"}]', enabled: true,
      }});
      expect(automationResponse.statusCode).toBe(201);
      const automationId = automationResponse.json().automation.id as string;
      expect((await apiInject(app, { method: "PUT", url: `/api/automations/${automationId}`, payload: { enabled: false } })).statusCode).toBe(200);
      const sync = await apiInject(app, { method: "GET", url: "/api/sync?lastVersion=0" });
      expect(sync.statusCode).toBe(200);
      expect(sync.json().devices).toEqual(expect.arrayContaining([expect.objectContaining({ id: "light-living-room", payload: expect.objectContaining({ power: true }) })]));

      const deviceRows = db.prepare("SELECT id,state_json FROM devices WHERE id IN ('light-living-room','sensor-living-room','fake-lamp-1')").all() as Array<{id:string;state_json:string}>;
      expect(deviceRows).toHaveLength(3);
      deviceRows.forEach((row) => expect(row.state_json).toMatch(/^ENC1:/));
      const source = db.prepare("SELECT source_status_json,source_functions_json,raw_json FROM device_provider_sources WHERE id='fake-lamp-1'").get() as Record<string,string>;
      Object.values(source).forEach((value) => expect(value).toMatch(/^ENC1:/));
      expect(repositories.providerSources.decodeStatus("fake-lamp-1", source.source_status_json)).toEqual([{ code: "switch", value: false }]);
      const scene = db.prepare("SELECT trigger_json,commands_json FROM scenes WHERE id=?").get(sceneId) as Record<string,string>;
      const automation = db.prepare("SELECT trigger_json,action_json FROM automations WHERE id=?").get(automationId) as Record<string,string>;
      const idempotency = db.prepare("SELECT result_json FROM command_idempotency WHERE request_id='encrypted-command'").get() as {result_json:string};
      [...Object.values(scene), ...Object.values(automation), idempotency.result_json].forEach((value) => expect(value).toMatch(/^ENC1:/));
      expect(() => repositories.scenes.decodeCommands("relocated", scene.commands_json)).toThrow(EncryptedDataInvalidError);
      expect(() => repositories.codec.decode(scene.commands_json, { table: "scenes", recordId: sceneId, field: "trigger_json" })).toThrow(EncryptedDataInvalidError);
      db.prepare("UPDATE devices SET state_json='ENC1:corrupt' WHERE id='light-living-room'").run();
      expect((await apiInject(app, { method: "GET", url: "/api/sync?lastVersion=0" })).statusCode).toBe(500);
      await app.close();
    } finally {
      closeDatabase();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("audits live protected-column code for direct JSON serialization", () => {
    const root = resolve(import.meta.dirname, "../../src");
    const protectedNames = /(?:state_json|source_status_json|source_functions_json|raw_json|trigger_json|commands_json|action_json|result_json)/;
    const files = walkTypescript(root);
    expect(files.length).toBeGreaterThan(20);
    for (const path of files) {
      const source = readFileSync(path, "utf8");
      expect(source, `${path} exports a production plaintext codec`).not.toContain("PlaintextResultCodec");
      if (path.endsWith("encrypted-repositories.ts")) continue;
      const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
      const violations: string[] = [];
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
            node.expression.expression.getText(ast) === "JSON" && ["parse", "stringify"].includes(node.expression.name.text)) {
          let statement: ts.Node = node;
          while (statement.parent && !ts.isStatement(statement)) statement = statement.parent;
          const context = statement.getText(ast);
          const approvedEncryptedArgument = ancestors(node).some((ancestor) => ts.isCallExpression(ancestor) &&
            /\.encode(?:State|TriggerJson|ActionJson|Trigger|Commands|Status|Functions|Raw)$/.test(ancestor.expression.getText(ast)));
          const approvedCapabilityTaxonomy = path.endsWith("provider-device-store.ts") && node.arguments[0]?.getText(ast) === "device.capabilities";
          const approvedScenePresentation = (path.endsWith("scene-service.ts") || path.endsWith("database-service.ts")) && /(?:\.repeat|\.actionsLabel)(?:\s*\?\?\s*\[\])?$/.test(node.arguments[0]?.getText(ast) ?? "");
          if (protectedNames.test(context) && !approvedEncryptedArgument && !approvedCapabilityTaxonomy && !approvedScenePresentation) violations.push(`${node.expression.name.text}@${ast.getLineAndCharacterOfPosition(node.pos).line + 1}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(ast);
      expect(violations, `${path} directly serializes a protected column`).toEqual([]);
    }
  });
});

function walkTypescript(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walkTypescript(path) : entry.name.endsWith(".ts") ? [path] : [];
  });
}

function ancestors(node: ts.Node): ts.Node[] {
  const result: ts.Node[] = [];
  for (let current = node.parent; current; current = current.parent) result.push(current);
  return result;
}
