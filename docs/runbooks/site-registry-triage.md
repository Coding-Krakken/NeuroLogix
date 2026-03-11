# Runbook: Site Registry Incident Triage

**Risk Tier:** T1 (Mission-Critical)  
**Service:** `@neurologix/site-registry`  
**Maintained by:** Federation Platform Team  
**Escalation:** On-call SRE -> Federation lead -> Compliance officer

---

## Purpose

This runbook defines triage for incidents affecting site lifecycle management,
feature-flag updates, and federation topology integrity.

Use this runbook with:

- [observability-baseline.md](./observability-baseline.md)
- [release-rollback.md](./release-rollback.md)

---

## Trigger Symptoms

- Site creation/status transition operations fail unexpectedly.
- Feature-flag upserts fail or return inconsistent data.
- Federation topology responses are stale or malformed.
- Duplicate slug or contract mismatch errors spike unexpectedly.

---

## Immediate Containment

1. Verify service health and capture recent logs:
   ```bash
   kubectl get pods -n neurologix -l app=site-registry
   kubectl logs -n neurologix deploy/site-registry --tail=150
   ```
2. Pause non-critical provisioning and bulk status transitions.
3. Communicate temporary provisioning degradation to operations teams.

---

## Service-Specific Diagnostics

1. Validate site-registry contract baseline:
   ```bash
   npm run test:contracts --workspace @neurologix/site-registry
   ```
2. Re-validate federation contract endpoints locally:
   - `GET /api/sites`
   - `POST /api/sites`
   - `PATCH /api/sites/:siteId/status`
   - `PUT /api/feature-flags/:key`
   - `GET /api/federation`
3. Inspect error-code distribution, especially `DUPLICATE_SLUG` and status
   transition validation failures.
4. Confirm topology response still validates against
   `FederationTopologySchema`.
5. Compare incident payloads against request/response schemas in
   `@neurologix/schemas`.

---

## Recovery and Rollback Criteria

- Recover in-place for isolated invalid input cases or single-site data
  correction needs.
- Trigger rollback if provisioning failures are systemic or federation topology
  contract integrity is broken after deployment.
- Use [release-rollback.md](./release-rollback.md) for rollback execution.

---

## Escalation and Compliance

- Record impacted site IDs/slugs, feature flags, and timeline in
  `.developer/INCIDENTS.md`.
- Escalate federation-wide data integrity incidents as P1.
- Preserve logs and topology snapshots for post-incident audit.

---

## Prevention

- Keep site-registry contract tests in CI and monitor schema drift.
- Enforce strict slug uniqueness and validated status transitions.
- Periodically verify federation topology contract conformance.
