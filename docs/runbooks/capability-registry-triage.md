# Runbook: Capability Registry Incident Triage

**Risk Tier:** T1 (Mission-Critical)  
**Service:** `@neurologix/capability-registry`  
**Maintained by:** Platform Engineering  
**Escalation:** On-call SRE -> Platform lead -> Safety/compliance officer

---

## Purpose

This runbook defines first-responder triage for incidents affecting capability
registration, capability health checks, and capability lifecycle operations.

Use this runbook with:

- [observability-baseline.md](./observability-baseline.md)
- [release-rollback.md](./release-rollback.md)

---

## Trigger Symptoms

- Capability install/update requests failing or timing out.
- Capability list responses are stale or empty unexpectedly.
- Health checks report elevated `isHealthy=false` outcomes.
- Registry statistics drift from expected installed capability counts.

---

## Immediate Containment

1. Confirm current service health and pod state:
   ```bash
   kubectl get pods -n neurologix -l app=capability-registry
   kubectl logs -n neurologix deploy/capability-registry --tail=120
   ```
2. Stop non-critical capability change traffic until root cause is known
   (freeze install/update operations).
3. Notify mission-control operators that capability lifecycle actions are in
   degraded mode.

---

## Service-Specific Diagnostics

1. Validate contract behavior locally from repository state:
   ```bash
   npm run test:contracts --workspace @neurologix/capability-registry
   ```
2. Check for repeated lifecycle failures in logs (`install`, `update`,
   `uninstall`, `health`).
3. Verify dependency reachability for capability sources and registry endpoints.
4. Confirm no sudden dependency break in shared packages:
   ```bash
   npm run build --workspace @neurologix/core
   npm run build --workspace @neurologix/schemas
   ```
5. Compare observed responses with the service contract baseline in
   `src/contracts/capability-registry.contract.test.ts`.

---

## Recovery and Rollback Criteria

- Recover in-place when failures are isolated to one capability package and
  registry process health is stable.
- Trigger release rollback if registry error rate is sustained above SLO or
  service does not stabilize within 5 minutes.
- Follow [release-rollback.md](./release-rollback.md) for rollout reversal.

---

## Escalation and Compliance

- Record incident timeline, impacted capabilities, and recovery action in
  `.developer/INCIDENTS.md`.
- If capability failures could affect safety enforcement paths, escalate as a
  P1 and involve policy-engine owner immediately.
- Preserve relevant structured logs for audit trail retention.

---

## Prevention

- Keep contract baseline tests green in CI (`contract-tests` job).
- Enforce capability package validation before enabling in production.
- Review capability health trends and dependency errors weekly.
