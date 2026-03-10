import { describe, expect, it } from 'vitest';
import {
  WmsWcsDispatchCommandSchema,
  createWmsWcsIdempotencyKey,
} from './index.js';

describe('WmsWcsDispatchCommandSchema', () => {
  it('normalizes bounded WMS/WCS command payloads', () => {
    const result = WmsWcsDispatchCommandSchema.safeParse({
      sourceSystem: 'wms',
      commandId: 'cmd-100',
      correlationId: 'corr-100',
      commandType: 'allocate_pick',
      facilityId: 'facility-a',
      targetId: 'order-42',
      payload: { lane: 'L1' },
      requestedAt: '2026-03-10T12:00:00.000Z',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.requestedAt.toISOString()).toBe('2026-03-10T12:00:00.000Z');
    expect(result.data.payload).toEqual({ lane: 'L1' });
  });

  it('applies default payload object', () => {
    const result = WmsWcsDispatchCommandSchema.safeParse({
      sourceSystem: 'wcs',
      commandId: 'cmd-101',
      commandType: 'reroute_container',
      facilityId: 'facility-b',
      targetId: 'container-7',
      requestedAt: 1773144000000,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.payload).toEqual({});
  });
});

describe('createWmsWcsIdempotencyKey', () => {
  it('prefers correlation ID when available', () => {
    expect(
      createWmsWcsIdempotencyKey({
        sourceSystem: 'wms',
        commandId: 'cmd-100',
        correlationId: 'corr-100',
      })
    ).toBe('wms:corr-100');
  });

  it('falls back to command ID when correlation ID is absent', () => {
    expect(
      createWmsWcsIdempotencyKey({
        sourceSystem: 'wcs',
        commandId: 'cmd-101',
      })
    ).toBe('wcs:cmd-101');
  });
});
