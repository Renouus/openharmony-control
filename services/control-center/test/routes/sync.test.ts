import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app';
import { initDatabase, closeDatabase } from '../../src/db/database';

describe('GET /api/sync', () => {
  let app: any;

  beforeEach(() => {
    initDatabase(':memory:');
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
    closeDatabase();
  });

  it('should return sync data', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/sync?lastVersion=0',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('currentVersion');
    expect(payload).toHaveProperty('devices');
  });
});
