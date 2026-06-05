/**
 * 安全信封模块 —— HMAC-SHA256 命令签名与重放保护。
 *
 * 安全策略：
 * 1. 每次命令附带唯一 nonce（UUID v4）和当前时间戳
 * 2. 使用共享密钥对 { command, nonce } 做 HMAC-SHA256 签名
 * 3. 验证时检查时间窗口（5 分钟）、签名匹配、nonce 未重放
 * 4. ReplayGuard 自动清理超过 5 分钟的过期 nonce
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { DeviceCommand } from "@smart-home/device-contract";
import type { SignedCommandEnvelope } from "@smart-home/device-contract/security";

/** 签名有效时间窗口：5 分钟 */
const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * 重放攻击防护器。
 * 维护已使用 nonce 的内存缓存，自动清理过期条目。
 */
export class ReplayGuard {
  /** nonce → 首次使用时间戳 */
  private readonly seen = new Map<string, number>();

  /**
   * 尝试接受一个 nonce。
   * @returns true 表示首次使用，false 表示已被重放
   */
  accept(nonce: string, now = Date.now()): boolean {
    this.prune(now);
    if (this.seen.has(nonce)) {
      return false;
    }

    this.seen.set(nonce, now);
    return true;
  }

  /** 清理超过 5 分钟的过期 nonce */
  private prune(now: number): void {
    for (const [nonce, createdAt] of this.seen.entries()) {
      if (now - createdAt > FIVE_MINUTES_MS) {
        this.seen.delete(nonce);
      }
    }
  }
}

/**
 * 对命令进行 HMAC-SHA256 签名，生成签名信封。
 * @param command 原始命令对象
 * @param secret 共享密钥
 * @param nonce 一次性随机数（默认自动生成 UUID）
 */
export function signCommand(
  command: DeviceCommand,
  secret: string,
  nonce = randomUUID(),
): SignedCommandEnvelope {
  return {
    command,
    nonce,
    signature: createSignature(command, nonce, secret),
  };
}

/**
 * 验证签名信封的完整性和合法性。
 * 检查：结构合法 → 时间窗口 → 签名匹配 → nonce 未重放
 */
export function verifyEnvelope(
  value: unknown,
  secret: string,
  replayGuard: ReplayGuard,
): value is SignedCommandEnvelope {
  if (!isEnvelope(value)) {
    return false;
  }

  // 时间窗口校验（超过 5 分钟则拒绝）
  if (Math.abs(Date.now() - value.command.timestamp) > FIVE_MINUTES_MS) {
    return false;
  }

  // 签名比对（使用 timingSafeEqual 防止时序攻击）
  const expected = createSignature(value.command, value.nonce, secret);
  const received = Buffer.from(value.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (
    received.length !== expectedBuffer.length ||
    !timingSafeEqual(received, expectedBuffer)
  ) {
    return false;
  }

  // 重放检测
  return replayGuard.accept(value.nonce);
}

/** 计算 { command, nonce } 的 HMAC-SHA256 签名（hex 格式） */
function createSignature(
  command: DeviceCommand,
  nonce: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(JSON.stringify({ command, nonce }))
    .digest("hex");
}

/** 类型守卫：验证值是否为合法 SignedCommandEnvelope 结构 */
function isEnvelope(value: unknown): value is SignedCommandEnvelope {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const envelope = value as Partial<SignedCommandEnvelope>;
  return (
    typeof envelope.nonce === "string" &&
    typeof envelope.signature === "string" &&
    typeof envelope.command === "object" &&
    envelope.command !== null
  );
}
