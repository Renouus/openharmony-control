import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { createSecureContext } from "node:tls";

export type ControlCenterMode = "production" | "demo";
export type DataKeyring = ReadonlyMap<string, Buffer>;

export type SecurityConfig = {
  mode: ControlCenterMode;
  host: string;
  port: number;
  apiToken: string;
  demoToken?: string;
  demoHmacKey?: string;
  corsOrigins: readonly string[];
  trustProxy: boolean | string[];
  tls?: { cert: Buffer; key: Buffer };
  dataKeys: DataKeyring;
  activeDataKeyId: string;
};

export type SecurityEnv = Record<string, string | undefined>;

export type SecurityConfigDependencies = {
  readFile?: (path: string) => Buffer;
  resolveHost?: (host: string) => Promise<readonly string[]>;
  validateTls?: (tls: { cert: Buffer; key: Buffer }) => void;
};

const MINIMUM_CREDENTIAL_LENGTH = 32;

function requiredCredential(env: SecurityEnv, name: string): string {
  const value = env[name];
  if (!value || value.length < MINIMUM_CREDENTIAL_LENGTH) {
    throw new Error(`${name} must be at least ${MINIMUM_CREDENTIAL_LENGTH} characters`);
  }
  return value;
}

function parseList(value: string | undefined, name: string): string[] {
  if (!value) return [];
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (items.length === 0) throw new Error(`${name} must contain at least one value`);
  return items;
}

function parseOrigins(value: string | undefined): string[] {
  return parseList(value, "CONTROL_CENTER_CORS_ORIGINS").map((origin) => {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("CONTROL_CENTER_CORS_ORIGINS contains an invalid origin");
    }
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.origin !== origin) {
      throw new Error("CONTROL_CENTER_CORS_ORIGINS must contain HTTP origins without paths");
    }
    return origin;
  });
}

function parseTrustProxy(value: string | undefined): false | string[] {
  if (!value || value === "false") return false;
  if (value === "true") {
    throw new Error("CONTROL_CENTER_TRUST_PROXY must identify explicit trusted proxies");
  }
  return parseList(value, "CONTROL_CENTER_TRUST_PROXY");
}

function parsePort(value: string | undefined): number {
  if (value === undefined) return 3443;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("CONTROL_CENTER_PORT must be an integer from 1 to 65535");
  }
  return port;
}

function isLoopback(address: string): boolean {
  if (address === "::1") return true;
  if (isIP(address) === 4) {
    return address.split(".")[0] === "127";
  }
  return false;
}

async function isLoopbackListenHost(
  host: string,
  resolveHost: (host: string) => Promise<readonly string[]>,
): Promise<boolean> {
  let addresses: readonly string[];
  try {
    addresses = host === "localhost" ? await resolveHost(host) : [host];
  } catch {
    throw new Error(`failed to resolve listen host ${host}`);
  }
  return addresses.length > 0 && addresses.every(isLoopback);
}

function loadTls(
  env: SecurityEnv,
  readFile: (path: string) => Buffer,
  validateTls: (tls: { cert: Buffer; key: Buffer }) => void,
): SecurityConfig["tls"] {
  const certPath = env.TLS_CERT_PATH;
  const keyPath = env.TLS_KEY_PATH;
  if (Boolean(certPath) !== Boolean(keyPath)) {
    throw new Error("TLS_CERT_PATH and TLS_KEY_PATH must both be configured or both be absent");
  }
  if (!certPath || !keyPath) return undefined;
  try {
    const tls = { cert: readFile(certPath), key: readFile(keyPath) };
    validateTls(tls);
    return tls;
  } catch {
    throw new Error("TLS certificate and key files must be readable and form a valid PEM pair");
  }
}

function parseDataKeys(json: string): DataKeyring {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("data key configuration must be valid JSON");
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("data key configuration must be a JSON object");
  }
  const keys = new Map<string, Buffer>();
  for (const [id, encoded] of Object.entries(parsed)) {
    if (!id || typeof encoded !== "string") {
      throw new Error("data keys must map non-empty IDs to base64 strings");
    }
    const decoded = Buffer.from(encoded, "base64");
    if (decoded.toString("base64") !== encoded) {
      throw new Error(`data key ${id} must use canonical base64 encoding`);
    }
    if (decoded.length !== 32) {
      throw new Error(`data key ${id} must decode to exactly 32 bytes`);
    }
    keys.set(id, decoded);
  }
  if (keys.size === 0) throw new Error("at least one data key is required");
  return keys;
}

