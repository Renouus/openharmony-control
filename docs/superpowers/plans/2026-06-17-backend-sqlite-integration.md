# Backend SQLite Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement SQLite persistence in the Node.js backend using `better-sqlite3`, refactor existing in-memory registries to use it, and introduce version-based sync and WebSocket endpoints. Addresses robust versioning, soft-delete semantics, dependency injection, and WebSocket isolation.

**Architecture:** We will initialize a `better-sqlite3` database on startup with the required tables (`devices`, `rooms`, `scenes`, `automations`, `history`, `metadata`). We will build a `DatabaseService` (via DI) for all operations, replace the in-memory maps in our registries, add `@fastify/websocket` with connection isolation, and add the `/api/sync` endpoint for robust version-based diffs.

**Tech Stack:** Node.js, Fastify, `better-sqlite3`, `@fastify/websocket`, Vitest.

---

### Task 1: Setup better-sqlite3 and Database Initialization

**Files:**
- Create: `services/control-center/src/db/database.ts`
- Modify: `services/control-center/package.json`
- Test: `services/control-center/test/db/database.test.ts`

- [ ] **Step 1: Install dependencies**
```bash
cd services/control-center
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

- [ ] **Step 2: Write the failing test**
Create `services/control-center/test/db/database.test.ts`:
```typescript
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
```

- [ ] **Step 3: Run test to verify it fails**
Run: `npm run test -- test/db/database.test.ts`
Expected: FAIL with "Cannot find module '../../src/db/database'"

- [ ] **Step 4: Write minimal implementation**
Create `services/control-center/src/db/database.ts`:
```typescript
import Database from 'better-sqlite3';

let dbInstance: Database.Database | null = null;

