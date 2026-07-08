import type { FastifyInstance } from 'fastify';
import {
  collectAutomationTransportDeviceIds,
  normalizeAutomationTransport,
} from '../automation/automation-normalization';
import type { AutomationRuntime } from '../automation/automation-runtime';
import { getDb } from '../db/database';
import {
  assertDevicesAreActive,
  InactiveDeviceReferenceError,
} from '../devices/device-lifecycle-guard';

type AutomationRow = {
  id: string;
  icon: string | null;
  name: string;
  trigger_type: string;
  trigger_json: string;
  action_json: string;
  enabled: number;
  updated_at: number;
  version: number;
  is_deleted: number;
};

type AutomationDescriptor = {
  id: string;
  icon?: string;
  name: string;
  triggerType: string;
  triggerJson: string;
  actionJson: string;
  enabled: boolean;
};

export async function registerAutomationRoutes(app: FastifyInstance): Promise<void> {
  const runtime = (app as FastifyInstance & { automationRuntime: AutomationRuntime }).automationRuntime;

  app.get('/api/automations', async () => {
    return {
      automations: listAutomations(),
    };
  });

  app.post('/api/automations', async (request, reply) => {
    const body = request.body as Partial<AutomationDescriptor>;
    if (!body?.name || !body.triggerType || !body.triggerJson || !body.actionJson) {
      return reply.code(400).send({ code: 'INVALID_PAYLOAD' });
    }
    const normalized = normalizeAutomationTransport({
      triggerType: body.triggerType,
      triggerJson: body.triggerJson,
      actionJson: body.actionJson,
    });
    try {
      assertDevicesAreActive(
        collectAutomationTransportDeviceIds({
          triggerType: normalized.triggerType,
          triggerJson: normalized.triggerJson,
          actionJson: normalized.actionJson,
        }),
      );
    } catch (error) {
      if (error instanceof InactiveDeviceReferenceError) {
        return reply.code(409).send({
          code: 'PENDING_DEVICE_NOT_ALLOWED',
          deviceId: error.deviceId,
        });
      }
      throw error;
    }

    const automation = createAutomation({
      icon: body.icon,
      name: body.name,
      triggerType: normalized.triggerType,
      triggerJson: normalized.triggerJson,
      actionJson: normalized.actionJson,
      enabled: body.enabled ?? true,
    });
    if (automation.enabled) {
      await runtime.reload(automation.id);
    }
    return reply.code(201).send({ automation });
  });

  app.put('/api/automations/:automationId', async (request, reply) => {
    const { automationId } = request.params as { automationId: string };
    const body = request.body as Partial<AutomationDescriptor>;
    let automation: AutomationDescriptor | undefined;
    try {
      automation = updateAutomation(automationId, body);
    } catch (error) {
      if (error instanceof InactiveDeviceReferenceError) {
        return reply.code(409).send({
          code: 'PENDING_DEVICE_NOT_ALLOWED',
          deviceId: error.deviceId,
        });
      }
      throw error;
    }
    if (!automation) {
      return reply.code(404).send({ code: 'AUTOMATION_NOT_FOUND' });
    }
    await runtime.reload(automation.id);
    return { automation };
  });

  app.delete('/api/automations/:automationId', async (request, reply) => {
    const { automationId } = request.params as { automationId: string };
    const success = deleteAutomation(automationId);
    if (!success) {
      return reply.code(404).send({ code: 'AUTOMATION_NOT_FOUND' });
    }
    runtime.unload(automationId);
    return reply.code(204).send();
  });
}

function listAutomations(): AutomationDescriptor[] {
  seedBuiltInAutomations();
  const db = getDb();
  const rows = db.prepare(`
    SELECT *
    FROM automations
    WHERE is_deleted = 0
    ORDER BY updated_at ASC, id ASC
  `).all() as AutomationRow[];
  return rows.map(mapAutomationRow);
}

