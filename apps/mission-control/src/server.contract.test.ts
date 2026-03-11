import { describe, expect, it } from 'vitest';
import {
  FEDERATION_API_CONTRACTS,
  FederationTopologySchema,
  SiteProfileSchema,
  getContractById,
  validateEndpointAgainstContract,
} from '@neurologix/schemas';
import { buildMissionControlServer } from './server.js';

const COVERED_PROVIDER_CONTRACT_IDS = [
  'SITE-001',
  'SITE-002',
  'SITE-003',
  'SITE-004',
  'FF-001',
  'FED-001',
] as const;

function requireContract(contractId: (typeof COVERED_PROVIDER_CONTRACT_IDS)[number]) {
  const contract = getContractById(contractId);
  expect(contract).toBeDefined();
  return contract!;
}

function expectSuccessStatus(contractId: (typeof COVERED_PROVIDER_CONTRACT_IDS)[number], statusCode: number) {
  const contract = requireContract(contractId);
  expect(contract.response?.status).toBe(statusCode);
}

function expectErrorInContract(
  contractId: (typeof COVERED_PROVIDER_CONTRACT_IDS)[number],
  statusCode: number,
  code: string,
) {
  const contract = requireContract(contractId);
  const matchesContract =
    contract.errors?.some((errorSpec) => errorSpec.status === statusCode && errorSpec.code === code) ?? false;

  expect(matchesContract).toBe(true);
}

describe('Mission Control Federation Provider Contract Baseline', () => {
  it('keeps covered and uncovered federation contract IDs explicit', () => {
    const coveredIds = new Set<string>(COVERED_PROVIDER_CONTRACT_IDS);
    const uncoveredIds = FEDERATION_API_CONTRACTS
      .map((contract) => contract.id)
      .filter((contractId) => !coveredIds.has(contractId))
      .sort();

    expect(uncoveredIds).toEqual(['FF-002', 'FF-003', 'SITE-005']);
  });

  it('validates covered contract metadata entries', () => {
    for (const contractId of COVERED_PROVIDER_CONTRACT_IDS) {
      const contract = requireContract(contractId);
      const validation = validateEndpointAgainstContract(contract.method, contract.path);

      expect(validation.valid, `${contractId}: ${validation.issues.join('; ')}`).toBe(true);
      expect(validation.issues).toHaveLength(0);
    }
  });

  it('GET /api/sites returns response aligned with SITE-001', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });

    try {
      const response = await app.inject({ method: 'GET', url: '/api/sites' });
      expectSuccessStatus('SITE-001', response.statusCode);

      const body = response.json();
      expect(Array.isArray(body.sites)).toBe(true);
      expect(typeof body.total).toBe('number');
      expect(typeof body.version).toBe('number');
    } finally {
      await app.close();
    }
  });

  it('POST /api/sites success and duplicate error align with SITE-002', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    const payload = {
      slug: 'contract-provider-site-a',
      name: 'Contract Provider Site A',
      region: 'eu-west-1',
      tier: 'T1',
      config: { timezone: 'Europe/London', locale: 'en-GB' },
    };

    try {
      const created = await app.inject({ method: 'POST', url: '/api/sites', payload });
      expectSuccessStatus('SITE-002', created.statusCode);
      SiteProfileSchema.parse(created.json());

      const duplicate = await app.inject({ method: 'POST', url: '/api/sites', payload });
      expect(duplicate.statusCode).toBe(409);
      expect(duplicate.json().code).toBe('DUPLICATE_SLUG');
      expectErrorInContract('SITE-002', duplicate.statusCode, duplicate.json().code);
    } finally {
      await app.close();
    }
  });

  it('GET /api/sites/:siteId success and not-found error align with SITE-003', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });

    try {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'contract-provider-site-b',
          name: 'Contract Provider Site B',
          region: 'us-east-1',
          tier: 'T2',
          config: { timezone: 'America/New_York', locale: 'en-US' },
        },
      });

      const createdSite = SiteProfileSchema.parse(createResponse.json());
      const found = await app.inject({ method: 'GET', url: `/api/sites/${createdSite.id}` });
      expectSuccessStatus('SITE-003', found.statusCode);
      SiteProfileSchema.parse(found.json());

      const missing = await app.inject({ method: 'GET', url: '/api/sites/no-such-site' });
      expect(missing.statusCode).toBe(404);
      expect(missing.json().code).toBe('SITE_NOT_FOUND');
      expectErrorInContract('SITE-003', missing.statusCode, missing.json().code);
    } finally {
      await app.close();
    }
  });

  it('PATCH /api/sites/:siteId/status success and not-found error align with SITE-004', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });

    try {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'contract-provider-site-c',
          name: 'Contract Provider Site C',
          region: 'ap-southeast-1',
          tier: 'T1',
          config: { timezone: 'Asia/Singapore', locale: 'en-SG' },
        },
      });

      const createdSite = SiteProfileSchema.parse(createResponse.json());
      const updated = await app.inject({
        method: 'PATCH',
        url: `/api/sites/${createdSite.id}/status`,
        payload: { status: 'active', reason: 'Contract baseline transition' },
      });

      expectSuccessStatus('SITE-004', updated.statusCode);
      SiteProfileSchema.parse(updated.json());

      const missing = await app.inject({
        method: 'PATCH',
        url: '/api/sites/no-such-site/status',
        payload: { status: 'active', reason: 'Contract baseline missing-site check' },
      });

      expect(missing.statusCode).toBe(404);
      expect(missing.json().code).toBe('SITE_NOT_FOUND');
      expectErrorInContract('SITE-004', missing.statusCode, missing.json().code);
    } finally {
      await app.close();
    }
  });

  it('GET /api/feature-flags?siteId=... aligns with FF-001', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });

    try {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/sites',
        payload: {
          slug: 'contract-provider-site-d',
          name: 'Contract Provider Site D',
          region: 'eu-central-1',
          tier: 'T3',
          config: { timezone: 'Europe/Berlin', locale: 'de-DE' },
        },
      });

      const createdSite = SiteProfileSchema.parse(createResponse.json());
      const response = await app.inject({
        method: 'GET',
        url: `/api/feature-flags?siteId=${createdSite.id}`,
      });

      expectSuccessStatus('FF-001', response.statusCode);
      const body = response.json();
      expect(Array.isArray(body.flags)).toBe(true);
      body.flags.forEach((flag: unknown) => {
        const candidate = flag as Record<string, unknown>;
        expect(typeof candidate.key).toBe('string');
        expect(typeof candidate.resolvedValue).toBe('boolean');
        expect(['global', 'tenant', 'site']).toContain(candidate.resolvedFrom);
      });
      expect(body.resolvedFor).toMatchObject({ siteId: createdSite.id });
    } finally {
      await app.close();
    }
  });

  it('GET /api/federation aligns with FED-001', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });

    try {
      const response = await app.inject({ method: 'GET', url: '/api/federation' });

      expectSuccessStatus('FED-001', response.statusCode);
      FederationTopologySchema.parse(response.json());
    } finally {
      await app.close();
    }
  });
});