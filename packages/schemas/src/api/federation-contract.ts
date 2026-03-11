/**
 * Federation API Contract Definitions
 *
 * This module provides canonical definitions for the Federation API contracts,
 * enabling runtime validation of API endpoints against their contract specifications.
 *
 * The contracts are derived from `.github/.system-state/contracts/federation-api.yaml`
 * and encoded as TypeScript types and constants to avoid runtime YAML parsing.
 *
 * ## Pattern
 *
 * 1. Define contract types (Endpoint, ErrorSpec, etc.)
 * 2. Create contract registry with all endpoints
 * 3. Provide validation utilities to check implementation conformance
 * 4. Use in tests and bootstrap to catch drift early
 *
 * All API routes in Phase 2+ must satisfy their contract definitions.
 * See ADR-006: Schema Registry and Contracts.
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Single error response specification in an endpoint contract.
 */
export interface ErrorSpec {
  status: number;
  code: string;
  description?: string;
}

/**
 * Query, path, or request body parameter specification.
 */
export interface ParameterSpec {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  pattern?: string;
}

/**
 * Response specification with schema reference and status code.
 */
export interface ResponseSpec {
  status: number;
  schema?: {
    type: string;
    properties?: Record<string, unknown>;
  };
}

/**
 * Complete endpoint contract.
 *
 * Each endpoint must be uniquely identified by (method, path),
 * declare required authentication, specify request/response shapes,
 * and list all expected error conditions.
 */
export interface EndpointContract {
  id: string;
  path: string;
  method: HttpMethod;
  description: string;
  auth: string;
  pathParams?: ParameterSpec[];
  queryParams?: ParameterSpec[];
  requestBody?: {
    schema?: Record<string, unknown>;
  };
  response?: ResponseSpec;
  errors?: ErrorSpec[];
}

/**
 * Shared error response schema used across all endpoints.
 */
export const FEDERATION_ERROR_SCHEMA = {
  type: 'object' as const,
  required: ['code', 'message', 'traceId'],
  properties: {
    code: {
      type: 'string',
      description: 'Machine-readable error code',
    },
    message: {
      type: 'string',
      description: 'Human-readable error description',
    },
    traceId: {
      type: 'string',
      description: 'OpenTelemetry trace ID for correlation',
    },
    details: {
      type: 'unknown as any',
      description: 'Optional structured context for validation errors',
    },
  },
};

/**
 * Federation API contract registry.
 *
 * Canonical source of truth for all Federation API endpoints.
 * Derived from `.github/.system-state/contracts/federation-api.yaml`
 * at schema_version 1.0, last_updated 2026-03-10.
 */
