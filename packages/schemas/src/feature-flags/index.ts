import { z } from 'zod';

/**
 * @fileoverview Feature Flags and Rollout Control schemas
 *
 * Model ref: FEDERATION-001 (FeatureFlag, RolloutConfig, RolloutStrategy)
 * Contracts ref: FEDERATION-API-001 (FF-001, FF-002, FF-003)
 * Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/37
 *
 * Precedence order for flag resolution (FEDERATION-INV-008):
 *   Global defaults → Tenant overrides → Site overrides
 */

// ─────────────────────────────────────────────────────────────────────────────
// Rollout Strategy
// ─────────────────────────────────────────────────────────────────────────────

export const ROLLOUT_STRATEGY = {
  PERCENTAGE: 'percentage',
  COHORT: 'cohort',
  CANARY: 'canary',
  ALL: 'all',
  NONE: 'none',
} as const;

export type RolloutStrategy = (typeof ROLLOUT_STRATEGY)[keyof typeof ROLLOUT_STRATEGY];

export const RolloutStrategySchema = z.nativeEnum(ROLLOUT_STRATEGY);

// ─────────────────────────────────────────────────────────────────────────────
// Rollout Config
// ─────────────────────────────────────────────────────────────────────────────

export const RolloutConfigSchema = z.object({
  strategy: RolloutStrategySchema,
  percentage: z.number().min(0).max(100),
  siteCohortIds: z.array(z.string().uuid()).optional(),
  enabledAt: z.string().datetime().optional(),
  disabledAt: z.string().datetime().optional(),
});

export type RolloutConfig = z.infer<typeof RolloutConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Feature Flag Definition
// ─────────────────────────────────────────────────────────────────────────────

export const FeatureFlagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(200)
    .regex(
      /^[a-z0-9]+[a-z0-9.-]*[a-z0-9]+$|^[a-z0-9]$/,
      'key must be lowercase alphanumeric with optional dots or hyphens in the middle',
    ),
  description: z.string().min(1).max(500),
  defaultValue: z.boolean(),
  rolloutConfig: RolloutConfigSchema.optional(),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Resolved Feature Flag (after precedence resolution)
// ─────────────────────────────────────────────────────────────────────────────

export const ResolvedFeatureFlagSchema = FeatureFlagSchema.extend({
  resolvedValue: z.boolean(),
  resolvedFrom: z.enum(['global', 'tenant', 'site']),
});

export type ResolvedFeatureFlag = z.infer<typeof ResolvedFeatureFlagSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Platform-Required Feature Flag Keys
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Well-known feature flag keys required by the platform model.
 * Additional flags may be registered at runtime via the API.
 */
export const PLATFORM_FLAG_KEYS = {
  FEDERATION_MULTI_SITE: 'federation.multi-site-enabled',
  FEDERATION_AUTONOMOUS_DISPATCH: 'federation.autonomous-dispatch',
  FEDERATION_CROSS_SITE_TELEMETRY: 'federation.cross-site-telemetry',
} as const;

/**
 * Default platform feature flags (global defaults, all off).
 * Sites and tenants may override per FEDERATION-INV-008.
 */
export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  [PLATFORM_FLAG_KEYS.FEDERATION_MULTI_SITE]: false,
  [PLATFORM_FLAG_KEYS.FEDERATION_AUTONOMOUS_DISPATCH]: false,
  [PLATFORM_FLAG_KEYS.FEDERATION_CROSS_SITE_TELEMETRY]: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature Flag Resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a feature flag's effective value applying precedence rules.
 * Precedence: site overrides > tenant overrides > global defaults (FEDERATION-INV-008)
 */
export function resolveFeatureFlag(
  key: string,
  globalFlags: Record<string, boolean>,
  tenantFlags?: Record<string, boolean>,
  siteFlags?: Record<string, boolean>,
): ResolvedFeatureFlag {
  const definition = {
    key,
    description: '',
    defaultValue: globalFlags[key] ?? false,
  };

  if (siteFlags !== undefined && key in siteFlags) {
    return {
      ...definition,
      resolvedValue: siteFlags[key]!,
      resolvedFrom: 'site',
    };
  }

  if (tenantFlags !== undefined && key in tenantFlags) {
    return {
      ...definition,
      resolvedValue: tenantFlags[key]!,
      resolvedFrom: 'tenant',
    };
  }

  return {
    ...definition,
    resolvedValue: globalFlags[key] ?? false,
    resolvedFrom: 'global',
  };
}
