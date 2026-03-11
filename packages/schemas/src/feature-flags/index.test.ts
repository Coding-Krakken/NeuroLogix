/**
 * Tests for feature-flags and rollout control schemas
 * Covers: FEDERATION-001, FEDERATION-INV-008
 * Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/92
 */
import { describe, it, expect } from 'vitest';
import {
  ROLLOUT_STRATEGY,
  RolloutStrategySchema,
  RolloutConfigSchema,
  FeatureFlagSchema,
  ResolvedFeatureFlagSchema,
  PLATFORM_FLAG_KEYS,
  DEFAULT_FEATURE_FLAGS,
  resolveFeatureFlag,
} from './index.js';

// ─────────────────────────────────────────────────────────────────────────────
// ROLLOUT_STRATEGY constants
// ─────────────────────────────────────────────────────────────────────────────

describe('ROLLOUT_STRATEGY', () => {
  it('defines all five strategy constants', () => {
    expect(ROLLOUT_STRATEGY.PERCENTAGE).toBe('percentage');
    expect(ROLLOUT_STRATEGY.COHORT).toBe('cohort');
    expect(ROLLOUT_STRATEGY.CANARY).toBe('canary');
    expect(ROLLOUT_STRATEGY.ALL).toBe('all');
    expect(ROLLOUT_STRATEGY.NONE).toBe('none');
  });

  it('has exactly five entries', () => {
    expect(Object.keys(ROLLOUT_STRATEGY)).toHaveLength(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RolloutStrategySchema
// ─────────────────────────────────────────────────────────────────────────────

describe('RolloutStrategySchema', () => {
  it('accepts all valid strategy values', () => {
    const validStrategies = ['percentage', 'cohort', 'canary', 'all', 'none'];
    for (const strategy of validStrategies) {
      expect(() => RolloutStrategySchema.parse(strategy)).not.toThrow();
    }
  });

  it('rejects unknown strategy values', () => {
    expect(() => RolloutStrategySchema.parse('gradual')).toThrow();
    expect(() => RolloutStrategySchema.parse('')).toThrow();
    expect(() => RolloutStrategySchema.parse(null)).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RolloutConfigSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('RolloutConfigSchema', () => {
  it('accepts a minimal valid rollout config', () => {
    const result = RolloutConfigSchema.parse({
      strategy: 'all',
      percentage: 100,
    });
    expect(result.strategy).toBe('all');
    expect(result.percentage).toBe(100);
  });

  it('accepts percentage boundary values 0 and 100', () => {
    expect(() => RolloutConfigSchema.parse({ strategy: 'percentage', percentage: 0 })).not.toThrow();
    expect(() => RolloutConfigSchema.parse({ strategy: 'percentage', percentage: 100 })).not.toThrow();
  });

  it('rejects percentage below 0', () => {
    expect(() => RolloutConfigSchema.parse({ strategy: 'percentage', percentage: -1 })).toThrow();
  });

  it('rejects percentage above 100', () => {
    expect(() => RolloutConfigSchema.parse({ strategy: 'percentage', percentage: 101 })).toThrow();
  });

  it('accepts optional siteCohortIds as an array of UUIDs', () => {
    const result = RolloutConfigSchema.parse({
      strategy: 'cohort',
      percentage: 50,
      siteCohortIds: ['a1b2c3d4-0000-0000-0000-000000000001'],
    });
    expect(result.siteCohortIds).toHaveLength(1);
  });

  it('rejects non-UUID siteCohortIds', () => {
    expect(() =>
      RolloutConfigSchema.parse({
        strategy: 'cohort',
        percentage: 50,
        siteCohortIds: ['not-a-uuid'],
      }),
    ).toThrow();
  });

  it('accepts optional enabledAt and disabledAt as ISO datetime strings', () => {
    const result = RolloutConfigSchema.parse({
      strategy: 'canary',
      percentage: 10,
      enabledAt: '2026-01-01T00:00:00Z',
      disabledAt: '2026-06-01T00:00:00Z',
    });
    expect(result.enabledAt).toBe('2026-01-01T00:00:00Z');
    expect(result.disabledAt).toBe('2026-06-01T00:00:00Z');
  });

  it('rejects non-datetime strings for enabledAt', () => {
    expect(() =>
      RolloutConfigSchema.parse({
        strategy: 'percentage',
        percentage: 50,
        enabledAt: 'not-a-date',
      }),
    ).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => RolloutConfigSchema.parse({ strategy: 'all' })).toThrow();
    expect(() => RolloutConfigSchema.parse({ percentage: 100 })).toThrow();
    expect(() => RolloutConfigSchema.parse({})).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FeatureFlagSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('FeatureFlagSchema', () => {
  it('accepts a valid minimal feature flag', () => {
    const result = FeatureFlagSchema.parse({
      key: 'feature.new-ui',
      description: 'Enables the new operator UI',
      defaultValue: false,
    });
    expect(result.key).toBe('feature.new-ui');
    expect(result.defaultValue).toBe(false);
  });

  it('accepts a single lowercase alphanumeric character as key', () => {
    expect(() =>
      FeatureFlagSchema.parse({ key: 'a', description: 'Single char key', defaultValue: false }),
    ).not.toThrow();
  });

  it('accepts a key with dots and hyphens in the middle', () => {
    expect(() =>
      FeatureFlagSchema.parse({
        key: 'federation.multi-site-enabled',
        description: 'Multi-site federation',
        defaultValue: false,
      }),
    ).not.toThrow();
  });

  it('rejects an empty key', () => {
    expect(() =>
      FeatureFlagSchema.parse({ key: '', description: 'desc', defaultValue: false }),
    ).toThrow();
  });

  it('rejects a key starting with a hyphen', () => {
    expect(() =>
      FeatureFlagSchema.parse({ key: '-invalid', description: 'desc', defaultValue: false }),
    ).toThrow();
  });

  it('rejects a key ending with a hyphen', () => {
    expect(() =>
      FeatureFlagSchema.parse({ key: 'invalid-', description: 'desc', defaultValue: false }),
    ).toThrow();
  });

  it('rejects a key exceeding 200 characters', () => {
    const longKey = 'a'.repeat(201);
    expect(() =>
      FeatureFlagSchema.parse({ key: longKey, description: 'desc', defaultValue: false }),
    ).toThrow();
  });

  it('rejects an empty description', () => {
    expect(() =>
      FeatureFlagSchema.parse({ key: 'feature', description: '', defaultValue: false }),
    ).toThrow();
  });

  it('rejects a description exceeding 500 characters', () => {
    const longDesc = 'A'.repeat(501);
    expect(() =>
      FeatureFlagSchema.parse({ key: 'feature', description: longDesc, defaultValue: false }),
    ).toThrow();
  });

  it('accepts an optional rolloutConfig', () => {
    const result = FeatureFlagSchema.parse({
      key: 'feature.rollout',
      description: 'Gradual rollout feature',
      defaultValue: false,
      rolloutConfig: {
        strategy: 'percentage',
        percentage: 25,
      },
    });
    expect(result.rolloutConfig?.percentage).toBe(25);
  });

  it('sets defaultValue to true', () => {
    const result = FeatureFlagSchema.parse({
      key: 'feature.on',
      description: 'Always on feature',
      defaultValue: true,
    });
    expect(result.defaultValue).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ResolvedFeatureFlagSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('ResolvedFeatureFlagSchema', () => {
  it('accepts a valid resolved flag from global scope', () => {
    const result = ResolvedFeatureFlagSchema.parse({
      key: 'federation.multi-site-enabled',
      description: 'Multi-site federation',
      defaultValue: false,
      resolvedValue: false,
      resolvedFrom: 'global',
    });
    expect(result.resolvedFrom).toBe('global');
    expect(result.resolvedValue).toBe(false);
  });

  it('accepts resolvedFrom values: global, tenant, site', () => {
    const scopes = ['global', 'tenant', 'site'] as const;
    for (const scope of scopes) {
      expect(() =>
        ResolvedFeatureFlagSchema.parse({
          key: 'feature.x',
          description: 'desc',
          defaultValue: false,
          resolvedValue: true,
          resolvedFrom: scope,
        }),
      ).not.toThrow();
    }
  });

  it('rejects an invalid resolvedFrom value', () => {
    expect(() =>
      ResolvedFeatureFlagSchema.parse({
        key: 'feature.x',
        description: 'desc',
        defaultValue: false,
        resolvedValue: true,
        resolvedFrom: 'override',
      }),
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM_FLAG_KEYS
// ─────────────────────────────────────────────────────────────────────────────

describe('PLATFORM_FLAG_KEYS', () => {
  it('defines the three required platform flag keys', () => {
    expect(PLATFORM_FLAG_KEYS.FEDERATION_MULTI_SITE).toBe('federation.multi-site-enabled');
    expect(PLATFORM_FLAG_KEYS.FEDERATION_AUTONOMOUS_DISPATCH).toBe('federation.autonomous-dispatch');
    expect(PLATFORM_FLAG_KEYS.FEDERATION_CROSS_SITE_TELEMETRY).toBe('federation.cross-site-telemetry');
  });

  it('has exactly three entries', () => {
    expect(Object.keys(PLATFORM_FLAG_KEYS)).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_FEATURE_FLAGS
// ─────────────────────────────────────────────────────────────────────────────

describe('DEFAULT_FEATURE_FLAGS', () => {
  it('defaults all three platform flags to false', () => {
    expect(DEFAULT_FEATURE_FLAGS[PLATFORM_FLAG_KEYS.FEDERATION_MULTI_SITE]).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS[PLATFORM_FLAG_KEYS.FEDERATION_AUTONOMOUS_DISPATCH]).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS[PLATFORM_FLAG_KEYS.FEDERATION_CROSS_SITE_TELEMETRY]).toBe(false);
  });

  it('has exactly three default entries', () => {
    expect(Object.keys(DEFAULT_FEATURE_FLAGS)).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveFeatureFlag — FEDERATION-INV-008
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveFeatureFlag', () => {
  const globalFlags = { 'feature.x': false, 'feature.y': true };
  const tenantFlags = { 'feature.x': true };
  const siteFlags = { 'feature.x': false };

  describe('global resolution (no tenant, no site overrides)', () => {
    it('resolves to global value when no overrides provided', () => {
      const result = resolveFeatureFlag('feature.x', globalFlags);
      expect(result.resolvedFrom).toBe('global');
      expect(result.resolvedValue).toBe(false);
    });

    it('resolves to true from global when flag is true', () => {
      const result = resolveFeatureFlag('feature.y', globalFlags);
      expect(result.resolvedFrom).toBe('global');
      expect(result.resolvedValue).toBe(true);
    });

    it('resolves to false for an unknown key not in globalFlags', () => {
      const result = resolveFeatureFlag('feature.unknown', globalFlags);
      expect(result.resolvedFrom).toBe('global');
      expect(result.resolvedValue).toBe(false);
    });
  });

  describe('tenant resolution (precedence: tenant > global)', () => {
    it('resolves to tenant value when tenant override is present', () => {
      const result = resolveFeatureFlag('feature.x', globalFlags, tenantFlags);
      expect(result.resolvedFrom).toBe('tenant');
      expect(result.resolvedValue).toBe(true);
    });

    it('falls back to global when tenant does not override the key', () => {
      const result = resolveFeatureFlag('feature.y', globalFlags, tenantFlags);
      expect(result.resolvedFrom).toBe('global');
      expect(result.resolvedValue).toBe(true);
    });
  });

  describe('site resolution (precedence: site > tenant > global)', () => {
    it('resolves to site value when site override is present', () => {
      const result = resolveFeatureFlag('feature.x', globalFlags, tenantFlags, siteFlags);
      expect(result.resolvedFrom).toBe('site');
      expect(result.resolvedValue).toBe(false);
    });

    it('falls back to tenant when site does not override the key', () => {
      const tenantOnlyFlags = { 'feature.z': true };
      const siteWithoutZ = { 'feature.other': false };
      const result = resolveFeatureFlag('feature.z', globalFlags, tenantOnlyFlags, siteWithoutZ);
      expect(result.resolvedFrom).toBe('tenant');
      expect(result.resolvedValue).toBe(true);
    });

    it('falls back to global when neither site nor tenant override the key', () => {
      const emptyTenant = {};
      const emptySite = {};
      const result = resolveFeatureFlag('feature.y', globalFlags, emptyTenant, emptySite);
      expect(result.resolvedFrom).toBe('global');
      expect(result.resolvedValue).toBe(true);
    });
  });

  describe('resolved flag structure', () => {
    it('returns a result with key, description, defaultValue, resolvedValue and resolvedFrom', () => {
      const result = resolveFeatureFlag('feature.x', globalFlags, tenantFlags, siteFlags);
      expect(result).toHaveProperty('key', 'feature.x');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('defaultValue');
      expect(result).toHaveProperty('resolvedValue');
      expect(result).toHaveProperty('resolvedFrom');
    });

    it('returns the correct key in the result', () => {
      const result = resolveFeatureFlag('feature.x', globalFlags);
      expect(result.key).toBe('feature.x');
      expect(typeof result.resolvedValue).toBe('boolean');
      expect(['global', 'tenant', 'site']).toContain(result.resolvedFrom);
    });
  });
});
