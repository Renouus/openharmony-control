import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { closeDatabase, initDatabase } from '../src/db/database';

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
      triggerType: 'device',
      enabled: true,
    });

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

    const listResponse = await app.inject({ method: 'GET', url: '/api/automations' });
    expect(listResponse.json().automations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          enabled: false,
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
});