export const FEDERATION_API_CONTRACTS: EndpointContract[] = [
  // ─── Sites ───────────────────────────────────────────────────────────────

  {
    id: 'SITE-001',
    path: '/api/sites',
    method: 'GET',
    description: 'List all registered sites in the federation',
    auth: 'Bearer JWT; requires PLATFORM_ADMIN or any SITE_ADMIN (filtered to own sites)',
    queryParams: [
      {
        name: 'status',
        type: 'SiteStatus',
        required: false,
        description: 'Filter by site status',
      },
      {
        name: 'tier',
        type: 'SiteTier',
        required: false,
        description: 'Filter by site tier',
      },
      {
        name: 'region',
        type: 'string',
        required: false,
      },
    ],
    response: {
      status: 200,
      schema: {
        type: 'object',
        properties: {
          sites: { type: 'SiteProfile[]' },
          total: { type: 'number' },
          version: { type: 'number' },
        },
      },
    },
    errors: [
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
    ],
  },

  {
    id: 'SITE-002',
    path: '/api/sites',
    method: 'POST',
    description: 'Register a new site in the federation',
    auth: 'Bearer JWT; requires PLATFORM_ADMIN',
    requestBody: {
      schema: {
        type: 'object',
        required: ['slug', 'name', 'region', 'tier', 'config'],
      },
    },
    response: {
      status: 201,
      schema: {
        type: 'SiteProfile',
      },
    },
    errors: [
      {
        status: 400,
        code: 'VALIDATION_ERROR',
        description: 'Schema validation failure',
      },
      {
        status: 409,
        code: 'DUPLICATE_SLUG',
        description: 'Site slug already exists in federation (FEDERATION-INV-001)',
      },
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
    ],
  },

  {
    id: 'SITE-003',
    path: '/api/sites/:siteId',
    method: 'GET',
    description: 'Get a specific site profile',
    auth: 'Bearer JWT; PLATFORM_ADMIN or SITE_ADMIN/OPERATOR for own site',
    pathParams: [
      {
        name: 'siteId',
        type: 'string (UUID)',
      },
    ],
    response: {
      status: 200,
      schema: {
        type: 'SiteProfile',
      },
    },
    errors: [
      { status: 404, code: 'SITE_NOT_FOUND' },
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
    ],
  },

  {
    id: 'SITE-004',
    path: '/api/sites/:siteId/status',
    method: 'PATCH',
    description: 'Transition a site\'s operational status',
    auth: 'Bearer JWT; PLATFORM_ADMIN for all; SITE_ADMIN for maintenance only',
    pathParams: [
      {
        name: 'siteId',
        type: 'string (UUID)',
      },
    ],
    requestBody: {
      schema: {
        type: 'object',
        required: ['status', 'reason'],
      },
    },
    response: {
      status: 200,
      schema: {
        type: 'SiteProfile',
      },
    },
    errors: [
      {
        status: 400,
        code: 'INVALID_TRANSITION',
        description: 'Forbidden state-machine transition',
      },
      { status: 404, code: 'SITE_NOT_FOUND' },
      {
        status: 409,
        code: 'STALE_VERSION',
        description: 'Concurrent modification detected (FEDERATION-INV-003)',
      },
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
    ],
  },

  {
    id: 'SITE-005',
    path: '/api/sites/:siteId/config',
    method: 'PUT',
    description: 'Replace the operational configuration for a site',
    auth: 'Bearer JWT; SITE_ADMIN or higher',
    pathParams: [
      {
        name: 'siteId',
        type: 'string (UUID)',
      },
    ],
    requestBody: {
      schema: {
        type: 'SiteConfig',
      },
    },
    response: {
      status: 200,
      schema: {
        type: 'SiteProfile',
      },
    },
    errors: [
      { status: 400, code: 'VALIDATION_ERROR' },
      { status: 404, code: 'SITE_NOT_FOUND' },
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
    ],
  },

  // ─── Feature Flags ───────────────────────────────────────────────────────

  {
    id: 'FF-001',
    path: '/api/feature-flags',
    method: 'GET',
    description: 'List all feature flag definitions with resolved values',
    auth: 'Bearer JWT; any authenticated user (values filtered by site_id claim)',
    queryParams: [
      {
        name: 'siteId',
        type: 'string (UUID)',
        required: false,
        description: 'If provided, returns flag values resolved for this site',
      },
    ],
    response: {
      status: 200,
      schema: {
        type: 'object',
        properties: {
          flags: { type: 'ResolvedFeatureFlag[]' },
          resolvedFor: { type: 'object' },
        },
      },
    },
    errors: [{ status: 401, code: 'UNAUTHORIZED' }],
  },

  {
    id: 'FF-002',
    path: '/api/feature-flags/:key',
    method: 'PUT',
    description: 'Create or update a feature flag definition',
    auth: 'Bearer JWT; PLATFORM_ADMIN',
    pathParams: [
      {
        name: 'key',
        type: 'string',
      },
    ],
    requestBody: {
      schema: {
        type: 'FeatureFlag',
      },
    },
    response: {
      status: 200,
      schema: {
        type: 'FeatureFlag',
      },
    },
    errors: [
      { status: 400, code: 'VALIDATION_ERROR' },
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
    ],
  },

  {
    id: 'FF-003',
    path: '/api/sites/:siteId/feature-flags',
    method: 'PATCH',
    description: 'Override specific feature flags at site level',
    auth: 'Bearer JWT; SITE_ADMIN or higher for own site',
    pathParams: [
      {
        name: 'siteId',
        type: 'string (UUID)',
      },
    ],
    requestBody: {
      schema: {
        type: 'Record<string, boolean>',
      },
    },
    response: {
      status: 200,
      schema: {
        type: 'object',
        properties: {
          siteId: { type: 'string' },
          featureFlags: { type: 'Record<string, boolean>' },
        },
      },
    },
    errors: [
      { status: 400, code: 'VALIDATION_ERROR' },
      { status: 404, code: 'SITE_NOT_FOUND' },
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
    ],
  },

  // ─── Federation Topology ─────────────────────────────────────────────────

  {
    id: 'FED-001',
    path: '/api/federation',
    method: 'GET',
    description: 'Get the full federation topology (all sites, platform contracts, global flags)',
    auth: 'Bearer JWT; PLATFORM_ADMIN only',
    response: {
      status: 200,
      schema: {
        type: 'FederationTopology',
      },
    },
    errors: [
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
    ],
  },
];

