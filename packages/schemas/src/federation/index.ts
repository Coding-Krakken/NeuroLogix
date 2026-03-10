import { z } from 'zod';

/**
 * @fileoverview Federation and Multi-Site schemas for NeuroLogix platform
 *
 * Model ref: FEDERATION-001
 * Contracts ref: FEDERATION-API-001
 * Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/37
 */

// ─────────────────────────────────────────────────────────────────────────────
// Site Tier
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_TIER = {
  T1: 'T1',
  T2: 'T2',
  T3: 'T3',
} as const;

export type SiteTier = (typeof SITE_TIER)[keyof typeof SITE_TIER];

export const SiteTierSchema = z.nativeEnum(SITE_TIER);

// ─────────────────────────────────────────────────────────────────────────────
// Site Status
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_STATUS = {
  PROVISIONING: 'provisioning',
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  SUSPENDED: 'suspended',
  DECOMMISSIONED: 'decommissioned',
} as const;

export type SiteStatus = (typeof SITE_STATUS)[keyof typeof SITE_STATUS];

export const SiteStatusSchema = z.nativeEnum(SITE_STATUS);

/**
 * Valid site status transitions enforced by the state machine.
 * FEDERATION-INV: decommissioned is terminal.
 */
export const VALID_SITE_TRANSITIONS: Record<SiteStatus, SiteStatus[]> = {
  [SITE_STATUS.PROVISIONING]: [SITE_STATUS.ACTIVE],
  [SITE_STATUS.ACTIVE]: [SITE_STATUS.MAINTENANCE, SITE_STATUS.SUSPENDED],
  [SITE_STATUS.MAINTENANCE]: [SITE_STATUS.ACTIVE],
  [SITE_STATUS.SUSPENDED]: [SITE_STATUS.ACTIVE, SITE_STATUS.DECOMMISSIONED],
  [SITE_STATUS.DECOMMISSIONED]: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Control Limits
// ─────────────────────────────────────────────────────────────────────────────

export const ControlLimitsSchema = z.object({
  maxConveyorSpeedPercent: z.number().min(0).max(100),
  maxTemperatureCelsius: z.number().positive(),
  emergencyStopBudgetMs: z.number().positive().max(30_000),
});

export type ControlLimits = z.infer<typeof ControlLimitsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Production Line and Equipment Topology
// ─────────────────────────────────────────────────────────────────────────────

export const ProductionLineSchema = z.object({
  lineId: z.string().min(1),
  lineName: z.string().min(1),
  zones: z.array(z.string().min(1)),
  capacity: z.number().positive(),
});

export type ProductionLine = z.infer<typeof ProductionLineSchema>;

export const CameraZoneSchema = z.object({
  zoneId: z.string().min(1),
  cameraId: z.string().min(1),
  streamUrl: z.string().url().optional(),
  description: z.string().optional(),
});

export type CameraZone = z.infer<typeof CameraZoneSchema>;

export const EquipmentTopologySchema = z.object({
  lines: z.array(ProductionLineSchema),
  plcAddresses: z.record(z.string()),
  cameraZones: z.array(CameraZoneSchema).optional(),
});

export type EquipmentTopology = z.infer<typeof EquipmentTopologySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Site Config
// ─────────────────────────────────────────────────────────────────────────────

export const SiteConfigSchema = z.object({
  timezone: z.string().min(1),
  locale: z.string().min(2).max(10),
  alertThresholds: z.record(z.number()).optional(),
  controlLimits: ControlLimitsSchema.optional(),
  retentionDays: z.number().int().min(30).max(2555).default(90),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Site Profile
// ─────────────────────────────────────────────────────────────────────────────

export const SiteProfileSchema = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(200),
  region: z.string().min(1).max(100),
  status: SiteStatusSchema,
  tier: SiteTierSchema,
  platformVersion: z.string().min(1),
  tenantId: z.string().min(1).default('default'),
  featureFlags: z.record(z.boolean()).optional(),
  equipmentTopology: EquipmentTopologySchema.optional(),
  config: SiteConfigSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SiteProfile = z.infer<typeof SiteProfileSchema>;

// Request schema for creating a new site
export const CreateSiteRequestSchema = SiteProfileSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  platformVersion: z.string().min(1).optional(),
});

export type CreateSiteRequest = z.infer<typeof CreateSiteRequestSchema>;

// Request schema for updating site status
export const UpdateSiteStatusRequestSchema = z.object({
  status: SiteStatusSchema,
  reason: z.string().min(1).max(1000),
});

export type UpdateSiteStatusRequest = z.infer<typeof UpdateSiteStatusRequestSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Platform Contracts
// ─────────────────────────────────────────────────────────────────────────────

export const PlatformContractsSchema = z.object({
  apiVersion: z.string().min(1),
  eventSchemaVersion: z.string().min(1),
  minPlatformVersion: z.string().min(1),
});

export type PlatformContracts = z.infer<typeof PlatformContractsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Federation Topology
// ─────────────────────────────────────────────────────────────────────────────

export const FederationTopologySchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(0),
  sites: z.array(SiteProfileSchema),
  defaultFeatureFlags: z.record(z.boolean()),
  platformContracts: PlatformContractsSchema,
  updatedAt: z.string().datetime(),
});

export type FederationTopology = z.infer<typeof FederationTopologySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const TENANT_PLAN = {
  ENTERPRISE: 'enterprise',
  STANDARD: 'standard',
  TRIAL: 'trial',
} as const;

export type TenantPlan = (typeof TENANT_PLAN)[keyof typeof TENANT_PLAN];

export const SSOConfigSchema = z.object({
  provider: z.string().min(1),
  issuerUrl: z.string().url(),
  clientId: z.string().min(1),
});

export type SSOConfig = z.infer<typeof SSOConfigSchema>;

export const TenantConfigSchema = z.object({
  tenantId: z.string().min(1).default('default'),
  name: z.string().min(1).max(200),
  plan: z.nativeEnum(TENANT_PLAN),
  sites: z.array(z.string().uuid()),
  featureFlags: z.record(z.boolean()).optional(),
  ssoConfig: SSOConfigSchema.nullable().optional(),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// State Machine Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that a site status transition is allowed by the state machine.
 * FEDERATION-INV-002: No commands may go to suspended/decommissioned sites.
 */
export function isValidSiteTransition(from: SiteStatus, to: SiteStatus): boolean {
  return VALID_SITE_TRANSITIONS[from].includes(to);
}

/**
 * Check if a site is operable (can receive control commands).
 * Guards FEDERATION-INV-002.
 */
export function isSiteOperable(status: SiteStatus): boolean {
  return status === SITE_STATUS.ACTIVE;
}
