/**
 * @fileoverview Site Registry Service
 *
 * Manages the lifecycle of sites within the NeuroLogix federation.
 * Enforces state machine transitions, validates platform contracts,
 * and resolves feature flags with precedence rules.
 *
 * Model ref: FEDERATION-001
 * Contracts ref: FEDERATION-API-001
 * Invariants: FEDERATION-INV-001 through FEDERATION-INV-008
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SiteProfile,
  SiteProfileSchema,
  SiteStatus,
  SITE_STATUS,
  SiteConfig,
  FederationTopology,
  CreateSiteRequest,
  UpdateSiteStatusRequest,
  EquipmentTopology,
  isValidSiteTransition,
  isSiteOperable,
  PlatformContracts,
  FeatureFlag,
  ResolvedFeatureFlag,
  resolveFeatureFlag,
  DEFAULT_FEATURE_FLAGS,
} from '@neurologix/schemas';

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

export class SiteRegistryError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'SiteRegistryError';
  }
}

export const SITE_REGISTRY_ERROR_CODES = {
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  DUPLICATE_SLUG: 'DUPLICATE_SLUG',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  STALE_VERSION: 'STALE_VERSION',
  SITE_NOT_OPERABLE: 'SITE_NOT_OPERABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SiteListFilter {
  status?: SiteStatus;
  tier?: string;
  region?: string;
  tenantId?: string;
}

export interface SiteListResult {
  sites: SiteProfile[];
  total: number;
  version: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit helper
// ─────────────────────────────────────────────────────────────────────────────

function logAuditEvent(event: {
  action: string;
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'failure';
  details?: Record<string, unknown>;
}) {
  // FEDERATION-INV-006: All site lifecycle events are logged immutably.
  // In production this writes to the ELK audit log via Pino structured logging.
  console.log(
    JSON.stringify({
      level: 'audit',
      timestamp: new Date().toISOString(),
      ...event,
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Site Registry Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * In-memory site registry service.
 * Replace the private stores with a persistent adapter (Postgres/Redis)
 * before moving to production — the public interface is stable.
 */
export class SiteRegistryService {
  private sites: Map<string, SiteProfile> = new Map();
  private slugIndex: Map<string, string> = new Map(); // slug → siteId
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private topologyVersion = 0;

  private readonly platformContracts: PlatformContracts;

  constructor(
    platformContracts: PlatformContracts = {
      apiVersion: '1.0.0',
      eventSchemaVersion: '1.0.0',
      minPlatformVersion: '0.1.0',
    },
  ) {
    this.platformContracts = platformContracts;
  }

  // ─── Site CRUD ─────────────────────────────────────────────────────────────

  /**
   * Register a new site in the federation.
   * Enforces FEDERATION-INV-001 (unique slug).
   */
  async createSite(req: CreateSiteRequest): Promise<SiteProfile> {
    // FEDERATION-INV-001: slug must be unique
    if (this.slugIndex.has(req.slug)) {
      logAuditEvent({
        action: 'site.register',
        resource: 'site',
        outcome: 'failure',
        details: { slug: req.slug, reason: 'duplicate_slug' },
      });
      throw new SiteRegistryError(
        SITE_REGISTRY_ERROR_CODES.DUPLICATE_SLUG,
        `Site slug '${req.slug}' is already registered in the federation`,
      );
    }

    const now = new Date().toISOString();
    const site: SiteProfile = SiteProfileSchema.parse({
      id: uuidv4(),
      slug: req.slug,
      name: req.name,
      region: req.region,
      status: SITE_STATUS.PROVISIONING,
      tier: req.tier,
      tenantId: req.tenantId ?? 'default',
      platformVersion: req.platformVersion ?? this.platformContracts.minPlatformVersion,
      featureFlags: req.featureFlags ?? {},
      equipmentTopology: req.equipmentTopology,
      config: req.config,
      createdAt: now,
      updatedAt: now,
    });

    this.sites.set(site.id, site);
    this.slugIndex.set(site.slug, site.id);
    this.topologyVersion += 1;

    logAuditEvent({
      action: 'site.register',
      resource: 'site',
      resourceId: site.id,
      outcome: 'success',
      details: { slug: site.slug, region: site.region, tier: site.tier },
    });

    return site;
  }

