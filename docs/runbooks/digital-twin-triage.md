# Runbook: Digital Twin Incident Triage

**Risk Tier:** T1 (Mission-Critical)  
**Service:** `@neurologix/digital-twin`  
**Maintained by:** Runtime Engineering  
**Escalation:** On-call SRE -> Runtime lead -> Operations lead

---

## Purpose

This runbook defines triage for incidents affecting digital twin state
ingestion, simulation runs, and twin validation/statistics integrity.

Use this runbook with:

- [observability-baseline.md](./observability-baseline.md)
- [release-rollback.md](./release-rollback.md)

---

## Trigger Symptoms

- Twin state updates lag or stop arriving.
- Simulation jobs fail repeatedly or produce invalid outputs.
- Twin validation results unexpectedly degrade.
- Mission-control shows stale or inconsistent twin state.

---

## Immediate Containment

1. Confirm pod health and inspect recent logs:
   ```bash
   kubectl get pods -n neurologix -l app=digital-twin
   kubectl logs -n neurologix deploy/digital-twin --tail=150
   ```
2. Pause non-essential simulation workloads until ingestion health is restored.
3. Notify operators that twin-backed views are in degraded mode.

---

## Service-Specific Diagnostics

1. Validate digital-twin contract baseline:
   ```bash
   npm run test:contracts --workspace @neurologix/digital-twin
   ```
2. Validate required shared package builds:
   ```bash
   npm run build --workspace @neurologix/core
   npm run build --workspace @neurologix/schemas
   ```
3. Inspect state-ingestion events by `twinId` and source (`telemetry`, `manual`).
4. Check simulation run status and step progression for recent failed runs.
5. Compare observed behavior to contracts in
   `src/contracts/digital-twin.contract.test.ts`.

---

## Recovery and Rollback Criteria

- Recover in-place for isolated asset/twin corruption after targeted reingest.
- Trigger rollback if platform-wide twin sync lag persists above SLO or
  simulations fail broadly after release.
- Execute rollback with [release-rollback.md](./release-rollback.md).

---

## Escalation and Compliance

- Record affected twins, asset IDs, and operator-facing impact in
  `.developer/INCIDENTS.md`.
- If state drift can influence safety decisions, escalate to policy and safety
  owners immediately.
- Preserve telemetry and audit evidence linked to the incident window.

---

## Prevention

- Keep contract baseline and state/simulation regression tests green.
- Track digital twin sync lag and state-ingestion error trends.
- Review asset onboarding quality for required metadata and validation rules.