function createAutomation(payload: Omit<AutomationDescriptor, 'id'>): AutomationDescriptor {
  seedBuiltInAutomations();
  const db = getDb();
  const now = Date.now();
  const version = incrementAndGetVersion(db);
  const id = `automation-${now}`;
  db.prepare(`
    INSERT INTO automations (
      id, icon, name, trigger_type, trigger_json, action_json, enabled, updated_at, version, is_deleted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    id,
    payload.icon ?? null,
    payload.name,
    payload.triggerType,
    payload.triggerJson,
    payload.actionJson,
    payload.enabled ? 1 : 0,
    now,
    version,
  );
  return {
    id,
    ...payload,
  };
}

function updateAutomation(automationId: string, patch: Partial<AutomationDescriptor>): AutomationDescriptor | undefined {
  seedBuiltInAutomations();
  const db = getDb();
  const existing = db.prepare(`
    SELECT *
    FROM automations
    WHERE id = ? AND is_deleted = 0
  `).get(automationId) as AutomationRow | undefined;
  if (!existing) {
    return undefined;
  }

  const base = mapAutomationRow(existing);
  const normalizedPatch = patch.triggerType && patch.triggerJson && patch.actionJson
    ? normalizeAutomationTransport({
        triggerType: patch.triggerType,
        triggerJson: patch.triggerJson,
        actionJson: patch.actionJson,
      })
    : undefined;
  const next: AutomationDescriptor = {
    ...base,
    ...patch,
    ...(normalizedPatch ?? {}),
    id: automationId,
  };
  assertDevicesAreActive(
    collectAutomationTransportDeviceIds({
      triggerType: next.triggerType,
      triggerJson: next.triggerJson,
      actionJson: next.actionJson,
    }),
  );
  const now = Date.now();
  const version = incrementAndGetVersion(db);
  db.prepare(`
    UPDATE automations
    SET icon = ?, name = ?, trigger_type = ?, trigger_json = ?, action_json = ?, enabled = ?, updated_at = ?, version = ?
    WHERE id = ? AND is_deleted = 0
  `).run(
    next.icon ?? null,
    next.name,
    next.triggerType,
    next.triggerJson,
    next.actionJson,
    next.enabled ? 1 : 0,
    now,
    version,
    automationId,
  );
  return next;
}

function deleteAutomation(automationId: string): boolean {
  seedBuiltInAutomations();
  const db = getDb();
  const version = incrementAndGetVersion(db);
  const result = db.prepare(`
    UPDATE automations
    SET is_deleted = 1, updated_at = ?, version = ?
    WHERE id = ? AND is_deleted = 0
  `).run(Date.now(), version, automationId);
  return result.changes > 0;
}

function mapAutomationRow(row: AutomationRow): AutomationDescriptor {
  const normalized = normalizeAutomationTransport({
    triggerType: row.trigger_type,
    triggerJson: row.trigger_json,
    actionJson: row.action_json,
  });
  return {
    id: row.id,
    icon: row.icon ?? undefined,
    name: row.name,
    triggerType: normalized.triggerType,
    triggerJson: normalized.triggerJson,
    actionJson: normalized.actionJson,
    enabled: row.enabled === 1,
  };
}

function seedBuiltInAutomations(): void {
  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(*) AS total FROM automations WHERE is_deleted = 0').get() as { total: number };
  if (countRow.total > 0) {
    return;
  }

  const now = Date.now();
  db.prepare(`
    INSERT OR IGNORE INTO automations (
      id, icon, name, trigger_type, trigger_json, action_json, enabled, updated_at, version, is_deleted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    'night-routine',
    'auto_awesome',
    'Night Routine',
    'time',
    JSON.stringify([{ id: 'seed-time', type: 'time', time: '22:00' }]),
    JSON.stringify([{ id: 'seed-lock', type: 'device_command', deviceId: 'door-front', command: 'lock:true' }]),
    1,
    now,
    1,
  );
}

function incrementAndGetVersion(db: ReturnType<typeof getDb>): number {
  db.prepare("UPDATE metadata SET value = CAST(value AS INTEGER) + 1 WHERE key = 'global_version'").run();
  const versionRow = db.prepare("SELECT value FROM metadata WHERE key = 'global_version'").get() as { value: string };
  return parseInt(versionRow.value, 10);
}
