import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadSecurityConfig } from "../../src/config/security-config";

const token = (character: string): string => character.repeat(32);
const encodedKey = Buffer.alloc(32, 7).toString("base64");

const validDemoEnv = {
  CONTROL_CENTER_MODE: "demo",
  CONTROL_CENTER_HOST: "127.0.0.1",
  CONTROL_CENTER_API_TOKEN: token("a"),
  CONTROL_CENTER_DEMO_TOKEN: token("d"),
  CONTROL_CENTER_SHARED_KEY: token("h"),
  CONTROL_CENTER_DATA_KEYS: JSON.stringify({ k1: encodedKey }),
  CONTROL_CENTER_ACTIVE_DATA_KEY_ID: "k1",
};

describe("loadSecurityConfig", () => {
  it("defaults to production and rejects missing credentials", async () => {
    await expect(loadSecurityConfig({})).rejects.toThrow(/CONTROL_CENTER_API_TOKEN/);
  });

  it("loads valid production files", async () => {
    const directory = mkdtempSync(join(tmpdir(), "control-center-security-"));
    const certPath = join(directory, "cert.pem");
    const keyPath = join(directory, "key.pem");
    const dataKeysPath = join(directory, "data-keys.json");
    writeFileSync(certPath, "certificate");
    writeFileSync(keyPath, "private key");
    writeFileSync(dataKeysPath, JSON.stringify({ primary: encodedKey }));

    const config = await loadSecurityConfig({
      CONTROL_CENTER_API_TOKEN: token("a"),
      CONTROL_CENTER_DATA_KEYS_PATH: dataKeysPath,
      CONTROL_CENTER_ACTIVE_DATA_KEY_ID: "primary",
      TLS_CERT_PATH: certPath,
      TLS_KEY_PATH: keyPath,
    });

    expect(config).toMatchObject({ mode: "production", host: "127.0.0.1", port: 3443 });
    expect(config.tls?.cert.toString()).toBe("certificate");
    expect(config.dataKeys.get("primary")).toEqual(Buffer.alloc(32, 7));
  });

  it("permits HTTP for a loopback-only demo", async () => {
    await expect(loadSecurityConfig(validDemoEnv)).resolves.toMatchObject({
      mode: "demo",
      host: "127.0.0.1",
      tls: undefined,
    });
  });

  it("rejects localhost HTTP when any resolved address is non-loopback", async () => {
    await expect(loadSecurityConfig(
      { ...validDemoEnv, CONTROL_CENTER_HOST: "localhost" },
      { resolveHost: async () => ["127.0.0.1", "192.168.1.2"] },
    )).rejects.toThrow(/TLS/);
  });

  it("accepts localhost HTTP when every resolved address is loopback", async () => {
    await expect(loadSecurityConfig(
      { ...validDemoEnv, CONTROL_CENTER_HOST: "localhost" },
      { resolveHost: async () => ["127.0.0.1", "::1"] },
    )).resolves.toMatchObject({ host: "localhost", tls: undefined });
  });

  it("resolves the runtime localhost before allowing HTTP", async () => {
    await expect(loadSecurityConfig({
      ...validDemoEnv,
      CONTROL_CENTER_HOST: "localhost",
    })).resolves.toMatchObject({ host: "localhost", tls: undefined });
  });

  it("fails closed when localhost resolution fails", async () => {
    await expect(loadSecurityConfig(
      { ...validDemoEnv, CONTROL_CENTER_HOST: "localhost" },
      { resolveHost: async () => { throw new Error("DNS unavailable"); } },
    )).rejects.toThrow(/resolve.*localhost/i);
  });

  it("requires TLS for a non-loopback demo", async () => {
    await expect(loadSecurityConfig({ ...validDemoEnv, CONTROL_CENTER_HOST: "0.0.0.0" })).rejects.toThrow(/TLS/);
  });

  it("rejects partial TLS configuration", async () => {
    await expect(loadSecurityConfig({ ...validDemoEnv, TLS_CERT_PATH: "cert.pem" })).rejects.toThrow(/TLS_CERT_PATH.*TLS_KEY_PATH/);
  });

  it("rejects unreadable TLS files", async () => {
    await expect(loadSecurityConfig(
      { ...validDemoEnv, TLS_CERT_PATH: "cert.pem", TLS_KEY_PATH: "key.pem" },
      { readFile: () => { throw new Error("unreadable"); } },
    )).rejects.toThrow(/TLS.*readable/);
  });

  it("rejects simultaneous inline and file data keys", async () => {
    await expect(loadSecurityConfig({ ...validDemoEnv, CONTROL_CENTER_DATA_KEYS_PATH: "keys.json" })).rejects.toThrow(/never both/);
  });

  it("requires file-backed data keys in production", async () => {
    await expect(loadSecurityConfig({
      CONTROL_CENTER_API_TOKEN: token("a"),
      CONTROL_CENTER_DATA_KEYS: JSON.stringify({ k1: encodedKey }),
      CONTROL_CENTER_ACTIVE_DATA_KEY_ID: "k1",
      TLS_CERT_PATH: "cert.pem",
      TLS_KEY_PATH: "key.pem",
    }, { readFile: () => Buffer.from("tls") })).rejects.toThrow(/DATA_KEYS_PATH.*production/);
  });

  it("rejects an invalid mode", async () => {
    await expect(loadSecurityConfig({ ...validDemoEnv, CONTROL_CENTER_MODE: "development" })).rejects.toThrow(/CONTROL_CENTER_MODE/);
  });

  it.each([
    ["non-canonical base64", "not-base64"],
    ["wrong key length", Buffer.alloc(31).toString("base64")],
  ])("rejects %s", async (_name, value) => {
    await expect(loadSecurityConfig({
      ...validDemoEnv,
      CONTROL_CENTER_DATA_KEYS: JSON.stringify({ k1: value }),
    })).rejects.toThrow(/base64|32 bytes/);
  });

  it("requires the active data key to exist", async () => {
    await expect(loadSecurityConfig({ ...validDemoEnv, CONTROL_CENTER_ACTIVE_DATA_KEY_ID: "missing" })).rejects.toThrow(/active data key/i);
  });

  it("requires strong, distinct credentials", async () => {
    await expect(loadSecurityConfig({ ...validDemoEnv, CONTROL_CENTER_API_TOKEN: "short" })).rejects.toThrow(/CONTROL_CENTER_API_TOKEN.*32/);
    await expect(loadSecurityConfig({ ...validDemoEnv, CONTROL_CENTER_DEMO_TOKEN: token("a") })).rejects.toThrow(/separate/);
  });

  it("parses explicit CORS origins and trusted proxies", async () => {
    const config = await loadSecurityConfig({
      ...validDemoEnv,
      CONTROL_CENTER_CORS_ORIGINS: "https://app.example, http://localhost:3000",
      CONTROL_CENTER_TRUST_PROXY: "127.0.0.1,10.0.0.5",
    });
    expect(config.corsOrigins).toEqual(["https://app.example", "http://localhost:3000"]);
    expect(config.trustProxy).toEqual(["127.0.0.1", "10.0.0.5"]);
    expect((await loadSecurityConfig(validDemoEnv)).trustProxy).toBe(false);
  });
});
