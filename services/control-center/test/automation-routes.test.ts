import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { ProviderDeviceStore } from '../src/devices/provider-device-store';
import { closeDatabase, getDb, initDatabase } from '../src/db/database';

describe('automation routes', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('lists db-backed automation rules', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/api/automations' });

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

    const createResponse = await app.inject({
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

    const updateResponse = await app.inject({
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

    const listResponse = await app.inject({ method: 'GET', url: '/api/automations' });
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

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/automations/${created.id}`,
    });
    expect(deleteResponse.statusCode).toBe(204);

    const finalList = await app.inject({ method: 'GET', url: '/api/automations' });
    expect(finalList.json().automations.find((automation: { id: string }) => automation.id === created.id)).toBeUndefined();
  });

  it('executes a device_command automation after a matching device_state_changed event', async () => {
    const app = buildApp();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/automations',
      payload: {
        icon: 'auto_awesome',
        name: 'Unlock On Light',
        triggerType: 'device',
        triggerJson: '[{"type":"device","deviceId":"light-living-room","property":"power","operator":"==","threshold":"true"}]',
        actionJson: '[{"type":"device","deviceId":"door-front","command":"lock:false","label":"Unlock front door"}]',
        enabled: true,
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const signResponse = await app.inject({
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

    const executeResponse = await app.inject({
      method: 'POST',
      url: '/api/commands',
      payload: signResponse.json(),
    });

    expect(executeResponse.statusCode).toBe(200);

    const devicesResponse = await app.inject({ method: 'GET', url: '/api/devices' });
    const door = devicesResponse.json().devices.find((device: { id: string }) => device.id === 'door-front');
    expect(door.state.locked).toBe(false);
  });

  it('rejects pending devices when creating automations', async () => {
    const store = new ProviderDeviceStore(getDb());
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
    const response = await app.inject({
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
});
