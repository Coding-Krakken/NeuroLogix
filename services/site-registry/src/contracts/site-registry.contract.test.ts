import { beforeEach, describe, expect, it } from 'vitest';
import {
  CreateSiteRequestSchema,
  FeatureFlagSchema,
  FederationTopologySchema,
  SiteProfileSchema,
  UpdateSiteStatusRequestSchema,
  validateEndpointAgainstContract,
} from '@neurologix/schemas';
import {
  SITE_REGISTRY_ERROR_CODES,
  SiteRegistryService,
} from '../services/site-registry.service.js';

describe('Site Registry Service Contract Baseline', () => {
  let service: SiteRegistryService;

  beforeEach(() => {
    service = new SiteRegistryService();
  });

  it('validates required federation endpoint contracts for implemented operations', () => {
    const requiredEndpoints: Array<['GET' | 'POST' | 'PATCH' | 'PUT', string]> = [
      ['GET', '/api/sites'],
      ['POST', '/api/sites'],
      ['PATCH', '/api/sites/:siteId/status'],
      ['PUT', '/api/feature-flags/:key'],
      ['GET', '/api/federation'],
    ];

    for (const [method, path] of requiredEndpoints) {
      const result = validateEndpointAgainstContract(method, path);
      expect(result.valid, `${method} ${path} -> ${result.issues.join('; ')}`).toBe(true);
      expect(result.issues).toHaveLength(0);
    }
  });

  it('enforces create site request/response contract shape', async () => {
    const request = CreateSiteRequestSchema.parse({
      slug: 'contract-site-a',
      name: 'Contract Site A',
      region: 'eu-west-1',
      tier: 'T1',
      platformVersion: '0.1.0',
      config: {
        timezone: 'Europe/London',
        locale: 'en-GB',
      },
    });

    const created = await service.createSite(request);
    const parsed = SiteProfileSchema.parse(created);

    expect(parsed.slug).toBe(request.slug);
    expect(parsed.status).toBe('provisioning');
  });

  it('enforces status transition request/response contract shape', async () => {
    const site = await service.createSite(
      CreateSiteRequestSchema.parse({
        slug: 'contract-site-b',
        name: 'Contract Site B',
        region: 'us-west-2',
        tier: 'T1',
        config: {
          timezone: 'America/Los_Angeles',
          locale: 'en-US',
        },
      })
    );

    const transition = UpdateSiteStatusRequestSchema.parse({
      status: 'active',
      reason: 'Contract baseline activation',
    });

    const updated = await service.updateSiteStatus(site.id, transition);
    const parsed = SiteProfileSchema.parse(updated);

    expect(parsed.id).toBe(site.id);
    expect(parsed.status).toBe('active');
  });

  it('returns DUPLICATE_SLUG error code aligned with contract expectations', async () => {
    const request = CreateSiteRequestSchema.parse({
      slug: 'contract-site-c',
      name: 'Contract Site C',
      region: 'eu-central-1',
      tier: 'T1',
      config: {
        timezone: 'Europe/Berlin',
        locale: 'de-DE',
      },
    });

    await service.createSite(request);

    await expect(service.createSite(request)).rejects.toMatchObject({
      code: SITE_REGISTRY_ERROR_CODES.DUPLICATE_SLUG,
    });
  });

  it('enforces feature-flag upsert contract shape', async () => {
    const flag = FeatureFlagSchema.parse({
      key: 'contract-flag',
      description: 'Contract coverage flag',
      defaultValue: false,
      rolloutConfig: {
        strategy: 'none',
        percentage: 0,
      },
    });

    const upserted = await service.upsertFeatureFlag(flag);
    const parsed = FeatureFlagSchema.parse(upserted);

    expect(parsed.key).toBe('contract-flag');
  });

  it('enforces federation topology response contract shape', async () => {
    await service.createSite(
      CreateSiteRequestSchema.parse({
        slug: 'contract-site-d',
        name: 'Contract Site D',
        region: 'ap-southeast-1',
        tier: 'T2',
        config: {
          timezone: 'Asia/Singapore',
          locale: 'en-SG',
        },
      })
    );

    const topology = await service.getFederationTopology();
    const parsed = FederationTopologySchema.parse(topology);

    expect(parsed.sites.length).toBeGreaterThanOrEqual(1);
    expect(parsed.platformContracts.apiVersion).toBe('1.0.0');
  });
});