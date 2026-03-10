## Summary

Resolves #74

Restores the deferred SiteRegistryService test suite and wires the service into the mission-control federation API routes.

## Problem

After Phase 9 federation delivery (PR #71), two items were deferred to issue #74:
1. The site-registry test file was a placeholder (`expect(true).toBe(true)`) with 0% coverage
2. All 6 federation routes in mission-control returned 501 NOT_IMPLEMENTED or empty stubs

## Changes

### services/site-registry
- Added `vitest.config.ts` with `resolve.alias` for `@neurologix/schemas` and `@neurologix/core`, fixing workspace import resolution (root cause of prior CI failures)
- Replaced placeholder test with 41 comprehensive tests covering all 8 FEDERATION-INVs:
  - INV-001: Duplicate slug rejection
  - INV-002: UUID auto-generation and immutability
  - INV-003: Full state machine valid/invalid transition coverage (including terminal decommissioned state)
  - INV-004: `assertSiteOperable` guard for active/provisioning/suspended/unknown
  - INV-005: Audit logging on mutations with JSON structure validation
  - INV-007/INV-008: Feature flag upsert, resolve, global/site precedence, `isFeatureEnabled`
  - Federation topology version monotonicity
  - Site config and equipment topology updates
- Restored `"test": "vitest run"` script (was a placeholder echo)

### apps/mission-control
- Added `@neurologix/site-registry: "*"` dependency
- Imported `SiteRegistryService` and `SITE_REGISTRY_ERROR_CODES` into `server.ts`
- Instantiated `SiteRegistryService` in `buildMissionControlServer`
- Replaced 501/empty stubs with live service calls on all 6 endpoints:
  - `GET /api/sites` — listSites with status/region/tier filtering
  - `POST /api/sites` — createSite with 409 on duplicate slug, 400 on validation error
  - `GET /api/sites/:siteId` — getSite with 404 on not found
  - `PATCH /api/sites/:siteId/status` — updateSiteStatus with 404/422 error mapping
  - `GET /api/feature-flags` — resolveFeatureFlags or listFeatureFlags
  - `GET /api/federation` — getFederationTopology

## Validation

- 41 site-registry tests pass
- 8 mission-control tests pass (no regressions)
- Coverage: 96.45% statements, 86% branches, 95% functions (all above 80% threshold)
- TypeScript strict mode clean (no errors)
- Full turbo build: 12/12 tasks successful
