import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiInject, buildApp, demoInject, createTestEncryptedRepositories } from './helpers/build-test-app';
import { ProviderDeviceStore } from '../src/devices/provider-device-store';
import { closeDatabase, getDb, initDatabase } from './helpers/test-database';

describe('automation routes', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('lists db-backed automation rules', async () => {
    const app = buildApp();
    const response = await apiInject(app, { method: 'GET', url: '/api/automations' });

    expect(response.statusCode).toBe(200);
    expect(response.json().automations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'night-routine',
          name: 'Night Routine',
          triggerType: 'time',
          enabled: true,
        }),
      ]),
    );
  });

  it('creates, updates, and deletes automation rules', async () => {
    const app = buildApp();

    const createResponse = await apiInject(app, {
      method: 'POST',
      url: '/api/automations',
      payload: {
        icon: 'auto_awesome',
        name: 'Door Guard',
        triggerType: 'device',
        triggerJson: '[{"type":"device","deviceId":"door-front","property":"locked","operator":"==","threshold":"false"}]',
        actionJson: '[{"type":"device","deviceId":"door-front","command":"lock:true"}]',
        enabled: true,
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json().automation;
    expect(created).toMatchObject({
      name: 'Door Guard',
      triggerType: 'device_state_changed',
      enabled: true,
    });
    expect(created.actionJson).toContain('"type":"device_command"');

    const updateResponse = await apiInject(app, {
      method: 'PUT',
      url: `/api/automations/${created.id}`,
      payload: {
        enabled: false,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().automation).toMatchObject({
      id: created.id,
      enabled: false,
    });
    expect(updateResponse.json().automation.triggerJson).toContain('"deviceId":"door-front"');
    expect(updateResponse.json().automation.actionJson).toContain('"command":"lock:true"');

    const listResponse = await apiInject(app, { method: 'GET', url: '/api/automations' });
    expect(listResponse.json().automations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          enabled: false,
          triggerType: 'device_state_changed',
          triggerJson: expect.stringContaining('"deviceId":"door-front"'),
          actionJson: expect.stringContaining('"command":"lock:true"'),
        }),
      ]),
    );

    const deleteResponse = await apiInject(app, {
      method: 'DELETE',
      url: `/api/automations/${created.id}`,
    });
    expect(deleteResponse.statusCode).toBe(204);

    const finalList = await apiInject(app, { method: 'GET', url: '/api/automations' });
    expect(finalList.json().automations.find((automation: { id: string }) => automation.id === created.id)).toBeUndefined();
  });

  it('executes an all-condition device command and records success after a matching event', async () => {
    const app = buildApp();

    const createResponse = await apiInject(app, {
      method: 'POST',
      url: '/api/automations',
      payload: {
        icon: 'auto_awesome',
        name: 'Unlock On Light',
        triggerType: 'device',
        triggerJson: JSON.stringify({
          logic: 'all',
          conditions: [
            { type: 'device', deviceId: 'light-living-room', property: 'power', operator: '==', threshold: true },
            { type: 'device', deviceId: 'light-entry', property: 'power', operator: '==', threshold: false },
          ],
        }),
        actionJson: '[{"type":"device","deviceId":"door-front","command":"lock:false","label":"Unlock front door"}]',
        enabled: true,
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const signResponse = await demoInject(app, {
      method: 'POST',
      url: '/api/demo/sign-command',
      payload: {
        requestId: 'trigger-light-on',
        timestamp: Date.now(),
        deviceId: 'light-living-room',
        name: 'switch',
        payload: { on: true },
      },
    });
    expect(signResponse.statusCode).toBe(200);

    const executeResponse = await apiInject(app, {
      method: 'POST',
      url: '/api/commands',
      payload: signResponse.json().command,
    });

    expect(executeResponse.statusCode).toBe(200);

    const devicesResponse = await apiInject(app, { method: 'GET', url: '/api/devices' });
    const door = devicesResponse.json().devices.find((device: { id: string }) => device.id === 'door-front');
    expect(door.state.locked).toBe(false);

    const log = getDb().prepare(`
      SELECT status, reason
      FROM automation_execution_logs
      WHERE automation_id = ? AND status = 'success'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(createResponse.json().automation.id) as { status: string; reason: string };
    expect(log).toEqual({ status: 'success', reason: 'EXECUTED' });
  });

  it('rejects pending devices when creating automations', async () => {
    const store = new ProviderDeviceStore(getDb(), createTestEncryptedRepositories());
    store.upsertDiscoveredDevices([
      {
        provider: 'tuya',
        externalDeviceId: 'light-1',
        originalName: 'Smart Light',
        online: true,
        deviceType: 'light',
        state: {
          power: true,
          brightness: 50,
          colorTemperature: 4000,
          online: true,
          updatedAt: 100,
        },
        capabilities: ['switch', 'brightness', 'color-temperature'],
        status: [],
        functions: [],
        raw: { id: 'light-1' },
      },
    ]);

    const app = buildApp();
    const response = await apiInject(app, {
      method: 'POST',
      url: '/api/automations',
      payload: {
        icon: 'auto_awesome',
        name: 'Pending Guard',
        triggerType: 'device',
        triggerJson: '[{"type":"device","deviceId":"tuya-light-1","property":"power","operator":"==","threshold":"true"}]',
        actionJson: '[{"type":"device","deviceId":"door-front","command":"lock:false"}]',
        enabled: true,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      code: 'PENDING_DEVICE_NOT_ALLOWED',
      deviceId: 'tuya-light-1',
    });
  });

  it('does not execute an all-condition action when another device condition is false', async () => {
    const app = buildApp();
    const createResponse = await apiInject(app, {
      method: 'POST',
      url: '/api/automations',
      payload: {
        name: 'Blocked Entry Rule',
        triggerType: 'device_state_changed',
        triggerJson: JSON.stringify({
          logic: 'all',
          conditions: [
            { type: 'device', deviceId: 'light-living-room', property: 'power', operator: '==', threshold: true },
            { type: 'device', deviceId: 'light-entry', property: 'power', operator: '==', threshold: true },
          ],
        }),
        actionJson: '[{"type":"device_command","deviceId":"door-front","command":"lock:false"}]',
        enabled: true,
      },
    });
    const signResponse = await demoInject(app, {
      method: 'POST',
      url: '/api/demo/sign-command',
      payload: { requestId: 'blocked-light-on', timestamp: Date.now(), deviceId: 'light-living-room', name: 'switch', payload: { on: true } },
    });
    await apiInject(app, { method: 'POST', url: '/api/commands', payload: signResponse.json().command });

    const devicesResponse = await apiInject(app, { method: 'GET', url: '/api/devices' });
    const door = devicesResponse.json().devices.find((device: { id: string }) => device.id === 'door-front');
    expect(door.state.locked).toBe(true);
    const successCount = getDb().prepare(`
      SELECT COUNT(*) AS total FROM automation_execution_logs
      WHERE automation_id = ? AND status = 'success'
    `).get(createResponse.json().automation.id) as { total: number };
    expect(successCount.total).toBe(0);
  });

  it('rejects an invalid boolean condition group', async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: 'POST',
      url: '/api/automations',
      payload: {
        name: 'Invalid Boolean Rule',
        triggerType: 'device_state_changed',
        triggerJson: JSON.stringify({ logic: 'xor', conditions: [] }),
        actionJson: '[{"type":"device_command","deviceId":"door-front","command":"lock:false"}]',
        enabled: true,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: 'AUTOMATION_CONDITION_GROUP_INVALID' });
  });

  it('rejects malformed legacy condition arrays', async () => {
    const app = buildApp();
    const response = await apiInject(app, {
      method: 'POST',
      url: '/api/automations',
      payload: {
        name: 'Malformed Legacy Rule',
        triggerType: 'device_state_changed',
        triggerJson: '[{"type":"device","deviceId":"door-front"}]',
        actionJson: '[{"type":"device_command","deviceId":"door-front","command":"lock:false"}]',
        enabled: true,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: 'AUTOMATION_CONDITION_GROUP_INVALID' });
  });

  it('rejects invalid actions before writing even when the rule is disabled', async () => {
    const app = buildApp();
    const before = (getDb().prepare("SELECT COUNT(*) AS total FROM automations").get() as { total: number }).total;
    const response = await apiInject(app, {
      method: 'POST', url: '/api/automations',
      payload: { name: 'Invalid disabled', triggerType: 'time', triggerJson: '[{"type":"time","time":"22:00"}]', actionJson: '[{"type":"device"}]', enabled: false },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ code: 'AUTOMATION_PAYLOAD_INVALID' });
    expect((getDb().prepare("SELECT COUNT(*) AS total FROM automations").get() as { total: number }).total).toBe(before);
  });

  it('returns a safe 500 when listing a corrupted encrypted automation', async () => {
    const app = buildApp();
    await app.ready();
    getDb().prepare("UPDATE automations SET action_json='ENC1:corrupt' WHERE id='night-routine'").run();
    const response = await apiInject(app, { method: 'GET', url: '/api/automations' });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: 'INTERNAL_SERVER_ERROR' });
    expect(response.body).not.toContain('night-routine');
  });

  it('compensates the inserted row when runtime reload fails', async () => {
    const runtime = {
      dispatch: async () => {}, hasRule: () => false, loadEnabledAutomations: async () => {},
      reload: async () => { throw new Error('runtime reload secret'); }, unload: () => {},
    };
    const app = buildApp(undefined, { automationRuntime: runtime as never });
    const versionBefore = (getDb().prepare("SELECT value FROM metadata WHERE key='global_version'").get() as { value: string }).value;
    const response = await apiInject(app, {
      method: 'POST', url: '/api/automations',
      payload: { name: 'Rollback rule', triggerType: 'time', triggerJson: '[{"type":"time","time":"22:00"}]', actionJson: '[{"type":"scene_run","sceneId":"away"}]', enabled: true },
    });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: 'AUTOMATION_RUNTIME_RELOAD_FAILED' });
    expect((getDb().prepare("SELECT COUNT(*) AS total FROM automations WHERE name='Rollback rule'").get() as { total: number }).total).toBe(0);
    expect((getDb().prepare("SELECT value FROM metadata WHERE key='global_version'").get() as { value: string }).value).toBe(versionBefore);
  });

  it('restores the prior row when an update runtime reload fails', async () => {
    const unload = vi.fn();
    const runtime = {
      dispatch: async () => {}, hasRule: () => true, loadEnabledAutomations: async () => {},
      reload: async () => { throw new Error('runtime reload secret'); }, unload,
    };
    const app = buildApp(undefined, { automationRuntime: runtime as never });
    const before = getDb().prepare("SELECT * FROM automations WHERE id='night-routine'").get();
    const versionBefore = (getDb().prepare("SELECT value FROM metadata WHERE key='global_version'").get() as { value: string }).value;
    const response = await apiInject(app, {
      method: 'PUT', url: '/api/automations/night-routine', payload: { name: 'Changed name' },
    });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ code: 'AUTOMATION_RUNTIME_RELOAD_FAILED' });
    expect(getDb().prepare("SELECT * FROM automations WHERE id='night-routine'").get()).toEqual(before);
    expect((getDb().prepare("SELECT value FROM metadata WHERE key='global_version'").get() as { value: string }).value).toBe(versionBefore);
    expect(unload).toHaveBeenCalledWith('night-routine');
  });
});
