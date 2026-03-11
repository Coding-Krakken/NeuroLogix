/**
 * Mission Control Consumer-Side Contract Baseline
 *
 * Validates that the shapes mission-control *consumes* from its dependencies
 * conform to the canonical Zod schemas in @neurologix/schemas.
 *
 * ## Purpose
 *
 * Provider (server) contract tests verify that a *service* produces data
 * matching its own contract.  Consumer (client) contract tests verify that
 * the *consuming code* correctly handles and validates the shapes it receives
 * from its providers.
 *
 * If a provider changes its response shape, these tests break explicitly,
 * making cross-boundary drift visible before it reaches production.
 *
 * ## Coverage
 *
 * | Contract Area            | Cases | Provider Source              |
 * |--------------------------|-------|------------------------------|
 * | SiteProfile list         |   2   | @neurologix/site-registry    |
 * | SiteProfile single       |   2   | @neurologix/site-registry    |
 * | Site creation            |   2   | @neurologix/site-registry    |
 * | Error codes              |   1   | @neurologix/site-registry    |
 * | Feature flag resolution  |   2   | @neurologix/site-registry    |
 * | Federation topology      |   2   | @neurologix/site-registry    |
 *
 * @see packages/schemas/src/federation/index.ts
 * @see services/site-registry/src/services/site-registry.service.ts
 * @see .github/.system-state/contracts/federation-api.yaml
 */

import { beforeEach, describe, expect, it } from 'vitest';

