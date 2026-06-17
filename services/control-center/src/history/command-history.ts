import type {
  CommandHistoryEntry,
  CommandStatusName,
  DeviceCommandName,
} from "@smart-home/device-contract";
import { getDb } from "../db/database";

type HistoryRow = {
  id: string;
  request_id: string | null;
  device_id: string;
  command_name: DeviceCommandName;
  status: CommandStatusName;
  message: string;
  created_at: number;
};

export class CommandHistory {
  private readonly entries: CommandHistoryEntry[] = [];

  add(input: {
    requestId: string;
    deviceId: string;
    commandName: DeviceCommandName;
    status: CommandStatusName;
    message: string;
  }): CommandHistoryEntry {
    const entry: CommandHistoryEntry = {
      id: `hist-${this.entries.length + 1}`,
      createdAt: Date.now(),
      ...input,
    };

    this.entries.unshift(entry);
    persistHistoryEntry(entry);
    return entry;
  }

  list(limit = 20): CommandHistoryEntry[] {
    const persistedEntries = loadPersistedEntries(limit);
    if (persistedEntries.length > 0) {
      return persistedEntries;
    }
    return this.entries.slice(0, limit);
  }
}

function persistHistoryEntry(entry: CommandHistoryEntry): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO history (id, request_id, device_id, command_name, status, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.requestId,
      entry.deviceId,
      entry.commandName,
      entry.status,
      entry.message,
      entry.createdAt,
    );
  } catch {
    // The DB is optional in tests that exercise in-memory behavior only.
  }
}

function loadPersistedEntries(limit: number): CommandHistoryEntry[] {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, request_id, device_id, command_name, status, message, created_at
      FROM history
      ORDER BY created_at DESC, rowid DESC
      LIMIT ?
    `).all(limit) as HistoryRow[];

    return rows.map((row) => ({
      id: row.id,
      requestId: row.request_id ?? row.id,
      deviceId: row.device_id,
      commandName: row.command_name,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}