export async function loadSecurityConfig(
  env: SecurityEnv = process.env,
  dependencies: SecurityConfigDependencies = {},
): Promise<SecurityConfig> {
  const readFile = dependencies.readFile ?? readFileSync;
  const validateTls = dependencies.validateTls ?? ((tls) => { createSecureContext(tls); });
  const resolveHost = dependencies.resolveHost ?? (async (host: string) =>
    (await lookup(host, { all: true })).map((result) => result.address));
  const modeValue = env.CONTROL_CENTER_MODE ?? "production";
  if (modeValue !== "production" && modeValue !== "demo") {
    throw new Error("CONTROL_CENTER_MODE must be production or demo");
  }
  const mode: ControlCenterMode = modeValue;
  const configuredHost = env.CONTROL_CENTER_HOST ?? "127.0.0.1";
  const apiToken = requiredCredential(env, "CONTROL_CENTER_API_TOKEN");
  const demoToken = mode === "demo" ? requiredCredential(env, "CONTROL_CENTER_DEMO_TOKEN") : undefined;
  const demoHmacKey = mode === "demo" ? requiredCredential(env, "CONTROL_CENTER_SHARED_KEY") : undefined;
  const credentials = [apiToken, demoToken, demoHmacKey].filter((value): value is string => value !== undefined);
  if (new Set(credentials).size !== credentials.length) {
    throw new Error("API, demo, and HMAC credentials must be separate");
  }

  const tls = loadTls(env, readFile, validateTls);
  let host = configuredHost;
  if (!tls && mode === "demo" && configuredHost === "localhost") {
    let addresses: readonly string[];
    try {
      addresses = await resolveHost(configuredHost);
    } catch {
      throw new Error(`failed to resolve listen host ${configuredHost}`);
    }
    if (addresses.length === 0 || !addresses.every(isLoopback)) {
      throw new Error("TLS is required in production and for non-loopback listen addresses");
    }
    host = addresses.includes("127.0.0.1") ? "127.0.0.1" : "::1";
  }
  if (!tls && (mode === "production" || !await isLoopbackListenHost(host, resolveHost))) {
    throw new Error("TLS is required in production and for non-loopback listen addresses");
  }

  const inlineKeys = env.CONTROL_CENTER_DATA_KEYS;
  const keyPath = env.CONTROL_CENTER_DATA_KEYS_PATH;
  if (inlineKeys && keyPath) throw new Error("configure either inline or file data keys, never both");
  if (mode === "production" && !keyPath) {
    throw new Error("CONTROL_CENTER_DATA_KEYS_PATH is required in production");
  }
  let keyJson: string;
  if (keyPath) {
    try {
      keyJson = readFile(keyPath).toString("utf8");
    } catch {
      throw new Error("CONTROL_CENTER_DATA_KEYS_PATH must be readable");
    }
  } else if (inlineKeys) {
    keyJson = inlineKeys;
  } else {
    throw new Error("CONTROL_CENTER_DATA_KEYS or CONTROL_CENTER_DATA_KEYS_PATH is required");
  }
  const dataKeys = parseDataKeys(keyJson);
  const activeDataKeyId = env.CONTROL_CENTER_ACTIVE_DATA_KEY_ID;
  if (!activeDataKeyId || !dataKeys.has(activeDataKeyId)) {
    throw new Error("configured active data key must exist in the keyring");
  }

  return {
    mode,
    host,
    port: parsePort(env.CONTROL_CENTER_PORT),
    apiToken,
    demoToken,
    demoHmacKey,
    corsOrigins: parseOrigins(env.CONTROL_CENTER_CORS_ORIGINS),
    trustProxy: parseTrustProxy(env.CONTROL_CENTER_TRUST_PROXY),
    tls,
    dataKeys,
    activeDataKeyId,
  };
}
