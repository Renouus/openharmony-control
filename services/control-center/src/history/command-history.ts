/**
 * 命令历史存储 —— 内存中的命令执行记录。
 *
 * 新记录插入头部（unshift），list() 返回最近 N 条（默认 20）。
 */
import type {
  CommandHistoryEntry,
  CommandStatusName,
  DeviceCommandName,
} from "@smart-home/device-contract";

export class CommandHistory {
  private readonly entries: CommandHistoryEntry[] = [];

  /** 添加一条命令执行记录并返回完整的 CommandHistoryEntry */
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

  /** 获取最近 limit 条记录（默认 20） */
  list(limit = 20): CommandHistoryEntry[] {
    return this.entries.slice(0, limit);
  }
}
