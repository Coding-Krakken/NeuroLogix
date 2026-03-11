# Runbook: Recipe Executor Incident Triage

**Risk Tier:** T1 (Mission-Critical)  
**Service:** `@neurologix/recipe-executor`  
**Maintained by:** Runtime Engineering  
**Escalation:** On-call SRE -> Runtime lead -> Safety engineer

---

## Purpose

This runbook defines triage for incidents impacting recipe orchestration,
execution progress, safety checks, and execution statistics integrity.

Use this runbook with:

- [observability-baseline.md](./observability-baseline.md)
- [release-rollback.md](./release-rollback.md)

---

## Trigger Symptoms

- Recipe execution failures increase above normal baseline.
- Executions stall in non-terminal states or progress stops.
- Safety check handling appears inconsistent with expected behavior.
- Recent execution statistics diverge from observed operator actions.

---

## Immediate Containment

1. Confirm service state and inspect recent logs:
   ```bash
   kubectl get pods -n neurologix -l app=recipe-executor
   kubectl logs -n neurologix deploy/recipe-executor --tail=150
   ```
2. Suspend non-essential recipe dispatches from mission-control.
3. Keep hardware interlock protections active; do not bypass safety checks.

---

## Service-Specific Diagnostics

1. Validate recipe-executor contract baseline:
   ```bash
   npm run test:contracts --workspace @neurologix/recipe-executor
   ```
2. Re-check shared package builds used by contract tests:
   ```bash
   npm run build --workspace @neurologix/core
   npm run build --workspace @neurologix/schemas
   ```
3. Inspect failed executions by `executionId` and `recipeId` in logs.
4. Verify failures are not caused by policy-engine dependency latency/outage.
5. Confirm expected status transitions against `RecipeExecutionStatus` contract.

---

## Recovery and Rollback Criteria

- Recover in-place if failures are tied to a specific recipe definition that can
  be disabled safely.
- Trigger release rollback for systemic execution failure spikes, prolonged
  execution stalls, or inability to guarantee safety guardrails.
- Use [release-rollback.md](./release-rollback.md) for rollback sequence.

---

## Escalation and Compliance

- For safety-critical execution anomalies, escalate immediately to safety owner.
- Record impacted recipe IDs, execution IDs, and timeline in
  `.developer/INCIDENTS.md`.
- Ensure all actions remain traceable through immutable audit logs.

---

## Prevention

- Keep contract baseline and execution regression tests green in CI.
- Validate recipe definitions before deployment.
- Monitor recipe failure-rate alerts and execution latency trends.