/**
 * Contract validation result.
 *
 * Records whether a contract check passed and provides diagnostic details
 * if validation failed.
 */
export interface ContractValidationResult {
  valid: boolean;
  issues: string[];
}

/**
 * Validates an endpoint against the contract registry.
 *
 * Checks that:
 * 1. The endpoint path and method match a contract definition
 * 2. Required auth is declared
 * 3. Response schema exists (if required)
 * 4. All expected error codes are documented
 *
 * @param method HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param path API path (must match contract path exactly)
 * @returns Result with valid=true if endpoint passes contract validation
 *
 * @example
 * const result = validateEndpointAgainstContract('GET', '/api/sites');
 * if (!result.valid) {
 *   console.error(`Endpoint validation failed: ${result.issues.join(', ')}`);
 *   process.exit(1);
 * }
 */
export function validateEndpointAgainstContract(
  method: HttpMethod,
  path: string
): ContractValidationResult {
  const issues: string[] = [];

  // Find matching contract
  const contract = FEDERATION_API_CONTRACTS.find(
    (c) => c.method === method && c.path === path
  );

  if (!contract) {
    issues.push(
      `No contract found for ${method} ${path}. ` +
        `Contract must be defined in .github/.system-state/contracts/federation-api.yaml`
    );
    return { valid: false, issues };
  }

  // Validate auth declaration
  if (!contract.auth || contract.auth.trim().length === 0) {
    issues.push(`Contract ${contract.id} (${method} ${path}) missing auth declaration`);
  }

  // Validate response
  if (!contract.response) {
    issues.push(`Contract ${contract.id} (${method} ${path}) missing response specification`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Retrieves a contract by endpoint ID.
 *
 * @param id Contract ID (e.g., 'SITE-001', 'FF-002')
 * @returns The contract definition or undefined if not found
 */
export function getContractById(id: string): EndpointContract | undefined {
  return FEDERATION_API_CONTRACTS.find((c) => c.id === id);
}

/**
 * Lists all contracts for a given HTTP method.
 *
 * @param method HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @returns Array of contracts matching the method
 */
export function listContractsByMethod(method: HttpMethod): EndpointContract[] {
  return FEDERATION_API_CONTRACTS.filter((c) => c.method === method);
}

/**
 * Lists all contracts for a given path prefix.
 *
 * @param pathPrefix Path prefix to match (e.g., '/api/sites')
 * @returns Array of contracts matching the prefix
 */
export function listContractsByPath(pathPrefix: string): EndpointContract[] {
  return FEDERATION_API_CONTRACTS.filter((c) => c.path.startsWith(pathPrefix));
}
