import { AuthCredentialProvider } from './AuthCredentialProvider';
import huks from '@ohos.security.huks';
import cryptoFramework from '@ohos.security.cryptoFramework';
import preferences from '@ohos.data.preferences';
import common from '@ohos.app.ability.common';
import util from '@ohos.util';

export interface EncryptedCredentialMetadata {
  version: number;
  ciphertext: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
}

export interface HuksAeadAdapter {
  ensureNonExportableAesKey(alias: string): Promise<void>;
  encrypt(alias: string, plaintext: Uint8Array): Promise<EncryptedCredentialMetadata>;
  decrypt(alias: string, metadata: EncryptedCredentialMetadata): Promise<Uint8Array>;
  deleteKey(alias: string): Promise<void>;
}

export interface CiphertextPreferences {
  read(): Promise<EncryptedCredentialMetadata | undefined>;
  write(metadata: EncryptedCredentialMetadata): Promise<void>;
  clear(): Promise<void>;
}

export function encodeCredentialUtf8(value: string): Uint8Array {
  return util.TextEncoder.create('utf-8').encodeInto(value);
}

export function decodeCredentialUtf8(value: Uint8Array): string {
  return util.TextDecoder.create('utf-8').decodeToString(value);
}

// HUKS operations are isolated behind HuksAeadAdapter so the target-SDK API can
// be supplied by the Ability layer and policy can be tested without exporting
// key material. Preferences receive ciphertext metadata only.
export class HuksTokenStore implements AuthCredentialProvider {
  private readonly alias: string = 'omni_home_auth_v1';
  private readonly huks: HuksAeadAdapter;
  private readonly preferences: CiphertextPreferences;
  private cached?: string;

  constructor(huks: HuksAeadAdapter, preferences: CiphertextPreferences) {
    this.huks = huks;
    this.preferences = preferences;
  }

  async getCredential(): Promise<string | undefined> {
    if (this.cached !== undefined) return this.cached;
    const metadata = await this.preferences.read();
    if (metadata === undefined) return undefined;
    const plaintext = await this.huks.decrypt(this.alias, metadata);
    this.cached = decodeCredentialUtf8(plaintext);
    return this.cached;
  }

  async setCredential(value: string): Promise<void> {
    await this.huks.ensureNonExportableAesKey(this.alias);
    const metadata = await this.huks.encrypt(this.alias, encodeCredentialUtf8(value));
    await this.preferences.write(metadata);
    this.cached = value;
  }

  async clearCredential(): Promise<void> {
    this.cached = undefined;
    await this.preferences.clear();
    await this.huks.deleteKey(this.alias);
  }
}

function keyProperties(): Array<huks.HuksParam> {
  const properties: Array<huks.HuksParam> = [];
  properties.push({ tag: huks.HuksTag.HUKS_TAG_ALGORITHM, value: huks.HuksKeyAlg.HUKS_ALG_AES });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_PURPOSE, value: huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_ENCRYPT | huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_DECRYPT });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_KEY_SIZE, value: huks.HuksKeySize.HUKS_AES_KEY_SIZE_256 });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_BLOCK_MODE, value: huks.HuksCipherMode.HUKS_MODE_GCM });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_PADDING, value: huks.HuksKeyPadding.HUKS_PADDING_NONE });
  return properties;
}

function operationProperties(purpose: huks.HuksKeyPurpose, iv: Uint8Array, tag?: Uint8Array): Array<huks.HuksParam> {
  const properties: Array<huks.HuksParam> = [];
  properties.push({ tag: huks.HuksTag.HUKS_TAG_ALGORITHM, value: huks.HuksKeyAlg.HUKS_ALG_AES });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_PURPOSE, value: purpose });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_BLOCK_MODE, value: huks.HuksCipherMode.HUKS_MODE_GCM });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_PADDING, value: huks.HuksKeyPadding.HUKS_PADDING_NONE });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_NONCE, value: iv });
  properties.push({ tag: huks.HuksTag.HUKS_TAG_AE_TAG_LEN, value: 128 });
  if (tag !== undefined) properties.push({ tag: huks.HuksTag.HUKS_TAG_AE_TAG, value: tag });
  return properties;
}

export class PlatformHuksAeadAdapter implements HuksAeadAdapter {
  async ensureNonExportableAesKey(alias: string): Promise<void> {
    if (!await huks.isKeyItemExist(alias, { properties: keyProperties() })) {
      await huks.generateKeyItem(alias, { properties: keyProperties() });
    }
  }

  async encrypt(alias: string, plaintext: Uint8Array): Promise<EncryptedCredentialMetadata> {
    const iv = cryptoFramework.createRandom().generateRandomSync(12).data;
    const properties = operationProperties(huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_ENCRYPT, iv);
    const session = await huks.initSession(alias, { properties: properties });
    const result = await huks.finishSession(session.handle, { properties: properties, inData: plaintext });
    const combined = result.outData === undefined ? new Uint8Array() : result.outData;
    if (combined.length < 16) throw new Error('HUKS_ENCRYPTION_RESULT_INVALID');
    const ciphertext = combined.slice(0, combined.length - 16);
    const tag = combined.slice(combined.length - 16);
    return { version: 1, ciphertext: ciphertext, iv: iv, tag: tag };
  }

  async decrypt(alias: string, metadata: EncryptedCredentialMetadata): Promise<Uint8Array> {
    const properties = operationProperties(huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_DECRYPT, metadata.iv, metadata.tag);
    const session = await huks.initSession(alias, { properties: properties });
    const result = await huks.finishSession(session.handle, { properties: properties, inData: metadata.ciphertext });
    if (result.outData === undefined) throw new Error('HUKS_DECRYPTION_RESULT_INVALID');
    return result.outData;
  }

  async deleteKey(alias: string): Promise<void> {
    if (await huks.isKeyItemExist(alias, { properties: keyProperties() })) {
      await huks.deleteKeyItem(alias, { properties: keyProperties() });
    }
  }
}

export class PrivateCiphertextPreferences implements CiphertextPreferences {
  private readonly context: common.Context;
  constructor(context: common.Context) { this.context = context; }

  private async store(): Promise<preferences.Preferences> {
    return preferences.getPreferences(this.context, 'secure_auth_ciphertext');
  }

  async read(): Promise<EncryptedCredentialMetadata | undefined> {
    const store = await this.store();
    const version = await store.get('version', 0) as number;
    if (version !== 1) return undefined;
    const ciphertext = await store.get('ciphertext', new Uint8Array()) as Uint8Array;
    const iv = await store.get('iv', new Uint8Array()) as Uint8Array;
    const tag = await store.get('tag', new Uint8Array()) as Uint8Array;
    if (ciphertext.length === 0 || iv.length === 0 || tag.length === 0) return undefined;
    return { version: version, ciphertext: ciphertext, iv: iv, tag: tag };
  }

  async write(metadata: EncryptedCredentialMetadata): Promise<void> {
    const store = await this.store();
    await store.put('version', metadata.version);
    await store.put('ciphertext', metadata.ciphertext);
    await store.put('iv', metadata.iv);
    await store.put('tag', metadata.tag);
    await store.flush();
  }

  async clear(): Promise<void> {
    const store = await this.store();
    await store.delete('version');
    await store.delete('ciphertext');
    await store.delete('iv');
    await store.delete('tag');
    await store.flush();
  }
}

export function createPlatformHuksTokenStore(context: common.Context): HuksTokenStore {
  return new HuksTokenStore(new PlatformHuksAeadAdapter(), new PrivateCiphertextPreferences(context));
}
