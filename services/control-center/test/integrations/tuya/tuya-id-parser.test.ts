import { describe, it, expect } from 'vitest';
import { parseTuyaDeviceId } from '../../../src/integrations/tuya/tuya-id-parser';

describe('parseTuyaDeviceId', () => {
  it('returns the raw string for valid prefix', () => {
    expect(parseTuyaDeviceId('tuya-vdevo123')).toBe('vdevo123');
  });

  it('returns undefined for invalid prefixes', () => {
    expect(parseTuyaDeviceId('vdevo123')).toBeUndefined();
    expect(parseTuyaDeviceId('tuya-')).toBeUndefined();
    expect(parseTuyaDeviceId('other-123')).toBeUndefined();
    expect(parseTuyaDeviceId('tuya-   ')).toBeUndefined();
  });
});
