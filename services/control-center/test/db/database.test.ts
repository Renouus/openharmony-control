import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase, getDb } from '../../src/db/database';

describe('Database Initialization', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('should initialize tables with version column and metadata table', () => {
    const db = getDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);
    
    expect(tableNames).toContain('devices');
    expect(tableNames).toContain('rooms');
    expect(tableNames).toContain('scenes');
    expect(tableNames).toContain('automations');
    expect(tableNames).toContain('history');
    expect(tableNames).toContain('metadata');

    const columns = db.prepare("PRAGMA table_info(devices)").all() as { name: string }[];
    expect(columns.map(c => c.name)).toContain('version');

    const versionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
    expect(versionRow.value).toBe('0');
  });
});
