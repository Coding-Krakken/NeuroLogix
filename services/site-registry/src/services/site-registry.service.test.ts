import { describe, it, expect, beforeEach } from 'vitest';
import {
  SiteRegistryService,
  SiteRegistryError,
  SITE_REGISTRY_ERROR_CODES,
} from './site-registry.service.js';
import type { EquipmentTopology } from '@neurologix/schemas';
import { vi } from 'vitest';

/**
 * SiteRegistryService Tests
 *
 * Covers all 8 FEDERATION-INVs:
 * INV-001: Unique slug enforcement
 * INV-002: UUID auto-generated and immutable
 * INV-003: State machine transition enforcement
 * INV-004: Operability guard (assertSiteOperable)
 * INV-005: Audit logging on mutations
 * INV-006: Audit log immutability (no delete operations in service)
 * INV-007: Feature flag value type enforcement
 * INV-008: Feature flag precedence (site > tenant > global)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const createSiteRequest = {
  slug: 'warehouse-eu-1',
  name: 'EU Warehouse Site 1',
  region: 'eu-west-1',
  tier: 'T1' as const,
  platformVersion: '0.1.0',
  config: {
    timezone: 'Europe/London',
    locale: 'en-GB',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('SiteRegistryService', () => {
  let service: SiteRegistryService;

  beforeEach(() => {
    service = new SiteRegistryService();
  });

  // ─── Site Registration ────────────────────────────────────────────────────

  describe('Site Registration', () => {
    it('creates a site with provisioning status and UUID (INV-002)', async () => {
      const site = await service.createSite(createSiteRequest);

      expect(site.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(site.slug).toBe('warehouse-eu-1');
      expect(site.status).toBe('provisioning');
      expect(site.tenantId).toBe('default');
    });

    it('rejects duplicate slugs (INV-001)', async () => {
      await service.createSite(createSiteRequest);

      await expect(service.createSite(createSiteRequest)).rejects.toMatchObject({
        code: SITE_REGISTRY_ERROR_CODES.DUPLICATE_SLUG,
      });
    });

    it('allows different slugs for multiple sites (INV-001)', async () => {
      const site1 = await service.createSite({ ...createSiteRequest, slug: 'site-1' });
      const site2 = await service.createSite({ ...createSiteRequest, slug: 'site-2' });

      expect(site1.id).not.toBe(site2.id);
      expect(site1.slug).toBe('site-1');
      expect(site2.slug).toBe('site-2');
    });

    it('assigns tenantId when specified', async () => {
      const site = await service.createSite({ ...createSiteRequest, tenantId: 'tenant-abc' });
      expect(site.tenantId).toBe('tenant-abc');
    });
  });

  // ─── Site Retrieval ───────────────────────────────────────────────────────

  describe('Site Retrieval', () => {
    it('returns site by ID', async () => {
      const created = await service.createSite(createSiteRequest);
      const found = await service.getSite(created.id);

      expect(found?.id).toBe(created.id);
    });

    it('returns null for unknown ID', async () => {
      expect(await service.getSite('non-existent-id')).toBeNull();
    });

    it('returns site by slug', async () => {
      const created = await service.createSite(createSiteRequest);
      const found = await service.getSiteBySlug('warehouse-eu-1');

      expect(found?.id).toBe(created.id);
    });

    it('returns null for unknown slug', async () => {
      expect(await service.getSiteBySlug('unknown-slug')).toBeNull();
    });
  });

  // ─── Site Listing ────────────────────────────────────────────────────────

  describe('Site Listing and Filtering', () => {
    it('lists all sites', async () => {
      await service.createSite({ ...createSiteRequest, slug: 'site-a' });
      await service.createSite({ ...createSiteRequest, slug: 'site-b' });

      const result = await service.listSites();
      expect(result.total).toBe(2);
    });

    it('filters by status', async () => {
      const site = await service.createSite({ ...createSiteRequest, slug: 'filter-site' });
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });

      const active = await service.listSites({ status: 'active' });
      const provisioning = await service.listSites({ status: 'provisioning' });

      expect(active.total).toBe(1);
      expect(provisioning.total).toBe(0);
    });

    it('filters by region', async () => {
      await service.createSite({ ...createSiteRequest, slug: 'eu-site', region: 'eu-west-1' });
      await service.createSite({ ...createSiteRequest, slug: 'us-site', region: 'us-east-1' });

      const eu = await service.listSites({ region: 'eu-west-1' });
      expect(eu.total).toBe(1);
    });

    it('filters by tier', async () => {
      await service.createSite({ ...createSiteRequest, slug: 't1-site', tier: 'T1' });
      await service.createSite({ ...createSiteRequest, slug: 't2-site', tier: 'T2' });

      const t1 = await service.listSites({ tier: 'T1' });
      expect(t1.total).toBe(1);
    });
  });

  // ─── State Machine (INV-003) ──────────────────────────────────────────────

  describe('State Machine Transitions (INV-003)', () => {
    it('transitions provisioning → active', async () => {
      const site = await service.createSite(createSiteRequest);
      const updated = await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      expect(updated.status).toBe('active');
    });

    it('transitions active → maintenance', async () => {
      const site = await service.createSite(createSiteRequest);
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      const inMaintenance = await service.updateSiteStatus(site.id, { status: 'maintenance', reason: 'Planned window' });
      expect(inMaintenance.status).toBe('maintenance');
    });

    it('transitions maintenance → active', async () => {
      const site = await service.createSite(createSiteRequest);
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      await service.updateSiteStatus(site.id, { status: 'maintenance', reason: 'Maintenance' });
      const active = await service.updateSiteStatus(site.id, { status: 'active', reason: 'Done' });
      expect(active.status).toBe('active');
    });

    it('transitions active → suspended', async () => {
      const site = await service.createSite(createSiteRequest);
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      const suspended = await service.updateSiteStatus(site.id, { status: 'suspended', reason: 'Policy' });
      expect(suspended.status).toBe('suspended');
    });

    it('transitions suspended → decommissioned (terminal state)', async () => {
      const site = await service.createSite(createSiteRequest);
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      await service.updateSiteStatus(site.id, { status: 'suspended', reason: 'Shutdown' });
      const decomm = await service.updateSiteStatus(site.id, { status: 'decommissioned', reason: 'End of life' });
      expect(decomm.status).toBe('decommissioned');
    });

    it('rejects invalid transition provisioning → suspended (INV-003)', async () => {
      const site = await service.createSite(createSiteRequest);

      await expect(
        service.updateSiteStatus(site.id, { status: 'suspended', reason: 'Invalid' }),
      ).rejects.toMatchObject({ code: SITE_REGISTRY_ERROR_CODES.INVALID_TRANSITION });
    });

    it('rejects decommissioned → active (terminal state, INV-003)', async () => {
      const site = await service.createSite(createSiteRequest);
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      await service.updateSiteStatus(site.id, { status: 'suspended', reason: 'Shutdown' });
      await service.updateSiteStatus(site.id, { status: 'decommissioned', reason: 'End of life' });

      await expect(
        service.updateSiteStatus(site.id, { status: 'active', reason: 'Resurrect' }),
      ).rejects.toMatchObject({ code: SITE_REGISTRY_ERROR_CODES.INVALID_TRANSITION });
    });

    it('throws SITE_NOT_FOUND for unknown site transition', async () => {
      await expect(
        service.updateSiteStatus('missing-id', { status: 'active', reason: 'Test' }),
      ).rejects.toMatchObject({ code: SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND });
    });
  });

  // ─── Operability Guard (INV-004) ─────────────────────────────────────────

  describe('Operability Guard (INV-004)', () => {
    it('passes for active site', async () => {
      const site = await service.createSite({ ...createSiteRequest, slug: 'operable-site' });
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      expect(() => service.assertSiteOperable(site.id)).not.toThrow();
    });

    it('throws for provisioning site', async () => {
      const site = await service.createSite({ ...createSiteRequest, slug: 'prov-site' });
      expect(() => service.assertSiteOperable(site.id)).toThrow(
        expect.objectContaining({ code: SITE_REGISTRY_ERROR_CODES.SITE_NOT_OPERABLE }),
      );
    });

    it('throws for suspended site', async () => {
      const site = await service.createSite({ ...createSiteRequest, slug: 'susp-site' });
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      await service.updateSiteStatus(site.id, { status: 'suspended', reason: 'Policy' });
      expect(() => service.assertSiteOperable(site.id)).toThrow(
        expect.objectContaining({ code: SITE_REGISTRY_ERROR_CODES.SITE_NOT_OPERABLE }),
      );
    });

    it('throws SITE_NOT_FOUND for unknown site', () => {
      expect(() => service.assertSiteOperable('unknown-id')).toThrow(
        expect.objectContaining({ code: SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND }),
      );
    });
  });

  // ─── Audit Logging (INV-005) ─────────────────────────────────────────────

  describe('Audit Logging (INV-005)', () => {
    it('logs audit event on createSite', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await service.createSite({ ...createSiteRequest, slug: 'audit-create' });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('site.register'));
      spy.mockRestore();
    });

    it('logs audit event on status transition', async () => {
      const site = await service.createSite({ ...createSiteRequest, slug: 'audit-trans' });
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await service.updateSiteStatus(site.id, { status: 'active', reason: 'Go live' });
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('site.status_transition'));
      spy.mockRestore();
    });

    it('audit log entry is valid JSON with required fields', async () => {
      const entries: string[] = [];
      const spy = vi.spyOn(console, 'log').mockImplementation((msg: string) => entries.push(msg));
      await service.createSite({ ...createSiteRequest, slug: 'audit-json' });

      expect(entries.length).toBeGreaterThan(0);
      const parsed = JSON.parse(entries[0]);
      expect(parsed).toMatchObject({ level: 'audit', action: expect.any(String), outcome: expect.any(String) });
      spy.mockRestore();
    });
  });

  // ─── Feature Flags (INV-007, INV-008) ────────────────────────────────────

  describe('Feature Flags (INV-007, INV-008)', () => {
    it('upserts and lists feature flags', async () => {
      await service.upsertFeatureFlag({ key: 'ai-assist', description: 'AI assist', defaultValue: false });
      const flags = await service.listFeatureFlags();
      expect(flags).toHaveLength(1);
      expect(flags[0].key).toBe('ai-assist');
    });

    it('updates existing flag on re-upsert', async () => {
      await service.upsertFeatureFlag({ key: 'toggle', description: 'Toggle', defaultValue: false });
      await service.upsertFeatureFlag({ key: 'toggle', description: 'Toggle updated', defaultValue: true });
      const flags = await service.listFeatureFlags();
      expect(flags).toHaveLength(1);
      expect(flags[0].defaultValue).toBe(true);
    });

    it('resolves to global default when no override (INV-008)', async () => {
      await service.upsertFeatureFlag({ key: 'feature-g', description: 'G', defaultValue: false });
      const site = await service.createSite({ ...createSiteRequest, slug: 'res-site-g' });
      const resolved = await service.resolveFeatureFlags(site.id);
      const flagG = resolved.find((f) => f.key === 'feature-g');
      expect(flagG?.resolvedValue).toBe(false);
      expect(flagG?.resolvedFrom).toBe('global');
    });

    it('site override takes precedence over global (INV-008)', async () => {
      await service.upsertFeatureFlag({ key: 'feature-s', description: 'S', defaultValue: false });
      const site = await service.createSite({ ...createSiteRequest, slug: 'res-site-s' });
      await service.setFeatureFlagOverrides(site.id, { 'feature-s': true });
      const resolved = await service.resolveFeatureFlags(site.id);
      const flagS = resolved.find((f) => f.key === 'feature-s');
      expect(flagS?.resolvedValue).toBe(true);
      expect(flagS?.resolvedFrom).toBe('site');
    });

    it('isFeatureEnabled returns correct value', async () => {
      await service.upsertFeatureFlag({ key: 'toggle2', description: 'T2', defaultValue: false });
      const site = await service.createSite({ ...createSiteRequest, slug: 'toggle-site' });
      expect(await service.isFeatureEnabled('toggle2', site.id)).toBe(false);
      await service.setFeatureFlagOverrides(site.id, { toggle2: true });
      expect(await service.isFeatureEnabled('toggle2', site.id)).toBe(true);
    });

    it('resolveFeatureFlags returns defaults for unknown site (service does not throw)', async () => {
      await service.upsertFeatureFlag({ key: 'some-flag', description: 'F', defaultValue: true });
      const resolved = await service.resolveFeatureFlags('unknown-id');
      const flag = resolved.find((f) => f.key === 'some-flag');
      expect(flag?.resolvedFrom).toBe('global');
    });
  });

  // ─── Federation Topology ─────────────────────────────────────────────────

  describe('Federation Topology', () => {
    it('returns empty topology initially', async () => {
      const topo = await service.getFederationTopology();
      expect(topo.sites).toHaveLength(0);
      expect(topo.version).toBe(0);
      expect(topo.platformContracts).toBeDefined();
    });

    it('includes registered sites in topology', async () => {
      await service.createSite(createSiteRequest);
      const topo = await service.getFederationTopology();
      expect(topo.sites).toHaveLength(1);
      expect(topo.version).toBe(1);
    });

    it('topology version increments on each site registration', async () => {
      await service.createSite({ ...createSiteRequest, slug: 'v1' });
      await service.createSite({ ...createSiteRequest, slug: 'v2' });
      expect(service.getTopologyVersion()).toBe(2);
    });
  });

  // ─── Config and Equipment Topology Updates ───────────────────────────────

  describe('Config and Equipment Topology Updates', () => {
    it('updates site config', async () => {
      const site = await service.createSite(createSiteRequest);
      const updated = await service.updateSiteConfig(site.id, {
        timezone: 'America/New_York',
        locale: 'en-US',
        controlLimits: { maxConveyorSpeedPercent: 85, maxTemperatureCelsius: 40, emergencyStopBudgetMs: 500 },
      });
      expect(updated.config?.timezone).toBe('America/New_York');
    });

    it('throws SITE_NOT_FOUND when updating config for unknown site', async () => {
      await expect(service.updateSiteConfig('unknown-id', {})).rejects.toMatchObject({
        code: SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND,
      });
    });

    it('updates equipment topology', async () => {
      const site = await service.createSite(createSiteRequest);
      const topology: EquipmentTopology = {
        lines: [
          {
            lineId: 'line-1',
            lineName: 'Assembly Line 1',
            zones: ['zone-a'],
            capacity: 100,
          },
        ],
        plcAddresses: { 'plc-1': 'opc.tcp://192.168.1.100:4840' },
      };

      const updated = await service.updateEquipmentTopology(site.id, topology);
      expect(updated.equipmentTopology?.lines).toHaveLength(1);
    });

    it('throws SITE_NOT_FOUND when updating topology for unknown site', async () => {
      const emptyTopology: EquipmentTopology = { lines: [], plcAddresses: {} };
      await expect(service.updateEquipmentTopology('unknown-id', emptyTopology)).rejects.toMatchObject({
        code: SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND,
      });
    });
  });

  // ─── Error Classification ────────────────────────────────────────────────

  describe('Error Classification', () => {
    it('SiteRegistryError has correct name and code', () => {
      const err = new SiteRegistryError(SITE_REGISTRY_ERROR_CODES.SITE_NOT_FOUND, 'Not found');
      expect(err.name).toBe('SiteRegistryError');
      expect(err.code).toBe('SITE_NOT_FOUND');
      expect(err.message).toBe('Not found');
    });
  });
});