  /**
   * Get a site by ID.
   */
  async getSite(siteId: string): Promise<SiteProfile | null> {
    return this.sites.get(siteId) ?? null;
  }

  /**
   * Get a site by slug.
   */
  async getSiteBySlug(slug: string): Promise<SiteProfile | null> {
    const siteId = this.slugIndex.get(slug);
    if (!siteId) return null;
    return this.sites.get(siteId) ?? null;
  }

  /**
   * List sites with optional filtering.
   */
  async listSites(filter: SiteListFilter = {}): Promise<SiteListResult> {
    let results = Array.from(this.sites.values());

    if (filter.status) {
      results = results.filter(s => s.status === filter.status);
    }
    if (filter.tier) {
      results = results.filter(s => s.tier === filter.tier);
    }
    if (filter.region) {
      results = results.filter(s => s.region === filter.region);
    }
    if (filter.tenantId) {
      results = results.filter(s => s.tenantId === filter.tenantId);
    }

    return {
      sites: results,
      total: results.length,
      version: this.topologyVersion,
    };
  }

  /**
   * Transition a site's status through the state machine.
   * Enforces FEDERATION-INV-002 (no commands to suspended/decommissioned).
   */
  async updateSiteStatus(
    siteId: string,
    req: UpdateSiteStatusRequest,
  ): Promise<SiteProfile> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new SiteRegistryError(
        SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND,
        `Site '${siteId}' not found`,
      );
    }

    if (!isValidSiteTransition(site.status, req.status)) {
      logAuditEvent({
        action: 'site.status_transition',
        resource: 'site',
        resourceId: siteId,
        outcome: 'failure',
        details: { from: site.status, to: req.status, reason: 'invalid_transition' },
      });
      throw new SiteRegistryError(
        SITE_REGISTRY_ERROR_CODES.INVALID_TRANSITION,
        `Cannot transition site from '${site.status}' to '${req.status}'`,
      );
    }

    const updated: SiteProfile = {
      ...site,
      status: req.status,
      updatedAt: new Date().toISOString(),
    };

    this.sites.set(siteId, updated);
    this.topologyVersion += 1;

    logAuditEvent({
      action: 'site.status_transition',
      resource: 'site',
      resourceId: siteId,
      outcome: 'success',
      details: { from: site.status, to: req.status, reason: req.reason },
    });

    return updated;
  }

  /**
   * Replace the operational configuration for a site.
   */
  async updateSiteConfig(siteId: string, config: SiteConfig): Promise<SiteProfile> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new SiteRegistryError(
        SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND,
        `Site '${siteId}' not found`,
      );
    }

    const updated: SiteProfile = {
      ...site,
      config,
      updatedAt: new Date().toISOString(),
    };

    this.sites.set(siteId, updated);
    this.topologyVersion += 1;

    logAuditEvent({
      action: 'site.config_updated',
      resource: 'site',
      resourceId: siteId,
      outcome: 'success',
    });

    return updated;
  }

  /**
   * Update equipment topology for a site.
   */
  async updateEquipmentTopology(
    siteId: string,
    topology: EquipmentTopology,
  ): Promise<SiteProfile> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new SiteRegistryError(
        SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND,
        `Site '${siteId}' not found`,
      );
    }

    const updated: SiteProfile = {
      ...site,
      equipmentTopology: topology,
      updatedAt: new Date().toISOString(),
    };

    this.sites.set(siteId, updated);

    logAuditEvent({
      action: 'site.topology_updated',
      resource: 'site',
      resourceId: siteId,
      outcome: 'success',
    });

    return updated;
  }

  // ─── Feature Flags ─────────────────────────────────────────────────────────

  /**
   * Register or update a global feature flag definition.
   */
  async upsertFeatureFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    this.featureFlags.set(flag.key, flag);

    logAuditEvent({
      action: 'feature_flag.upsert',
      resource: 'feature_flag',
      resourceId: flag.key,
      outcome: 'success',
      details: { defaultValue: flag.defaultValue },
    });

    return flag;
  }

  /**
   * Get all registered feature flag definitions.
   */
  async listFeatureFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Override feature flags at the site level.
   * FEDERATION-INV-008: site overrides take highest precedence.
   */
  async setFeatureFlagOverrides(
    siteId: string,
    overrides: Record<string, boolean>,
  ): Promise<SiteProfile> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new SiteRegistryError(
        SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND,
        `Site '${siteId}' not found`,
      );
    }

    const updated: SiteProfile = {
      ...site,
      featureFlags: { ...(site.featureFlags ?? {}), ...overrides },
      updatedAt: new Date().toISOString(),
    };

    this.sites.set(siteId, updated);
    this.topologyVersion += 1;

    logAuditEvent({
      action: 'feature_flag.site_override',
      resource: 'site',
      resourceId: siteId,
      outcome: 'success',
      details: { overrides },
    });

    return updated;
  }

  /**
   * Resolve all feature flags for a given site applying precedence:
   * global defaults → tenant overrides → site overrides (FEDERATION-INV-008).
   */
  async resolveFeatureFlags(
    siteId: string,
    tenantFlags?: Record<string, boolean>,
  ): Promise<ResolvedFeatureFlag[]> {
    const site = this.sites.get(siteId);
    const siteFlags = site?.featureFlags;

    // Merge global defaults with registered flag definitions
    const globalFlags: Record<string, boolean> = { ...DEFAULT_FEATURE_FLAGS };
    for (const [key, flag] of this.featureFlags.entries()) {
      globalFlags[key] = flag.defaultValue;
    }

    // Resolve each known key
    const allKeys = new Set([
      ...Object.keys(globalFlags),
      ...Object.keys(tenantFlags ?? {}),
      ...Object.keys(siteFlags ?? {}),
    ]);

    return Array.from(allKeys).map(key =>
      resolveFeatureFlag(key, globalFlags, tenantFlags, siteFlags),
    );
  }

  /**
   * Check if a specific feature flag is enabled for a site.
   * Convenience wrapper around resolveFeatureFlags.
   */
  async isFeatureEnabled(
    key: string,
    siteId: string,
    tenantFlags?: Record<string, boolean>,
  ): Promise<boolean> {
    const site = this.sites.get(siteId);
    const siteFlags = site?.featureFlags;

    const globalFlags: Record<string, boolean> = { ...DEFAULT_FEATURE_FLAGS };
    for (const [k, flag] of this.featureFlags.entries()) {
      globalFlags[k] = flag.defaultValue;
    }

    const resolved = resolveFeatureFlag(key, globalFlags, tenantFlags, siteFlags);
    return resolved.resolvedValue;
  }

  // ─── Federation Topology ───────────────────────────────────────────────────

  /**
   * Get the full federation topology.
   * Includes all sites, platform contracts, and global feature flag defaults.
   */
  async getFederationTopology(): Promise<FederationTopology> {
    const globalFlags: Record<string, boolean> = { ...DEFAULT_FEATURE_FLAGS };
    for (const [key, flag] of this.featureFlags.entries()) {
      globalFlags[key] = flag.defaultValue;
    }

    return {
      id: uuidv4(), // In production: stable topology ID stored in DB
      version: this.topologyVersion,
      sites: Array.from(this.sites.values()),
      defaultFeatureFlags: globalFlags,
      platformContracts: this.platformContracts,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Assert that a site is operable before dispatching control commands.
   * Enforces FEDERATION-INV-002: no commands to suspended/decommissioned sites.
   */
  assertSiteOperable(siteId: string): void {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new SiteRegistryError(
        SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND,
        `Site '${siteId}' not found`,
      );
    }
    if (!isSiteOperable(site.status)) {
      throw new SiteRegistryError(
        SITE_REGISTRY_ERROR_CODES.SITE_NOT_OPERABLE,
        `Site '${site.slug}' is not operable (current status: ${site.status})`,
      );
    }
  }

  /**
   * Get current topology version for optimistic concurrency checks.
   * FEDERATION-INV-003: version increments monotonically.
   */
  getTopologyVersion(): number {
    return this.topologyVersion;
  }
}
