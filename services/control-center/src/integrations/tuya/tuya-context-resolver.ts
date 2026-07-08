import { tuyaConfig } from "./tuya-config";
import { TuyaResolvedDeviceContext, TuyaStatusItem } from "./tuya-types";
import { TuyaConnectorClient, TuyaDeviceDetail } from "./tuya-client";
import { parseTuyaOmniId } from "./tuya-id-parser";
import { classifyTuyaDevice } from "./tuya-device-classifier";

// TTL in ms
const CACHE_DETAIL_TTL = 10 * 60 * 1000; // 10m
const CACHE_STATUS_TTL = 3 * 1000;       // 3s
const CACHE_NEGATIVE_TTL = 10 * 1000;    // 10s

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const detailCache = new Map<string, CacheEntry<TuyaDeviceDetail>>();
const statusCache = new Map<string, CacheEntry<TuyaStatusItem[]>>();
const negativeLimitCache = new Map<string, CacheEntry<boolean>>();

export async function resolveTuyaDeviceContext(
  omniDeviceId: string,
  tuyaClient: TuyaConnectorClient
): Promise<TuyaResolvedDeviceContext | undefined> {
  const parsedId = parseTuyaOmniId(omniDeviceId);
  if (!parsedId) return undefined;

  const tuyaId = parsedId.rawTuyaId;
  const now = Date.now();

  // 1. Check negative cache
  const negativeEntry = negativeLimitCache.get(tuyaId);
  if (negativeEntry && negativeEntry.expiresAt > now) {
    return undefined; // Rate limited recently, fast fail
  }

  try {
    // 2. Resolve or Fetch Detail
    let detail: TuyaDeviceDetail;
    const detailEntry = detailCache.get(tuyaId);
    if (detailEntry && detailEntry.expiresAt > now) {
      detail = detailEntry.data;
    } else {
        // Find config (if any)
      const configItem = tuyaConfig.devices?.find(d => d.id === tuyaId);
      
      detail = await tuyaClient.getDeviceDetail(tuyaId);
      
      // Merge config with detail names etc if we wanted, but detail has name/category
      if (configItem && configItem.name) {
          detail.name = configItem.name;
      }
      
      detailCache.set(tuyaId, {
        data: detail,
        expiresAt: Date.now() + CACHE_DETAIL_TTL,
      });
    }

    // 3. Resolve or Fetch Status
    let status: TuyaStatusItem[];
    const statusEntry = statusCache.get(tuyaId);
    if (statusEntry && statusEntry.expiresAt > Date.now()) {
      status = statusEntry.data;
    } else {
      status = await tuyaClient.getDeviceStatus(tuyaId);
      statusCache.set(tuyaId, {
        data: status,
        expiresAt: Date.now() + CACHE_STATUS_TTL,
      });
    }

    // Find configured info
    const configDesc = tuyaConfig.devices?.find((d) => d.id === tuyaId);

    // 4. Classify device kind
    const kind = classifyTuyaDevice({
      configuredKind: configDesc?.kind,
      category: detail.category,
      status: status,
    });

    if (!kind) {
      // Cannot handle this device
      return undefined;
    }

    return {
      omniDeviceId,
      tuyaDeviceId: tuyaId,
      detail: detail,
      category: detail.category,
      productId: detail.product_id,
      kind: kind,
      status: status,
      capabilities: [],
    };
    } catch (error: unknown) {
    // Basic rate limit handling / error fast-failure cache
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (errorMessage.includes("limit") || errorMessage.includes("failed")) {
        negativeLimitCache.set(tuyaId, {
            data: true,
            expiresAt: Date.now() + CACHE_NEGATIVE_TTL,
        });
    }
    console.error(`Error resolving Tuya context for ${tuyaId}:`, error);
    return undefined;
  }
}

export function invalidateTuyaStatusCache(tuyaDeviceId: string) {
  statusCache.delete(tuyaDeviceId);
}
