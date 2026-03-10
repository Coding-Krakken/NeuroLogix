/**
 * Tests for canonical asset schemas
 */
import { describe, it, expect } from 'vitest';
import {
  ASSET_TYPE,
  ASSET_STATUS,
  AssetTypeSchema,
  AssetStatusSchema,
  AssetSchema,
  AssetTelemetryLinkSchema,
  AssetMaintenanceWindowSchema,
  AssetQuerySchema,
} from './index.js';

describe('ASSET_TYPE', () => {
  it('defines all industrial asset types', () => {
    expect(ASSET_TYPE.PLC).toBe('plc');
    expect(ASSET_TYPE.CAMERA).toBe('camera');
    expect(ASSET_TYPE.SENSOR).toBe('sensor');
    expect(ASSET_TYPE.CONVEYOR).toBe('conveyor');
    expect(ASSET_TYPE.ROBOT).toBe('robot');
    expect(ASSET_TYPE.DOCK).toBe('dock');
    expect(ASSET_TYPE.WORKSTATION).toBe('workstation');
    expect(ASSET_TYPE.AGV).toBe('agv');
    expect(ASSET_TYPE.RFID_READER).toBe('rfid_reader');
  });
});

describe('ASSET_STATUS', () => {
  it('defines all lifecycle status values', () => {
    expect(ASSET_STATUS.ONLINE).toBe('online');
    expect(ASSET_STATUS.OFFLINE).toBe('offline');
    expect(ASSET_STATUS.MAINTENANCE).toBe('maintenance');
    expect(ASSET_STATUS.ERROR).toBe('error');
    expect(ASSET_STATUS.COMMISSIONING).toBe('commissioning');
    expect(ASSET_STATUS.DECOMMISSIONED).toBe('decommissioned');
  });
});

describe('AssetTypeSchema', () => {
  it('accepts all valid types', () => {
    for (const t of Object.values(ASSET_TYPE)) {
      expect(AssetTypeSchema.parse(t)).toBe(t);
    }
  });

  it('rejects unknown types', () => {
    expect(() => AssetTypeSchema.parse('printer')).toThrow();
  });
});

describe('AssetStatusSchema', () => {
  it('accepts all valid statuses', () => {
    for (const s of Object.values(ASSET_STATUS)) {
      expect(AssetStatusSchema.parse(s)).toBe(s);
    }
  });

  it('rejects unknown status values', () => {
    expect(() => AssetStatusSchema.parse('degraded')).toThrow();
  });
});

describe('AssetSchema', () => {
  const validAsset = {
    id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    name: 'Conveyor A',
    type: ASSET_TYPE.CONVEYOR,
    zone: 'ZONE-01',
  };

  it('accepts a minimal valid asset', () => {
    const result = AssetSchema.parse(validAsset);
    expect(result.name).toBe('Conveyor A');
    expect(result.type).toBe('conveyor');
    expect(result.zone).toBe('ZONE-01');
    expect(result.status).toBe('online');
    expect(result.tags).toEqual([]);
    expect(result.metadata).toEqual({});
  });

  it('accepts a fully-specified asset', () => {
    const full = {
      ...validAsset,
      siteId: 'site-01',
      lineId: 'line-A',
      serialNumber: 'SN-12345',
      manufacturer: 'Fanuc',
      model: 'M-10iA',
      firmwareVersion: '2.3.1',
      status: ASSET_STATUS.MAINTENANCE,
      ipAddress: '192.168.1.100',
      plcAddress: '%MW100',
      mqttTopic: 'site/line-A/conveyor-A/telemetry',
      tags: ['critical', 'line-A'],
      metadata: { maxSpeedRpm: 3000 },
    };
    const result = AssetSchema.parse(full);
    expect(result.status).toBe('maintenance');
    expect(result.manufacturer).toBe('Fanuc');
    expect(result.tags).toContain('critical');
  });

  it('rejects assets with empty zone', () => {
    expect(() => AssetSchema.parse({ ...validAsset, zone: '' })).toThrow();
  });

  it('rejects assets with invalid type', () => {
    expect(() => AssetSchema.parse({ ...validAsset, type: 'printer' })).toThrow();
  });
});

describe('AssetTelemetryLinkSchema', () => {
  it('accepts a valid telemetry link', () => {
    const link = {
      assetId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
      topics: ['site/line-A/conveyor-A/telemetry'],
    };
    const result = AssetTelemetryLinkSchema.parse(link);
    expect(result.samplingIntervalMs).toBe(1000);
    expect(result.topics).toHaveLength(1);
  });

  it('rejects links with no topics', () => {
    expect(() =>
      AssetTelemetryLinkSchema.parse({
        assetId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
        topics: [],
      })
    ).toThrow();
  });
});

describe('AssetMaintenanceWindowSchema', () => {
  const now = new Date();
  const later = new Date(now.getTime() + 3600 * 1000);

  it('accepts a valid maintenance window', () => {
    const window = {
      assetId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
      scheduledStart: now.toISOString(),
      scheduledEnd: later.toISOString(),
      reason: 'Quarterly calibration',
      scheduledBy: 'maintenance-team',
    };
    const result = AssetMaintenanceWindowSchema.parse(window);
    expect(result.type).toBe('planned');
    expect(result.reason).toBe('Quarterly calibration');
  });

  it('accepts emergency maintenance windows', () => {
    const window = {
      assetId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
      scheduledStart: now.toISOString(),
      scheduledEnd: later.toISOString(),
      reason: 'Motor failure',
      type: 'emergency',
      scheduledBy: 'operator-01',
    };
    const result = AssetMaintenanceWindowSchema.parse(window);
    expect(result.type).toBe('emergency');
  });
});

describe('AssetQuerySchema', () => {
  it('applies default pagination', () => {
    const result = AssetQuerySchema.parse({});
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it('accepts type and status filters', () => {
    const result = AssetQuerySchema.parse({
      type: ASSET_TYPE.PLC,
      status: ASSET_STATUS.ONLINE,
      siteId: 'site-01',
      limit: 100,
    });
    expect(result.type).toBe('plc');
    expect(result.status).toBe('online');
  });

  it('enforces limit bounds', () => {
    expect(() => AssetQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => AssetQuerySchema.parse({ limit: 1001 })).toThrow();
  });
});
