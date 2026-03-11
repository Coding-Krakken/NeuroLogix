import { describe, expect, it } from 'vitest';
import {
  FEDERATION_API_CONTRACTS,
  FEDERATION_ERROR_SCHEMA,
  validateEndpointAgainstContract,
  getContractById,
  listContractsByMethod,
  listContractsByPath,
} from '@/api/federation-contract';

describe('Federation API Contract Validation', () => {
  describe('FEDERATION_API_CONTRACTS registry', () => {
    it('should have contracts defined for all endpoints', () => {
      expect(FEDERATION_API_CONTRACTS.length).toBeGreaterThan(0);
    });

    it('should have at least 9 endpoints (Sites, Feature Flags, Federation Topology)', () => {
      expect(FEDERATION_API_CONTRACTS.length).toBeGreaterThanOrEqual(9);
    });

    it('should have unique contract IDs', () => {
      const ids = FEDERATION_API_CONTRACTS.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toEqual(ids.length);
    });

    it('should have unique (method, path) combinations', () => {
      const keys = FEDERATION_API_CONTRACTS.map((c) => `${c.method}:${c.path}`);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toEqual(keys.length);
    });

    it('should have valid HTTP methods', () => {
      const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        expect(validMethods).toContain(contract.method);
      });
    });

    it('should have paths starting with /api', () => {
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        expect(contract.path).toMatch(/^\/api\//);
      });
    });

    it('should have descriptions for all contracts', () => {
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        expect(contract.description).toBeDefined();
        expect(contract.description!.length).toBeGreaterThan(0);
      });
    });

    it('should have auth declarations for all contracts', () => {
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        expect(contract.auth).toBeDefined();
        expect(contract.auth!.length).toBeGreaterThan(0);
      });
    });

    it('should have response specifications for all contracts', () => {
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        expect(contract.response).toBeDefined();
        expect(contract.response?.status).toBeGreaterThanOrEqual(200);
        expect(contract.response?.status).toBeLessThan(300);
      });
    });
  });

  describe('FEDERATION_ERROR_SCHEMA', () => {
    it('should define a shared error schema', () => {
      expect(FEDERATION_ERROR_SCHEMA).toBeDefined();
      expect(FEDERATION_ERROR_SCHEMA.type).toEqual('object');
    });

    it('should have required error fields', () => {
      const required = FEDERATION_ERROR_SCHEMA.required as string[];
      expect(required).toContain('code');
      expect(required).toContain('message');
      expect(required).toContain('traceId');
    });

    it('should have properties defined for all required fields', () => {
      expect(FEDERATION_ERROR_SCHEMA.properties).toBeDefined();
      expect(FEDERATION_ERROR_SCHEMA.properties?.code).toBeDefined();
      expect(FEDERATION_ERROR_SCHEMA.properties?.message).toBeDefined();
      expect(FEDERATION_ERROR_SCHEMA.properties?.traceId).toBeDefined();
    });
  });

  describe('validateEndpointAgainstContract', () => {
    it('should pass validation for existing GET /api/sites endpoint', () => {
      const result = validateEndpointAgainstContract('GET', '/api/sites');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should pass validation for POST /api/sites endpoint', () => {
      const result = validateEndpointAgainstContract('POST', '/api/sites');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should pass validation for GET /api/sites/:siteId endpoint', () => {
      const result = validateEndpointAgainstContract('GET', '/api/sites/:siteId');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should pass validation for PATCH /api/sites/:siteId/status endpoint', () => {
      const result = validateEndpointAgainstContract('PATCH', '/api/sites/:siteId/status');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should pass validation for PUT /api/sites/:siteId/config endpoint', () => {
      const result = validateEndpointAgainstContract('PUT', '/api/sites/:siteId/config');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should pass validation for GET /api/feature-flags endpoint', () => {
      const result = validateEndpointAgainstContract('GET', '/api/feature-flags');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should pass validation for PUT /api/feature-flags/:key endpoint', () => {
      const result = validateEndpointAgainstContract('PUT', '/api/feature-flags/:key');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should pass validation for PATCH /api/sites/:siteId/feature-flags endpoint', () => {
      const result = validateEndpointAgainstContract('PATCH', '/api/sites/:siteId/feature-flags');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should pass validation for GET /api/federation endpoint', () => {
      const result = validateEndpointAgainstContract('GET', '/api/federation');
      expect(result.valid).toBe(true);
      expect(result.issues.length).toEqual(0);
    });

    it('should fail validation for undefined endpoint', () => {
      const result = validateEndpointAgainstContract('GET', '/api/undefined');
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('No contract found');
    });

    it('should fail validation for missing method', () => {
      const result = validateEndpointAgainstContract('DELETE', '/api/sites');
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should fail validation for wrong path', () => {
      const result = validateEndpointAgainstContract('GET', '/api/wrongpath');
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should include contract ID in error message when available', () => {
      const result = validateEndpointAgainstContract('GET', '/api/undefined');
      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('GET /api/undefined');
    });

    it('should check that all validated contracts have required auth', () => {
      // All contracts should pass validation, so auth should be present
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        const result = validateEndpointAgainstContract(contract.method, contract.path);
        if (result.valid) {
          expect(contract.auth).toBeDefined();
          expect(contract.auth!.length).toBeGreaterThan(0);
        }
      });
    });

    it('should check that all validated contracts have response', () => {
      // All contracts should pass validation, so response should be present
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        const result = validateEndpointAgainstContract(contract.method, contract.path);
        if (result.valid) {
          expect(contract.response).toBeDefined();
        }
      });
    });
  });

  describe('getContractById', () => {
    it('should retrieve contract SITE-001', () => {
      const contract = getContractById('SITE-001');
      expect(contract).toBeDefined();
      expect(contract?.id).toEqual('SITE-001');
      expect(contract?.method).toEqual('GET');
      expect(contract?.path).toEqual('/api/sites');
    });

    it('should retrieve contract SITE-002', () => {
      const contract = getContractById('SITE-002');
      expect(contract).toBeDefined();
      expect(contract?.id).toEqual('SITE-002');
      expect(contract?.method).toEqual('POST');
      expect(contract?.path).toEqual('/api/sites');
    });

    it('should retrieve contract FF-001', () => {
      const contract = getContractById('FF-001');
      expect(contract).toBeDefined();
      expect(contract?.id).toEqual('FF-001');
      expect(contract?.method).toEqual('GET');
      expect(contract?.path).toEqual('/api/feature-flags');
    });

    it('should retrieve contract FED-001', () => {
      const contract = getContractById('FED-001');
      expect(contract).toBeDefined();
      expect(contract?.id).toEqual('FED-001');
      expect(contract?.method).toEqual('GET');
      expect(contract?.path).toEqual('/api/federation');
    });

    it('should return undefined for unknown contract ID', () => {
      const contract = getContractById('UNKNOWN-999');
      expect(contract).toBeUndefined();
    });

    it('should be case-sensitive when retrieving by ID', () => {
      const contract = getContractById('site-001');
      expect(contract).toBeUndefined();
    });

    it('should retrieve all contracts without error', () => {
      FEDERATION_API_CONTRACTS.forEach((expectedContract) => {
        const retrieved = getContractById(expectedContract.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toEqual(expectedContract.id);
        expect(retrieved?.path).toEqual(expectedContract.path);
        expect(retrieved?.method).toEqual(expectedContract.method);
      });
    });
  });

  describe('listContractsByMethod', () => {
    it('should return all GET contracts', () => {
      const contracts = listContractsByMethod('GET');
      expect(contracts.length).toBeGreaterThan(0);
      contracts.forEach((c) => {
        expect(c.method).toEqual('GET');
      });
    });

    it('should return all POST contracts', () => {
      const contracts = listContractsByMethod('POST');
      expect(contracts.length).toBeGreaterThan(0);
      contracts.forEach((c) => {
        expect(c.method).toEqual('POST');
      });
    });

    it('should return all PUT contracts', () => {
      const contracts = listContractsByMethod('PUT');
      expect(contracts.length).toBeGreaterThan(0);
      contracts.forEach((c) => {
        expect(c.method).toEqual('PUT');
      });
    });

    it('should return all PATCH contracts', () => {
      const contracts = listContractsByMethod('PATCH');
      expect(contracts.length).toBeGreaterThan(0);
      contracts.forEach((c) => {
        expect(c.method).toEqual('PATCH');
      });
    });

    it('should return empty array for DELETE (not yet defined)', () => {
      const contracts = listContractsByMethod('DELETE');
      expect(contracts.length).toEqual(0);
    });

    it('should include contracts with matching method in result', () => {
      const getContracts = listContractsByMethod('GET');
      const site001 = getContracts.find((c) => c.id === 'SITE-001');
      expect(site001).toBeDefined();
    });
  });

  describe('listContractsByPath', () => {
    it('should return all /api/sites contracts', () => {
      const contracts = listContractsByPath('/api/sites');
      expect(contracts.length).toBeGreaterThan(0);
      contracts.forEach((c) => {
        expect(c.path.startsWith('/api/sites')).toBe(true);
      });
    });

    it('should return exact match and subpath matches', () => {
      const contracts = listContractsByPath('/api/sites');
      const paths = contracts.map((c) => c.path);
      expect(paths).toContain('/api/sites');
      expect(paths).toContain('/api/sites/:siteId');
      expect(paths).toContain('/api/sites/:siteId/status');
      expect(paths).toContain('/api/sites/:siteId/config');
    });

    it('should return all /api/feature-flags contracts (not nested paths)', () => {
      const contracts = listContractsByPath('/api/feature-flags');
      const paths = contracts.map((c) => c.path);
      expect(paths).toContain('/api/feature-flags');
      expect(paths).toContain('/api/feature-flags/:key');
      // Note: /api/sites/:siteId/feature-flags is nested under /api/sites, not /api/feature-flags
    });

    it('should return all /api/federation contracts', () => {
      const contracts = listContractsByPath('/api/federation');
      expect(contracts.length).toBeGreaterThan(0);
      contracts.forEach((c) => {
        expect(c.path.startsWith('/api/federation')).toBe(true);
      });
    });

    it('should return empty array for path with no contracts', () => {
      const contracts = listContractsByPath('/api/nonexistent');
      expect(contracts.length).toEqual(0);
    });

    it('should be case-sensitive when filtering by path', () => {
      const contracts = listContractsByPath('/API/sites');
      expect(contracts.length).toEqual(0);
    });
  });

  describe('Contract structure validation', () => {
    it('should have query params only for GET and PATCH requests', () => {
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        if (contract.queryParams) {
          // Query params should only be on GET or PATCH
          const hasQueryParams =
            contract.method === 'GET' || contract.method === 'PATCH';
          expect(hasQueryParams).toBe(true);
        }
      });
    });

    it('should have request body only for POST, PUT, PATCH requests', () => {
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        if (contract.requestBody) {
          // Request body should only be on POST, PUT, or PATCH
          const hasBody =
            contract.method === 'POST' || contract.method === 'PUT' || contract.method === 'PATCH';
          expect(hasBody).toBe(true);
        }
      });
    });

    it('should list error codes for all endpoints', () => {
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        expect(contract.errors).toBeDefined();
        expect(contract.errors!.length).toBeGreaterThan(0);
      });
    });

    it('should include UNAUTHORIZED for all authenticated endpoints', () => {
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        if (contract.auth && contract.auth.includes('Bearer JWT')) {
          const codes = contract.errors!.map((e) => e.code);
          expect(codes).toContain('UNAUTHORIZED');
          // Most endpoints include both UNAUTHORIZED and FORBIDDEN, but some may only have UNAUTHORIZED
        }
      });
    });
  });

  describe('Contract narrative', () => {
    it('should have sufficient contracts to cover basic federation operations', () => {
      // At minimum, should support site CRUD, feature flag management, and topology queries
      const siteContracts = listContractsByPath('/api/sites');
      expect(siteContracts.length).toBeGreaterThanOrEqual(5); // SITE-001 through SITE-005

      // Feature flag contracts at /api/feature-flags prefix (not including site-level overrides)
      const featureFlagContracts = listContractsByPath('/api/feature-flags');
      expect(featureFlagContracts.length).toBeGreaterThanOrEqual(2); // FF-001, FF-002

      // Federation topology contracts
      const federationContracts = listContractsByPath('/api/federation');
      expect(federationContracts.length).toBeGreaterThanOrEqual(1); // FED-001
    });

    it('should support the Model-First workflow (contracts before code)', () => {
      // All contracts are defined; code implementation should follow
      expect(FEDERATION_API_CONTRACTS.length).toBeGreaterThan(0);
      FEDERATION_API_CONTRACTS.forEach((contract) => {
        expect(contract.id).toBeDefined();
        expect(contract.path).toBeDefined();
        expect(contract.method).toBeDefined();
        expect(contract.auth).toBeDefined();
        expect(contract.response).toBeDefined();
        expect(contract.errors).toBeDefined();
      });
    });
  });
});
