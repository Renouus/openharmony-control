import type {
  CommandHistoryEntry,
  CommandStatusName,
  DeviceCommandName,
} from "@smart-home/device-contract";

export class CommandHistory {
  private readonly entries: CommandHistoryEntry[] = [];

  add(input: {
    requestId: string;
    deviceId: string;
    commandName: DeviceCommandName;
    status: CommandStatusName;
    message: string;
  }): CommandHistoryEntry {
    const entry = {
      id: `hist-${this.entries.length + 1}`,
      createdAt: Date.now(),
      ...input,
    };
    this.entries.unshift(entry);
    return entry;
  }

  list(limit = 20): CommandHistoryEntry[] {
    return this.entries.slice(0, limit);
  }
}
