/**
 * 安全信封类型 —— HMAC-SHA256 签名后的命令包结构。
 *
 * 包含原始命令（command）、一次性随机数（nonce）和 hex 格式签名（signature），
 * 供前后端传输时防止篡改和重放攻击。
 */
import type { DeviceCommand } from "./device";

export type SignedCommandEnvelope = {
  command: DeviceCommand;
  /** UUID v4 一次性随机数 */
  nonce: string;
  /** HMAC-SHA256(JSON({ command, nonce }), secret) 的 hex 结果 */
  signature: string;
};
