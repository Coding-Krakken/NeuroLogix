/**
 * Tests for federation and multi-site schemas
 * Covers: FEDERATION-001, FEDERATION-INV-002, FEDERATION-INV-008
 * Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/92
 */
import { describe, it, expect } from 'vitest';
import {
  SITE_TIER,
  SiteTierSchema,
  SITE_STATUS,
  SiteStatusSchema,
  VALID_SITE_TRANSITIONS,
  ControlLimitsSchema,
  ProductionLineSchema,
  CameraZoneSchema,
  EquipmentTopologySchema,
  SiteConfigSchema,
  SiteProfileSchema,
  CreateSiteRequestSchema,
  UpdateSiteStatusRequestSchema,
  PlatformContractsSchema,
  FederationTopologySchema,
  TENANT_PLAN,
  SSOConfigSchema,
  TenantConfigSchema,
  isValidSiteTransition,
  isSiteOperable,
} from './index.js';

// ─────────────────────────────────────────────────────────────────────────────
// SITE_TIER constants
// ─────────────────────────────────────────────────────────────────────────────

describe('SITE_TIER', () => {
  it('defines T1, T2, and T3 tier constants', () => {
    expect(SITE_TIER.T1).toBe('T1');
    expect(SITE_TIER.T2).toBe('T2');
    expect(SITE_TIER.T3).toBe('T3');
  });

  it('has exactly three tier entries', () => {
    expect(Object.keys(SITE_TIER)).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SiteTierSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('SiteTierSchema', () => {
  it('accepts all valid tier values', () => {
    for (const tier of ['T1', 'T2', 'T3']) {
      expect(() => SiteTierSchema.parse(tier)).not.toThrow();
    }
  });

  it('rejects an unknown tier', () => {
    expect(() => SiteTierSchema.parse('T4')).toThrow();
    expect(() => SiteTierSchema.parse('')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SITE_STATUS constants
// ─────────────────────────────────────────────────────────────────────────────

describe('SITE_STATUS', () => {
  it('defines all five site status constants', () => {
    expect(SITE_STATUS.PROVISIONING).toBe('provisioning');
    expect(SITE_STATUS.ACTIVE).toBe('active');
    expect(SITE_STATUS.MAINTENANCE).toBe('maintenance');
    expect(SITE_STATUS.SUSPENDED).toBe('suspended');
    expect(SITE_STATUS.DECOMMISSIONED).toBe('decommissioned');
  });

  it('has exactly five status entries', () => {
    expect(Object.keys(SITE_STATUS)).toHaveLength(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SiteStatusSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('SiteStatusSchema', () => {
  it('accepts all valid status values', () => {
    const statuses = ['provisioning', 'active', 'maintenance', 'suspended', 'decommissioned'];
    for (const status of statuses) {
      expect(() => SiteStatusSchema.parse(status)).not.toThrow();
    }
  });

  it('rejects unknown status values', () => {
    expect(() => SiteStatusSchema.parse('offline')).toThrow();
    expect(() => SiteStatusSchema.parse('')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VALID_SITE_TRANSITIONS — state machine invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('VALID_SITE_TRANSITIONS', () => {
  it('provisioning can only transition to active', () => {
    expect(VALID_SITE_TRANSITIONS.provisioning).toEqual(['active']);
  });

  it('active can transition to maintenance or suspended', () => {
    expect(VALID_SITE_TRANSITIONS.active).toContain('maintenance');
    expect(VALID_SITE_TRANSITIONS.active).toContain('suspended');
    expect(VALID_SITE_TRANSITIONS.active).toHaveLength(2);
  });

  it('maintenance can only transition back to active', () => {
    expect(VALID_SITE_TRANSITIONS.maintenance).toEqual(['active']);
  });

  it('suspended can transition to active or decommissioned', () => {
    expect(VALID_SITE_TRANSITIONS.suspended).toContain('active');
    expect(VALID_SITE_TRANSITIONS.suspended).toContain('decommissioned');
    expect(VALID_SITE_TRANSITIONS.suspended).toHaveLength(2);
  });

  it('decommissioned is a terminal state with no outbound transitions', () => {
    expect(VALID_SITE_TRANSITIONS.decommissioned).toHaveLength(0);
  });

  it('covers all five site statuses', () => {
    expect(Object.keys(VALID_SITE_TRANSITIONS)).toHaveLength(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ControlLimitsSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('ControlLimitsSchema', () => {
  const valid = {
    maxConveyorSpeedPercent: 80,
    maxTemperatureCelsius: 150,
    emergencyStopBudgetMs: 5000,
  };

  it('accepts a valid control limits object', () => {
    const result = ControlLimitsSchema.parse(valid);
    expect(result.maxConveyorSpeedPercent).toBe(80);
  });

  it('accepts boundary value 0 for maxConveyorSpeedPercent', () => {
    expect(() => ControlLimitsSchema.parse({ ...valid, maxConveyorSpeedPercent: 0 })).not.toThrow();
  });

  it('accepts boundary value 100 for maxConveyorSpeedPercent', () => {
    expect(() => ControlLimitsSchema.parse({ ...valid, maxConveyorSpeedPercent: 100 })).not.toThrow();
  });

  it('rejects maxConveyorSpeedPercent above 100', () => {
    expect(() => ControlLimitsSchema.parse({ ...valid, maxConveyorSpeedPercent: 101 })).toThrow();
  });

  it('rejects non-positive maxTemperatureCelsius', () => {
    expect(() => ControlLimitsSchema.parse({ ...valid, maxTemperatureCelsius: 0 })).toThrow();
    expect(() => ControlLimitsSchema.parse({ ...valid, maxTemperatureCelsius: -10 })).toThrow();
  });

  it('rejects emergencyStopBudgetMs exceeding 30000', () => {
    expect(() => ControlLimitsSchema.parse({ ...valid, emergencyStopBudgetMs: 30001 })).toThrow();
  });

  it('accepts emergencyStopBudgetMs at exactly 30000', () => {
    expect(() => ControlLimitsSchema.parse({ ...valid, emergencyStopBudgetMs: 30000 })).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ProductionLineSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('ProductionLineSchema', () => {
  const valid = {
    lineId: 'line-1',
    lineName: 'Assembly Line 1',
    zones: ['zone-a', 'zone-b'],
    capacity: 500,
  };

  it('accepts a valid production line', () => {
    const result = ProductionLineSchema.parse(valid);
    expect(result.lineId).toBe('line-1');
    expect(result.zones).toHaveLength(2);
  });

  it('rejects empty lineId', () => {
    expect(() => ProductionLineSchema.parse({ ...valid, lineId: '' })).toThrow();
  });

  it('rejects empty lineName', () => {
    expect(() => ProductionLineSchema.parse({ ...valid, lineName: '' })).toThrow();
  });

  it('rejects non-positive capacity', () => {
    expect(() => ProductionLineSchema.parse({ ...valid, capacity: 0 })).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CameraZoneSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('CameraZoneSchema', () => {
  const valid = {
    zoneId: 'zone-a',
    cameraId: 'cam-001',
  };

  it('accepts a valid camera zone without optional fields', () => {
    const result = CameraZoneSchema.parse(valid);
    expect(result.zoneId).toBe('zone-a');
  });

  it('accepts optional streamUrl and description', () => {
    const result = CameraZoneSchema.parse({
      ...valid,
      streamUrl: 'https://stream.example.com/cam001',
      description: 'Entry zone camera',
    });
    expect(result.streamUrl).toBe('https://stream.example.com/cam001');
  });

  it('rejects invalid streamUrl', () => {
    expect(() => CameraZoneSchema.parse({ ...valid, streamUrl: 'not-a-url' })).toThrow();
  });

  it('rejects empty zoneId', () => {
    expect(() => CameraZoneSchema.parse({ ...valid, zoneId: '' })).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EquipmentTopologySchema
// ─────────────────────────────────────────────────────────────────────────────

describe('EquipmentTopologySchema', () => {
  const valid = {
    lines: [{ lineId: 'line-1', lineName: 'Line 1', zones: ['zone-a'], capacity: 200 }],
    plcAddresses: { 'plc-1': '192.168.1.10' },
  };

  it('accepts a valid equipment topology', () => {
    const result = EquipmentTopologySchema.parse(valid);
    expect(result.lines).toHaveLength(1);
  });

  it('accepts optional cameraZones', () => {
    const result = EquipmentTopologySchema.parse({
      ...valid,
      cameraZones: [{ zoneId: 'zone-a', cameraId: 'cam-1' }],
    });
    expect(result.cameraZones).toHaveLength(1);
  });

  it('rejects missing lines', () => {
    expect(() => EquipmentTopologySchema.parse({ plcAddresses: {} })).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SiteConfigSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('SiteConfigSchema', () => {
  const valid = {
    timezone: 'Europe/London',
    locale: 'en-GB',
  };

  it('accepts a minimal site config and defaults retentionDays to 90', () => {
    const result = SiteConfigSchema.parse(valid);
    expect(result.retentionDays).toBe(90);
  });

  it('accepts retentionDays at boundary values 30 and 2555', () => {
    expect(() => SiteConfigSchema.parse({ ...valid, retentionDays: 30 })).not.toThrow();
    expect(() => SiteConfigSchema.parse({ ...valid, retentionDays: 2555 })).not.toThrow();
  });

  it('rejects retentionDays below 30', () => {
    expect(() => SiteConfigSchema.parse({ ...valid, retentionDays: 29 })).toThrow();
  });

  it('rejects retentionDays above 2555', () => {
    expect(() => SiteConfigSchema.parse({ ...valid, retentionDays: 2556 })).toThrow();
  });

  it('rejects empty timezone', () => {
    expect(() => SiteConfigSchema.parse({ ...valid, timezone: '' })).toThrow();
  });

  it('rejects a locale shorter than 2 characters', () => {
    expect(() => SiteConfigSchema.parse({ ...valid, locale: 'e' })).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SiteProfileSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('SiteProfileSchema', () => {
  const validConfig = { timezone: 'UTC', locale: 'en-US' };
  const valid = {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    slug: 'site-alpha',
    name: 'Site Alpha',
    region: 'us-east-1',
    status: 'active',
    tier: 'T1',
    platformVersion: '1.0.0',
    tenantId: 'tenant-1',
    config: validConfig,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('accepts a valid site profile', () => {
    const result = SiteProfileSchema.parse(valid);
    expect(result.slug).toBe('site-alpha');
    expect(result.tier).toBe('T1');
  });

  it('defaults tenantId to "default" when not provided', () => {
    const withoutTenant = {
      id: valid.id,
      slug: valid.slug,
      name: valid.name,
      region: valid.region,
      status: valid.status,
      tier: valid.tier,
      platformVersion: valid.platformVersion,
      config: valid.config,
      createdAt: valid.createdAt,
      updatedAt: valid.updatedAt,
    };
    const result = SiteProfileSchema.parse(withoutTenant);
    expect(result.tenantId).toBe('default');
  });

  it('rejects a slug with uppercase letters', () => {
    expect(() => SiteProfileSchema.parse({ ...valid, slug: 'Site-Alpha' })).toThrow();
  });

  it('rejects a slug with spaces', () => {
    expect(() => SiteProfileSchema.parse({ ...valid, slug: 'site alpha' })).toThrow();
  });

  it('rejects an invalid UUID for id', () => {
    expect(() => SiteProfileSchema.parse({ ...valid, id: 'not-a-uuid' })).toThrow();
  });

  it('accepts optional featureFlags', () => {
    const result = SiteProfileSchema.parse({
      ...valid,
      featureFlags: { 'feature.x': true },
    });
    expect(result.featureFlags?.['feature.x']).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CreateSiteRequestSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('CreateSiteRequestSchema', () => {
  const valid = {
    slug: 'new-site',
    name: 'New Site',
    region: 'eu-west-1',
    tier: 'T2',
    config: { timezone: 'Europe/Berlin', locale: 'de-DE' },
  };

  it('accepts a minimal valid create request without id, status, or timestamps', () => {
    const result = CreateSiteRequestSchema.parse(valid);
    expect(result.slug).toBe('new-site');
  });

  it('accepts an optional platformVersion', () => {
    const result = CreateSiteRequestSchema.parse({ ...valid, platformVersion: '2.0.0' });
    expect(result.platformVersion).toBe('2.0.0');
  });

  it('strips id if provided (Zod strips unknown/omitted fields by default)', () => {
    const result = CreateSiteRequestSchema.parse({
      ...valid,
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
    });
    expect(result).not.toHaveProperty('id');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UpdateSiteStatusRequestSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('UpdateSiteStatusRequestSchema', () => {
  it('accepts a valid status update request', () => {
    const result = UpdateSiteStatusRequestSchema.parse({
      status: 'active',
      reason: 'Go live',
    });
    expect(result.status).toBe('active');
    expect(result.reason).toBe('Go live');
  });

  it('rejects an invalid status', () => {
    expect(() =>
      UpdateSiteStatusRequestSchema.parse({ status: 'unknown', reason: 'test' }),
    ).toThrow();
  });

  it('rejects an empty reason', () => {
    expect(() =>
      UpdateSiteStatusRequestSchema.parse({ status: 'active', reason: '' }),
    ).toThrow();
  });

  it('rejects a reason exceeding 1000 characters', () => {
    expect(() =>
      UpdateSiteStatusRequestSchema.parse({ status: 'active', reason: 'A'.repeat(1001) }),
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PlatformContractsSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('PlatformContractsSchema', () => {
  it('accepts a valid platform contracts object', () => {
    const result = PlatformContractsSchema.parse({
      apiVersion: 'v1',
      eventSchemaVersion: '1.0.0',
      minPlatformVersion: '0.1.0',
    });
    expect(result.apiVersion).toBe('v1');
  });

  it('rejects empty version strings', () => {
    expect(() =>
      PlatformContractsSchema.parse({ apiVersion: '', eventSchemaVersion: '1', minPlatformVersion: '1' }),
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FederationTopologySchema
// ─────────────────────────────────────────────────────────────────────────────

describe('FederationTopologySchema', () => {
  const validSite = {
    id: 'a1b2c3d4-0000-0000-0000-000000000002',
    slug: 'site-beta',
    name: 'Site Beta',
    region: 'eu-central-1',
    status: 'provisioning',
    tier: 'T1',
    platformVersion: '1.0.0',
    config: { timezone: 'UTC', locale: 'en-US' },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const valid = {
    id: 'a1b2c3d4-0000-0000-0000-000000000010',
    version: 1,
    sites: [validSite],
    defaultFeatureFlags: { 'federation.multi-site-enabled': false },
    platformContracts: {
      apiVersion: 'v1',
      eventSchemaVersion: '1.0.0',
      minPlatformVersion: '0.1.0',
    },
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('accepts a valid federation topology', () => {
    const result = FederationTopologySchema.parse(valid);
    expect(result.sites).toHaveLength(1);
  });

  it('accepts an empty sites array', () => {
    expect(() => FederationTopologySchema.parse({ ...valid, sites: [] })).not.toThrow();
  });

  it('rejects a non-integer version', () => {
    expect(() => FederationTopologySchema.parse({ ...valid, version: 1.5 })).toThrow();
  });

  it('rejects version below 0', () => {
    expect(() => FederationTopologySchema.parse({ ...valid, version: -1 })).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TENANT_PLAN constants
// ─────────────────────────────────────────────────────────────────────────────

describe('TENANT_PLAN', () => {
  it('defines enterprise, standard, and trial plans', () => {
    expect(TENANT_PLAN.ENTERPRISE).toBe('enterprise');
    expect(TENANT_PLAN.STANDARD).toBe('standard');
    expect(TENANT_PLAN.TRIAL).toBe('trial');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SSOConfigSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('SSOConfigSchema', () => {
  it('accepts a valid SSO config', () => {
    const result = SSOConfigSchema.parse({
      provider: 'okta',
      issuerUrl: 'https://dev-example.okta.com',
      clientId: 'abc123',
    });
    expect(result.provider).toBe('okta');
  });

  it('rejects an invalid issuerUrl', () => {
    expect(() =>
      SSOConfigSchema.parse({ provider: 'okta', issuerUrl: 'not-a-url', clientId: 'abc' }),
    ).toThrow();
  });

  it('rejects an empty provider', () => {
    expect(() =>
      SSOConfigSchema.parse({ provider: '', issuerUrl: 'https://example.com', clientId: 'abc' }),
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TenantConfigSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('TenantConfigSchema', () => {
  const valid = {
    name: 'Acme Corp',
    plan: 'enterprise',
    sites: ['a1b2c3d4-0000-0000-0000-000000000001'],
  };

  it('accepts a minimal valid tenant config and defaults tenantId', () => {
    const result = TenantConfigSchema.parse(valid);
    expect(result.tenantId).toBe('default');
    expect(result.plan).toBe('enterprise');
  });

  it('accepts all three plan values', () => {
    for (const plan of ['enterprise', 'standard', 'trial']) {
      expect(() => TenantConfigSchema.parse({ ...valid, plan })).not.toThrow();
    }
  });

  it('rejects an unknown plan value', () => {
    expect(() => TenantConfigSchema.parse({ ...valid, plan: 'premium' })).toThrow();
  });

  it('accepts optional featureFlags override', () => {
    const result = TenantConfigSchema.parse({
      ...valid,
      featureFlags: { 'federation.multi-site-enabled': true },
    });
    expect(result.featureFlags?.['federation.multi-site-enabled']).toBe(true);
  });

  it('accepts optional ssoConfig', () => {
    const result = TenantConfigSchema.parse({
      ...valid,
      ssoConfig: {
        provider: 'azure-ad',
        issuerUrl: 'https://login.microsoftonline.com/tenant',
        clientId: 'client-id',
      },
    });
    expect(result.ssoConfig?.provider).toBe('azure-ad');
  });

  it('accepts null ssoConfig explicitly', () => {
    const result = TenantConfigSchema.parse({ ...valid, ssoConfig: null });
    expect(result.ssoConfig).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidSiteTransition — FEDERATION-INV-002
// ─────────────────────────────────────────────────────────────────────────────

describe('isValidSiteTransition', () => {
  it('allows provisioning → active', () => {
    expect(isValidSiteTransition('provisioning', 'active')).toBe(true);
  });

  it('disallows provisioning → suspended', () => {
    expect(isValidSiteTransition('provisioning', 'suspended')).toBe(false);
  });

  it('allows active → maintenance', () => {
    expect(isValidSiteTransition('active', 'maintenance')).toBe(true);
  });

  it('allows active → suspended', () => {
    expect(isValidSiteTransition('active', 'suspended')).toBe(true);
  });

  it('disallows active → provisioning', () => {
    expect(isValidSiteTransition('active', 'provisioning')).toBe(false);
  });

  it('disallows active → decommissioned directly', () => {
    expect(isValidSiteTransition('active', 'decommissioned')).toBe(false);
  });

  it('allows maintenance → active', () => {
    expect(isValidSiteTransition('maintenance', 'active')).toBe(true);
  });

  it('disallows maintenance → suspended', () => {
    expect(isValidSiteTransition('maintenance', 'suspended')).toBe(false);
  });

  it('allows suspended → active', () => {
    expect(isValidSiteTransition('suspended', 'active')).toBe(true);
  });

  it('allows suspended → decommissioned', () => {
    expect(isValidSiteTransition('suspended', 'decommissioned')).toBe(true);
  });

  it('disallows suspended → provisioning', () => {
    expect(isValidSiteTransition('suspended', 'provisioning')).toBe(false);
  });

  it('disallows all transitions from decommissioned (terminal state)', () => {
    for (const status of ['provisioning', 'active', 'maintenance', 'suspended', 'decommissioned'] as const) {
      expect(isValidSiteTransition('decommissioned', status)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isSiteOperable — FEDERATION-INV-002
// ─────────────────────────────────────────────────────────────────────────────

describe('isSiteOperable', () => {
  it('returns true only for active sites', () => {
    expect(isSiteOperable('active')).toBe(true);
  });

  it('returns false for provisioning sites', () => {
    expect(isSiteOperable('provisioning')).toBe(false);
  });

  it('returns false for maintenance sites', () => {
    expect(isSiteOperable('maintenance')).toBe(false);
  });

  it('returns false for suspended sites', () => {
    expect(isSiteOperable('suspended')).toBe(false);
  });

  it('returns false for decommissioned sites', () => {
    expect(isSiteOperable('decommissioned')).toBe(false);
  });
});