import {
  CreateSiteRequestSchema,
  FederationTopologySchema,
  SITE_STATUS,
  SITE_TIER,
  SiteProfileSchema,
  SiteStatusSchema,
  SiteTierSchema,
  type CreateSiteRequest,
} from '@neurologix/schemas';
import {
  SITE_REGISTRY_ERROR_CODES,
  SiteRegistryError,
  SiteRegistryService,
  type SiteListResult,
} from '@neurologix/site-registry';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeCreateRequest(overrides: Partial<{ slug: string; name: string; region: string }> = {}): CreateSiteRequest {
  return CreateSiteRequestSchema.parse({
    slug: overrides.slug ?? 'consumer-contract-site',
    name: overrides.name ?? 'Consumer Contract Site',
    region: overrides.region ?? 'eu-west-1',
    tier: SITE_TIER.T1,
    tenantId: 'tenant-consumer-test',
    config: {
      timezone: 'UTC',
      locale: 'en-GB',
      platformContracts: {
        maxSitesPerTenant: 10,
        maxEquipmentPerLine: 50,
        maxConcurrentRecipes: 5,
        auditRetentionDays: 365,
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Contract: SiteProfile list
// ─────────────────────────────────────────────────────────────────────────────

describe('Mission Control Consumer Contract — SiteProfile list', () => {
  let service: SiteRegistryService;

  beforeEach(() => {
    service = new SiteRegistryService();
  });

  it('SiteListResult shape satisfies consumer expectations for an empty registry', async () => {
    const result: SiteListResult = await service.listSites({});

    // Consumer depends on: sites[], total (number), version (number)
    expect(Array.isArray(result.sites)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(typeof result.version).toBe('number');
    expect(result.total).toBe(0);
    expect(result.sites).toHaveLength(0);
  });

  it('each SiteProfile in a list result passes SiteProfileSchema validation', async () => {
    await service.createSite(makeCreateRequest({ slug: 'consumer-list-site-a', name: 'Consumer List Site A' }));
    await service.createSite(makeCreateRequest({ slug: 'consumer-list-site-b', name: 'Consumer List Site B' }));

    const result: SiteListResult = await service.listSites({});

    expect(result.total).toBe(2);
    for (const site of result.sites) {
      // Consumer-side validation: each element must parse through canonical schema
      const parsed = SiteProfileSchema.safeParse(site);
      expect(parsed.success, `SiteProfile id=${(site as { id?: string }).id} failed schema validation`).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Contract: SiteProfile single-site lookup
// ─────────────────────────────────────────────────────────────────────────────

describe('Mission Control Consumer Contract — SiteProfile single-site lookup', () => {
  let service: SiteRegistryService;

  beforeEach(() => {
    service = new SiteRegistryService();
  });

  it('getSite returns null for unknown id without throwing an unexpected type', async () => {
    // Consumer expects: null | SiteProfile (never an exception for missing sites)
    const result = await service.getSite('non-existent-id-00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('getSite returns a SiteProfile that passes canonical schema validation', async () => {
    const created = await service.createSite(makeCreateRequest({ slug: 'consumer-single-site' }));

    const retrieved = await service.getSite(created.id);
    expect(retrieved).not.toBeNull();

    // Consumer-side shape check: what mission-control receives must be schema-valid
    const parsed = SiteProfileSchema.safeParse(retrieved);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.id).toBe(created.id);
      expect(parsed.data.slug).toBe('consumer-single-site');
      // Tier and status must be enum-valid from consumer's perspective
      expect(SiteTierSchema.safeParse(parsed.data.tier).success).toBe(true);
      expect(SiteStatusSchema.safeParse(parsed.data.status).success).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Contract: Site creation response shape
// ─────────────────────────────────────────────────────────────────────────────

describe('Mission Control Consumer Contract — site creation response', () => {
  let service: SiteRegistryService;

  beforeEach(() => {
    service = new SiteRegistryService();
  });

  it('createSite response passes SiteProfileSchema (consumer can safely consume)', async () => {
    const request = makeCreateRequest({ slug: 'consumer-create-shape' });
    const site = await service.createSite(request);

    const parsed = SiteProfileSchema.safeParse(site);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.slug).toBe('consumer-create-shape');
      expect(parsed.data.status).toBe(SITE_STATUS.PROVISIONING);
      expect(parsed.data.tier).toBe(SITE_TIER.T1);
    }
  });

  it('createSite throws SiteRegistryError with known code on duplicate slug', async () => {
    const request = makeCreateRequest({ slug: 'consumer-duplicate-slug' });
    await service.createSite(request);

    // Consumer contract: duplicate must surface as SiteRegistryError with DUPLICATE_SLUG code
    await expect(service.createSite(request)).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof SiteRegistryError &&
        err.code === SITE_REGISTRY_ERROR_CODES.DUPLICATE_SLUG,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Contract: Error codes known to consumer
// ─────────────────────────────────────────────────────────────────────────────

describe('Mission Control Consumer Contract — error code registry', () => {
  it('all SITE_REGISTRY_ERROR_CODES are non-empty strings mission-control can match against', () => {
    const codes = Object.values(SITE_REGISTRY_ERROR_CODES);
    expect(codes.length).toBeGreaterThanOrEqual(5);
    for (const code of codes) {
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
      // Codes must be SCREAMING_SNAKE_CASE — consumer uses them for error handling branches
      expect(/^[A-Z][A-Z0-9_]+$/.test(code)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Contract: Feature flag resolution
// ─────────────────────────────────────────────────────────────────────────────

describe('Mission Control Consumer Contract — feature flag resolution', () => {
  let service: SiteRegistryService;
  let siteId: string;

  beforeEach(async () => {
    service = new SiteRegistryService();
    const site = await service.createSite(makeCreateRequest({ slug: 'consumer-ff-site' }));
    siteId = site.id;
  });

  it('resolveFeatureFlags returns an array of resolved flags (consumer-expected shape)', async () => {
    const resolved = await service.resolveFeatureFlags(siteId);

    // Consumer depends on an array (may be empty)
    expect(Array.isArray(resolved)).toBe(true);
  });

  it('isFeatureEnabled returns a boolean — consumer uses it for conditional UI rendering', async () => {
    const result = await service.isFeatureEnabled(siteId, 'ai-vision');

    // Consumer contract: the return must be a plain boolean, not nullish
    expect(typeof result).toBe('boolean');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Contract: Federation topology
// ─────────────────────────────────────────────────────────────────────────────

describe('Mission Control Consumer Contract — federation topology', () => {
  let service: SiteRegistryService;

  beforeEach(async () => {
    service = new SiteRegistryService();
    await service.createSite(makeCreateRequest({ slug: 'consumer-topo-site-a', name: 'Consumer Topo A' }));
    await service.createSite(makeCreateRequest({ slug: 'consumer-topo-site-b', name: 'Consumer Topo B' }));
  });

  it('getFederationTopology returns a structure that passes FederationTopologySchema', async () => {
    const topology = await service.getFederationTopology();

    const parsed = FederationTopologySchema.safeParse(topology);
    expect(parsed.success).toBe(true);
  });

  it('federation topology sites array contains SiteProfile-compatible entries', async () => {
    const topology = await service.getFederationTopology();

    expect(Array.isArray(topology.sites)).toBe(true);
    expect(topology.sites.length).toBeGreaterThanOrEqual(2);

    for (const site of topology.sites) {
      const parsed = SiteProfileSchema.safeParse(site);
      expect(
        parsed.success,
        `Topology site id=${(site as { id?: string }).id} failed SiteProfileSchema`,
      ).toBe(true);
    }
  });
});