export function initDatabase(dbPath: string = 'smarthome.db'): Database.Database {
  dbInstance = new Database(dbPath);
  
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO metadata (key, value) VALUES ('global_version', '0');

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      room_id TEXT,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      built_in INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      updated_at INTEGER NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_json TEXT NOT NULL,
      action_json TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      updated_at INTEGER NOT NULL,
      version INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      command_name TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  
  return dbInstance;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**
Run: `npm run test -- test/db/database.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json services/control-center/src/db/database.ts services/control-center/test/db/database.test.ts
git commit -m "feat(backend): setup better-sqlite3 with metadata versioning"
```

---

### Task 2: Implement DatabaseService for Sync API

**Files:**
- Create: `services/control-center/src/db/database-service.ts`
- Test: `services/control-center/test/db/database-service.test.ts`

- [ ] **Step 1: Write the failing test**
Create `services/control-center/test/db/database-service.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase, getDb } from '../../src/db/database';
import { DatabaseService } from '../../src/db/database-service';

describe('DatabaseService', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  it('should return changes since a given version and correctly read global_version', () => {
    const db = getDb();
    const service = new DatabaseService(db);
    
    // Simulate updating global version and inserting a deleted device
    db.prepare("UPDATE metadata SET value = '10' WHERE key = 'global_version'").run();
    db.prepare(
      "INSERT INTO devices (id, name, type, room_id, state_json, updated_at, version, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run('dev-1', 'Light 1', 'light', 'room-1', '{}', Date.now(), 10, 1);

    const syncResult = service.getSyncData(5);
    
    expect(syncResult.currentVersion).toBe(10);
    expect(syncResult.devices).toHaveLength(1);
    expect(syncResult.devices[0].is_deleted).toBe(1); // Validates deletion sync semantics
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test -- test/db/database-service.test.ts`
Expected: FAIL with "DatabaseService is not defined"

- [ ] **Step 3: Write minimal implementation**
Create `services/control-center/src/db/database-service.ts`:
```typescript
import Database from 'better-sqlite3';

export interface SyncResponse {
  currentVersion: number;
  devices: any[];
  rooms: any[];
  scenes: any[];
  automations: any[];
}

export class DatabaseService {
  private db: Database.Database;

  // DI: Dependency Injection over Singleton binding
  constructor(db: Database.Database) {
    this.db = db;
  }

  public getSyncData(lastVersion: number): SyncResponse {
    // Queries will natively return records where is_deleted = 1 if they were updated
    const devices = this.db.prepare('SELECT * FROM devices WHERE version > ?').all(lastVersion);
    const rooms = this.db.prepare('SELECT * FROM rooms WHERE version > ?').all(lastVersion);
    const scenes = this.db.prepare('SELECT * FROM scenes WHERE version > ?').all(lastVersion);
    const automations = this.db.prepare('SELECT * FROM automations WHERE version > ?').all(lastVersion);

    // Reliable currentVersion calculation from unified metadata
    const versionRow = this.db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
    const currentVersion = parseInt(versionRow.value, 10);

    return {
      currentVersion,
      devices,
      rooms,
      scenes,
      automations
    };
  }

  // Helper for transactions: increments global version and returns it
  public incrementAndGetVersion(): number {
    this.db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
    const versionRow = this.db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
    return parseInt(versionRow.value, 10);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm run test -- test/db/database-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add services/control-center/src/db/database-service.ts services/control-center/test/db/database-service.test.ts
git commit -m "feat(backend): implement DatabaseService with DI and robust version sync"
```

---

### Task 3: Add /api/sync Endpoint

**Files:**
- Create: `services/control-center/src/routes/sync.ts`
- Modify: `services/control-center/src/app.ts`

- [ ] **Step 1: Write the failing test**
Create `services/control-center/test/routes/sync.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm run test -- test/routes/sync.test.ts`
Expected: FAIL with 404 Route Not Found

- [ ] **Step 3: Write minimal implementation**
Create `services/control-center/src/routes/sync.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import { DatabaseService } from '../db/database-service';
import { getDb } from '../db/database';

export default async function syncRoutes(fastify: FastifyInstance) {
  fastify.get('/api/sync', async (request, reply) => {
    const dbService = new DatabaseService(getDb());
    const query = request.query as { lastVersion?: string };
    const lastVersion = query.lastVersion ? parseInt(query.lastVersion, 10) : 0;
    
    const syncData = dbService.getSyncData(lastVersion);
    return reply.send(syncData);
  });
}
```

Modify `services/control-center/src/app.ts`:
```typescript
// Add to imports:
import syncRoutes from './routes/sync';

// Add inside buildApp function (around line 30, where routes are registered):
app.register(syncRoutes);
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm run test -- test/routes/sync.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add services/control-center/src/routes/sync.ts services/control-center/src/app.ts services/control-center/test/routes/sync.test.ts
git commit -m "feat(backend): add /api/sync endpoint"
```

---

### Task 4: Setup Fastify WebSocket with Isolation

**Files:**
- Modify: `services/control-center/package.json`
- Modify: `services/control-center/src/app.ts`
- Create: `services/control-center/src/routes/websocket.ts`

- [ ] **Step 1: Install dependencies**
```bash
cd services/control-center
npm install @fastify/websocket
```

- [ ] **Step 2: Write minimal implementation**
Create `services/control-center/src/routes/websocket.ts`:
```typescript
import { FastifyInstance, FastifyRequest } from 'fastify';

// Isolation mapping: clientId -> connection
export const clientConnections = new Map<string, any>();

export function broadcastEvent(event: string, payload: any, targetClientId?: string) {
  const message = JSON.stringify({ event, payload });
  
  if (targetClientId) {
    // Targeted push
    const connection = clientConnections.get(targetClientId);
    if (connection && connection.readyState === 1) {
      connection.send(message);
    }
  } else {
    // Broadcast to all authorized clients
    for (const [_, connection] of clientConnections.entries()) {
      if (connection.readyState === 1) { // OPEN
        connection.send(message);
      }
    }
  }
}

export default async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get('/ws/events', { websocket: true }, (connection, req: FastifyRequest) => {
    // Basic isolation via query param (can be upgraded to JWT auth later)
    const query = req.query as { clientId?: string };
    const clientId = query.clientId || `anon-${Date.now()}`;
    
    clientConnections.set(clientId, connection.socket);
    
    connection.socket.on('close', () => {
      clientConnections.delete(clientId);
    });
  });
}
```

Modify `services/control-center/src/app.ts`:
```typescript
// Add to imports:
import websocketPlugin from '@fastify/websocket';
import websocketRoutes from './routes/websocket';

// Add inside buildApp function BEFORE route registrations:
app.register(websocketPlugin);

// Add inside buildApp function WHERE routes are registered:
app.register(websocketRoutes);
```

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json services/control-center/src/app.ts services/control-center/src/routes/websocket.ts
git commit -m "feat(backend): setup fastify websocket with basic isolation"
```

---

### Task 5: Initialize DB on Startup

**Files:**
- Modify: `services/control-center/src/server.ts`

- [ ] **Step 1: Write minimal implementation**
Modify `services/control-center/src/server.ts` to initialize DB before listening:
```typescript
import { readFileSync } from "node:fs";
import { buildApp } from "./app";
import { initDatabase } from "./db/database"; // ADDED

const port = Number(process.env.CONTROL_CENTER_PORT ?? 3443);
const host = process.env.CONTROL_CENTER_HOST ?? "0.0.0.0";
const app = buildApp();

async function main(): Promise<void> {
  // ADDED
  const dbPath = process.env.DATABASE_PATH || 'smarthome.db';
  initDatabase(dbPath);
  app.log.info(`Database initialized at ${dbPath}`);

  const tlsCertPath = process.env.TLS_CERT_PATH;
  const tlsKeyPath = process.env.TLS_KEY_PATH;
  // ... rest of the file
```

- [ ] **Step 2: Run server locally to verify**
Run: `npm run dev`
Verify server starts and `smarthome.db` is created in root.
Stop server (Ctrl+C).

- [ ] **Step 3: Commit**
```bash
git add services/control-center/src/server.ts
git commit -m "feat(backend): initialize database on server startup"
```
