import { DatabaseHelper } from './db/DatabaseHelper';
import { DevicePreferenceDao, DevicePreferenceEntry } from './db/DevicePreferenceDao';

export class DevicePreferenceService {
  private static readonly dao: DevicePreferenceDao = new DevicePreferenceDao();

  public static async setString(deviceId: string, key: string, value: string): Promise<void> {
    try {
      const store = DatabaseHelper.getInstance().getStore();
      await DevicePreferenceService.dao.setPreference(store, deviceId, key, value);
    } catch (e) {
      console.error(`DevicePreferenceService.setString failed [${deviceId}/${key}]: ${e}`);
    }
  }

  public static async getString(deviceId: string, key: string, defaultValue: string = ''): Promise<string> {
    try {
      const store = DatabaseHelper.getInstance().getStore();
      const value = await DevicePreferenceService.dao.getPreference(store, deviceId, key);
      return value !== undefined ? value : defaultValue;
    } catch (e) {
      console.error(`DevicePreferenceService.getString failed [${deviceId}/${key}]: ${e}`);
      return defaultValue;
    }
  }

  public static async setJSON(deviceId: string, key: string, value: Object): Promise<void> {
    try {
      const json = JSON.stringify(value);
      await DevicePreferenceService.setString(deviceId, key, json);
    } catch (e) {
      console.error(`DevicePreferenceService.setJSON failed [${deviceId}/${key}]: ${e}`);
    }
  }

  public static async getJSON<T>(deviceId: string, key: string): Promise<T | undefined> {
    try {
      const json = await DevicePreferenceService.getString(deviceId, key, '');
      if (json.length === 0) {
        return undefined;
      }
      return JSON.parse(json) as T;
    } catch (e) {
      console.error(`DevicePreferenceService.getJSON parse failed [${deviceId}/${key}]: ${e}`);
      return undefined;
    }
  }

  public static async setBatch(deviceId: string, entries: Record<string, string>): Promise<void> {
    try {
      const store = DatabaseHelper.getInstance().getStore();
      const entryList: DevicePreferenceEntry[] = [];
      const keys = Object.keys(entries);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const entry: DevicePreferenceEntry = { key: k, value: entries[k] };
        entryList.push(entry);
      }
      await DevicePreferenceService.dao.setPreferencesBatch(store, deviceId, entryList);
    } catch (e) {
      console.error(`DevicePreferenceService.setBatch failed [${deviceId}]: ${e}`);
    }
  }

  public static async getAll(deviceId: string): Promise<Map<string, string>> {
    try {
      const store = DatabaseHelper.getInstance().getStore();
      return await DevicePreferenceService.dao.getAllPreferences(store, deviceId);
    } catch (e) {
      console.error(`DevicePreferenceService.getAll failed [${deviceId}]: ${e}`);
      return new Map<string, string>();
    }
  }

  public static async delete(deviceId: string, key: string): Promise<void> {
    try {
      const store = DatabaseHelper.getInstance().getStore();
      await DevicePreferenceService.dao.deletePreference(store, deviceId, key);
    } catch (e) {
      console.error(`DevicePreferenceService.delete failed [${deviceId}/${key}]: ${e}`);
    }
  }

  public static async deleteAll(deviceId: string): Promise<void> {
    try {
      const store = DatabaseHelper.getInstance().getStore();
      await DevicePreferenceService.dao.deleteAllPreferences(store, deviceId);
    } catch (e) {
      console.error(`DevicePreferenceService.deleteAll failed [${deviceId}]: ${e}`);
    }
  }
}
