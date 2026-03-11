# Runbook: Policy Engine Incident Triage

**Risk Tier:** T1 (Mission-Critical)  
**Service:** `@neurologix/policy-engine`  
**Maintained by:** Platform Engineering + Security  
**Escalation:** On-call SRE -> Security lead -> Compliance officer

---

## Purpose

This runbook defines triage for policy decision latency, deny/allow anomalies,
and policy evaluation failures in the policy engine.

Use this runbook with:

- [observability-baseline.md](./observability-baseline.md)
- [release-rollback.md](./release-rollback.md)

---

## Trigger Symptoms

- Policy decision latency p95 breaches (target < 10ms).
- Sudden spikes in denied decisions for known-valid requests.
- Recipe execution blocked waiting for policy decisions.
- Audit trail generation or integrity checks fail.
- Repeated `Session Replay Protection` denies or `AUTHZ_REPLAY_REJECTED` audit events.

---

## Immediate Containment

1. Confirm service and pod health:
   ```bash
   kubectl get pods -n neurologix -l app=policy-engine
   kubectl logs -n neurologix deploy/policy-engine --tail=150
   ```
2. Pause high-risk autonomous operations if policy behavior is inconsistent.
3. Route operations to safe manual-override mode per control-room procedures.

---

## Service-Specific Diagnostics

1. Validate policy-engine contract baseline:
   ```bash
   npm run test:contracts --workspace @neurologix/policy-engine
   ```
2. Validate dependency packages used by contract script:
   ```bash
   npm run build --workspace @neurologix/core
   npm run build --workspace @neurologix/security-core
   npm run build --workspace @neurologix/schemas
   ```
3. Inspect policy-evaluation error patterns and `requestId` correlation in logs.
4. Verify default decision mode and emergency-mode config are as expected.
5. Inspect replay-protection diagnostics:
   - confirm request timestamps are within the configured skew window
   - confirm unique request identifiers or session nonces are emitted per request
   - verify NTP drift has not exceeded the `sessionReplayProtection.maxTimestampSkewMs` setting
6. Check for recent policy bundle or rule changes causing behavior drift.

---

## Recovery and Rollback Criteria

- Recover in-place if issue is from a single policy document and can be safely
  reverted without platform rollback.
- Trigger release rollback when policy latency/decision anomalies persist more
  than 5 minutes or affect safety-critical workflows.
- Follow [release-rollback.md](./release-rollback.md) when rollback is required.

---

## Escalation and Compliance

- Treat safety-interlock bypass attempts as immediate P0 incidents.
- Log incident details and policy IDs involved in `.developer/INCIDENTS.md`.
- Preserve policy decision audit evidence for IEC 62443 / ISO 27001 review.

---

## Prevention

- Require contract + policy regression tests for all policy changes.
- Keep policy metadata complete (author, tags, category, priority).
- Monitor policy decision latency and error-rate alerts continuously.
- Preserve deterministic unique request IDs across retries; never reuse a prior request nonce inside the replay TTL window.
