/**
 * Mission Control Federation Provider Contract Baseline
 *
 * Validates that mission-control's implemented federation HTTP routes conform to
 * the canonical FEDERATION_API_CONTRACTS defined in @neurologix/schemas.
 *
 * Covered contract IDs: SITE-001, SITE-002, SITE-003, SITE-004, FF-001, FED-001
 * Explicitly uncovered (not yet implemented): SITE-005, FF-002, FF-003
 *
 * Pattern: test HTTP routes via Fastify inject(), then cross-check status codes
 * and error codes against contract metadata to detect drift early.
 *
 * @see packages/schemas/src/api/federation-contract.ts
 * @see .github/.system-state/contracts/federation-api.yaml
 */
import { describe, expect, it } from 'vitest';
import {
  FEDERATION_API_CONTRACTS,
  FederationTopologySchema,
  SiteProfileSchema,
  getContractById,
  validateEndpointAgainstContract,
  type EndpointContract,
} from '@neurologix/schemas';
import { buildMissionControlServer } from './server.js';

// ─────────────────────────────────────────────────────────────────────────────
// Coverage registry — explicit declaration of covered and uncovered contract IDs
// ─────────────────────────────────────────────────────────────────────────────

const COVERED_PROVIDER_CONTRACT_IDS = [
  'SITE-001',
  'SITE-002',
  'SITE-003',
  'SITE-004',
  'FF-001',
  'FED-001',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Contract validation helpers
// ─────────────────────────────────────────────────────────────────────────────

function requireContract(contractId: (typeof COVERED_PROVIDER_CONTRACT_IDS)[number]): EndpointContract {
  const contract = getContractById(contractId);
  expect(contract).toBeDefined();
  return contract!;
}

function expectSuccessStatus(
  contractId: (typeof COVERED_PROVIDER_CONTRACT_IDS)[number],
  actualStatusCode: number,
): void {
  const contract = requireContract(contractId);
  expect(actualStatusCode).toBe(contract.response?.status);
}

function expectErrorInContract(
  contractId: (typeof COVERED_PROVIDER_CONTRACT_IDS)[number],
  statusCode: number,
  code: string,
): void {
  const contract = requireContract(contractId);
  const matchesContract =
    contract.errors?.some(
      (errorSpec) => errorSpec.status === statusCode && errorSpec.code === code,
    ) ?? false;
  expect(matchesContract, `${contractId}: expected error {status:${statusCode}, code:${code}} in contract`).toBe(true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Mission Control Federation Provider Contract Baseline', () => {
  it('keeps covered and uncovered federation contract IDs explicit', () => {
    const coveredIds = new Set<string>(COVERED_PROVIDER_CONTRACT_IDS);
    const uncoveredIds = FEDERATION_API_CONTRACTS
      .map((contract) => contract.id)
      .filter((contractId) => !coveredIds.has(contractId))
      .sort();

    // Snapshot uncovered IDs so any new contract addition requires a conscious coverage decision.
    expect(uncoveredIds).toEqual(['FF-002', 'FF-003', 'SITE-005']);
  });

  it('validates contract metadata for all covered contract IDs', () => {
    for (const contractId of COVERED_PROVIDER_CONTRACT_IDS) {
      const contract = requireContract(contractId);
      const validation = validateEndpointAgainstContract(contract.method, contract.path);
      expect(
        validation.valid,
        `${contractId} (${contract.method} ${contract.path}): ${validation.issues.join('; ')}`,
      ).toBe(true);
      expect(validation.issues).toHaveLength(0);
    }
  });

  it('GET /api/sites response shape aligns with SITE-001', async () => {
    const { app } = buildMissionControlServer({ startTicker: false, logger: false });
    try {
      const response = await app.inject({ method: 'GET', url: '/api/sites' });
      expectSuccessStatus('SITE-001', response.statusCode);

      const body = response.json() as { sites: unknown[]; total: number; version: number };
      expect(Array.isArray(body.sites)).toBe(true);
      expect(typeof body.total).toBe('number');
      expect(typeof body.version).toBe('number');
    } finally {
      await app.close();
    }
  });

  it('POST /api/sites success (201) and DUPLICATE_SLUG (409) align with SITE-002', async () => {
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
      const dupBody = duplicate.json() as { code: string };
      expect(duplicate.statusCode).toBe(409);
      expect(dupBody.code).toBe('DUPLICATE_SLUG');
      expectErrorInContract('SITE-002', duplicate.statusCode, dupBody.code);
    } finally {
      await app.close();
    }
  });

  it('GET /api/sites/:siteId success (200) and SITE_NOT_FOUND (404) align with SITE-003', async () => {
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
      const missingBody = missing.json() as { code: string };
      expect(missing.statusCode).toBe(404);
      expect(missingBody.code).toBe('SITE_NOT_FOUND');
      expectErrorInContract('SITE-003', missing.statusCode, missingBody.code);
    } finally {
      await app.close();
    }
  });

  it('PATCH /api/sites/:siteId/status success (200) and SITE_NOT_FOUND (404) align with SITE-004', async () => {
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
      const missingBody = missing.json() as { code: string };
      expect(missing.statusCode).toBe(404);
      expect(missingBody.code).toBe('SITE_NOT_FOUND');
      expectErrorInContract('SITE-004', missing.statusCode, missingBody.code);
    } finally {
      await app.close();
    }
  });

  it('GET /api/feature-flags?siteId=... response shape aligns with FF-001', async () => {
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

      const body = response.json() as { flags: Record<string, unknown>[]; resolvedFor: { siteId: string } };
      expect(Array.isArray(body.flags)).toBe(true);
      body.flags.forEach((flag) => {
        expect(typeof flag.key).toBe('string');
        expect(typeof flag.resolvedValue).toBe('boolean');
        expect(['global', 'tenant', 'site']).toContain(flag.resolvedFrom);
      });
      expect(body.resolvedFor).toMatchObject({ siteId: createdSite.id });
    } finally {
      await app.close();
    }
  });

  it('GET /api/federation topology shape aligns with FED-001', async () => {
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
