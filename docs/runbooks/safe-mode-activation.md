# Runbook: Safe-Mode Activation Procedure

> **Risk Tier:** T1 (Mission-Critical)
> **Scope:** Full platform — AI control suspension, hardware interlock handover, safe-state verification
> **Safe-State SLA:** < 30 seconds from trigger to safe state
> **Model Ref:** SAFETY-001 (`.github/.system-state/model/system_state_model.yaml`)
> **Phase:** Phase 7 — Security & Compliance

---

## Purpose

This runbook defines the authoritative procedure for activating **safe mode** on
the NeuroLogix platform. Safe mode is the condition where:

- All autonomous AI-driven control is suspended immediately.
- All PLC actuation flows exclusively through hardware interlocks.
- Recipe execution is halted; no new recipe commands are dispatched.
- All operators are notified and the incident is opened in the audit log.
- The platform remains fully observable and auditable throughout the event.

Safe mode is a **safety-first** state — not a failure. It is a controlled,
deliberate reduction to the safest available operating posture. The platform is
designed to enter safe mode in under 30 seconds under any trigger condition.

Use this runbook in concert with:

- [release-rollback.md](./release-rollback.md) — if safe mode accompanies a
  deployment rollback
- [observability-baseline.md](./observability-baseline.md) — for alert triage
  context before/during activation
- [policy-engine-triage.md](./policy-engine-triage.md) — if the trigger involves
  policy evaluation anomalies

---

## Safe-Mode Trigger Conditions

Safe mode **must** be activated immediately when **any** of the following are
detected. No condition requires two-trigger confirmation; a single confirmed
trigger is sufficient.

| ID | Trigger | Detection Source | Automated? |
|----|---------|-----------------|------------|
| SM-01 | Control loop p99 latency > 200 ms sustained ≥ 60 s | Prometheus alert `NeuroCriticalLoopLatency` | Yes |
| SM-02 | Service error rate > 0.5% sustained ≥ 2 min | Prometheus alert `NeuroHighErrorRate` | Yes |
| SM-03 | Recipe execution failure rate > 0.1% | Prometheus alert `NeuroRecipeFailureRate` | Yes |
| SM-04 | Safety interlock bypass attempt detected | Audit log alert / ELK `SAFETY_INTERLOCK_BYPASS` | Yes |
| SM-05 | Audit log write failure (any) | ELK alert `NeuroAuditLogWriteFailure` | Yes |
| SM-06 | Kubernetes liveness/readiness probe failure | Kubernetes events + Prometheus | Yes |
| SM-07 | Operator manual trigger (any reason) | Mission Control UI / CLI | Manual |
| SM-08 | Security breach or suspected unauthorized actuation | Security monitoring / operator judgment | Manual |
| SM-09 | AI model inference anomaly or confidence below threshold | AI service diagnostics | Configurable |
| SM-10 | Network partition isolating edge nodes from core | Network monitoring | Configurable |

> **ZERO-BYPASS RULE:** Hardware interlocks must remain active regardless of
> software platform state. Safe mode does NOT disable hardware safety systems —
> it transfers all control authority _to_ them.

---

## Decision Tree

```
Trigger detected (automated or manual)
   │
   ├─ Automated trigger (Prometheus / ELK / Kubernetes)
   │     └─ Platform health controller initiates safe mode automatically
   │           └─ Proceed to Section 2: Verify Activation
   │
   └─ Manual trigger required
         └─ Operator confirms trigger is real and not transient
               ├─ Transient / false positive → Log decision, monitor
               └─ Real trigger → Proceed to Section 3: Manual Activation
```

---

## Section 1: Pre-Activation Checks (Manual Trigger Path Only)

Before manually triggering safe mode (triggers SM-07 through SM-10), confirm
the trigger is genuine and not a transient event:

1. **Check Prometheus/Grafana** for the relevant signal:
   ```bash
   curl -s "${PROMETHEUS_URL}/api/v1/query?query=historam_quantile(0.99,rate(control_loop_duration_seconds_bucket[5m]))"
   ```
2. **Check ELK logs** for safety interlock events:
   ```bash
   # In Kibana — search for severity=critical
   # or use CLI if ELK API is available:
   curl -s "${ELK_URL}/neurologix-audit-*/_search" \
     -H 'Content-Type: application/json' \
     -d '{"query":{"match":{"event":"SAFETY_INTERLOCK_BYPASS"}}}'
   ```
3. **Confirm at least two independent data sources** show the anomaly if time
   permits. Under time pressure, **err on the side of activation**.
4. If trigger is confirmed real → proceed to Section 3.
5. If false positive → document decision in `.developer/INCIDENTS.md` and
   continue monitoring at increased frequency.

---

## Section 2: Verify Automated Activation

When an automated safe-mode trigger fires (SM-01 through SM-06):

1. **Confirm the platform health controller emitted the safe-mode event:**
   ```bash
   kubectl logs -n neurologix deploy/platform-health-controller --tail=50 \
     | grep -i "SAFE_MODE"
   ```
2. **Verify recipe-executor is suspended:**
   ```bash
   kubectl get pods -n neurologix -l app=recipe-executor
   # Expect: Terminating or 0/1 Ready if suspended
   kubectl logs -n neurologix deploy/recipe-executor --tail=30 \
     | grep -i "SAFE_MODE\|SUSPENDED"
   ```
3. **Verify no new PLC actuation commands are being dispatched:**
   ```bash
   kubectl logs -n neurologix deploy/recipe-executor --tail=30 \
     | grep -i "PLC_COMMAND\|ACTUAT"
   # Expect: no entries after the safe-mode event timestamp
   ```
4. If automated activation is confirmed → proceed to Section 5 (Verify
   Safe State). Otherwise → proceed to Section 3 (Manual Activation).

---

## Section 3: Manual Activation Procedure

**Time budget: complete within 30 seconds.**

### Step 1 — Suspend Recipe Executor (AI Control Off)

```bash
# Scale recipe-executor to 0 replicas immediately
kubectl scale deploy/recipe-executor -n neurologix --replicas=0

# Confirm suspension
kubectl rollout status deploy/recipe-executor -n neurologix --timeout=20s
```

> If kubectl is unavailable, use Mission Control UI:
> **Control Panel → Services → recipe-executor → Emergency Suspend**

### Step 2 — Suspend Policy Engine Autonomous Decisions

```bash
# Scale policy-engine to read-only mode (feature flag)
kubectl set env deploy/policy-engine \
  -n neurologix \
  POLICY_ENGINE_MODE=readonly
kubectl rollout restart deploy/policy-engine -n neurologix
```

> Policy engine must remain running in read-only mode for audit queries.
> Full suspension only if policy engine itself is the trigger source.

### Step 3 — Suspend AI Services

```bash
# Scale all AI inference deployments to 0
kubectl scale deploy -n neurologix \
  -l tier=ai-inference \
  --replicas=0
```

### Step 4 — Freeze Mission Control Write Operations

Notify operators to stop all mission-control write actions (recipe dispatch,
capability changes, config edits) by posting an in-app alert:

```bash
kubectl set env deploy/mission-control \
  -n neurologix \
  SAFE_MODE_ACTIVE=true SAFE_MODE_REASON="Safe mode activated at $(date -u +%Y%m%dT%H%M%SZ)"
kubectl rollout restart deploy/mission-control -n neurologix
```

### Step 5 — Confirm Hardware Interlocks Are Active

See Section 4 for hardware interlock verification.

---

## Section 4: Hardware Interlock Verification

> **CRITICAL:** This section must be executed for **every** safe-mode activation
> regardless of whether activation was automated or manual.

1. **Contact the plant floor supervisor / safety systems owner** and confirm:
   - PLC safety relays are energized and in the safe position.
   - Emergency-stop circuits are functional and tested.
   - Conveyor/actuator motion is governed by hardware limits, not software.

2. **Verify PLC status** via the OT network (separate from the NeuroLogix
   software network):
   ```
   # Log in to PLC HMI (hardware terminal or VPN-isolated workstation)
   # Check: Safety relay status = ONLINE / ENGAGED
   # Check: Watchdog timer = RUNNING
   # Check: Last heartbeat from NeuroLogix gateway = STALE (expected in safe mode)
   ```

3. **Confirm gate-level interlocks** are latched:
   - All zone-entry gates: secured/closed.
   - All emergency-stop mushroom buttons: accessible and functional.
   - Pressure/temperature/vibration cut-offs: active.

4. **Record confirmation** in the incident record (see Section 7).

> If hardware interlock status cannot be confirmed within 5 minutes, escalate to
> the safety officer and initiate emergency PLC shutdown via physical controls.

---

## Section 5: Safe-State Verification Checklist

Execute item-by-item. Record pass/fail for each item in the incident record.

| # | Check | Command / Method | Expected |
|---|-------|-----------------|----------|
| 1 | recipe-executor pods | `kubectl get pods -n neurologix -l app=recipe-executor` | 0 Running |
| 2 | AI inference pods | `kubectl get pods -n neurologix -l tier=ai-inference` | 0 Running |
| 3 | No new PLC commands in last 60 s | ELK query / audit log | 0 PLC_COMMAND events |
| 4 | Audit log write success | `kubectl logs -n neurologix deploy/audit-service --tail=20` | Last write: OK |
| 5 | Policy engine in read-only mode | `kubectl get env deploy/policy-engine -n neurologix` | POLICY_ENGINE_MODE=readonly |
| 6 | Mission control SAFE_MODE_ACTIVE | `kubectl get env deploy/mission-control -n neurologix` | SAFE_MODE_ACTIVE=true |
| 7 | Hardware interlocks confirmed | Physical inspection / PLC HMI | All ENGAGED |
| 8 | Prometheus alerts firing correctly | Grafana safe-mode dashboard | SM alert group: FIRING |
| 9 | Operator notifications sent | Mission Control + PagerDuty | ACK from on-call |
| 10 | Incident record opened | `.developer/INCIDENTS.md` | Entry created |

> **All 10 checks must pass** before safe mode is considered confirmed. If any
> check fails, escalate immediately — do not attempt recovery until the
> safe-state checklist is fully green.

---

## Section 6: Operator Notification and Escalation

### Immediate Notification (within 2 minutes of activation)

1. **PagerDuty / OpsGenie:** Alert fires automatically from Prometheus if
   automated trigger. For manual trigger, open a P1 incident manually.

2. **Mission Control in-app banner:** Activated automatically when
   `SAFE_MODE_ACTIVE=true` is set on the mission-control service (Section 3,
   Step 4).

3. **Slack / Teams channel `#neurologix-ops`:** Post:
   ```
   @channel 🚨 SAFE MODE ACTIVATED — [site name] — [timestamp UTC]
   Trigger: [SM-XX - description]
   All autonomous control suspended. Hardware interlocks active.
   Incident: [link to INCIDENTS.md entry or PagerDuty]
   On-call SRE: [name]
   ```

4. **Safety/compliance officer:** Notify if trigger involves SM-04 (interlock
   bypass), SM-08 (security breach), or if safe mode persists > 15 minutes.

### Escalation Path

```
On-call SRE (immediate)
  └─ Platform lead (> 5 min in safe mode)
        └─ Safety/compliance officer (SM-04, SM-08, or > 15 min)
              └─ Plant floor safety manager (hardware interlock failures)
                    └─ Emergency services (if personnel safety is at risk)
```

---

## Section 7: Audit Trail Requirements

Every safe-mode activation is a **P0 compliance event** and requires a complete
audit record.

**Log the following immediately in `.developer/INCIDENTS.md`:**

```markdown
## INCIDENT — Safe Mode Activation — [YYYY-MM-DD HH:MM UTC]

- **Trigger:** SM-XX — [description]
- **Activated by:** [automated | manual — operator name]
- **Activation time:** [timestamp UTC]
- **Safe-state confirmed at:** [timestamp UTC]
- **Time to safe state:** [NN seconds]
- **Hardware interlocks verified by:** [name, method]
- **Services suspended:** recipe-executor, AI inference [list any additions]
- **Policy engine mode:** read-only
- **PLC command activity post-activation:** none / [details if any]
- **Operator notifications sent to:** [names / channels]
- **PagerDuty incident:** [link]
- **Resolution:** [pending | resolved at timestamp]
```

**Preserve all structured logs** from the trigger window (+/- 10 minutes) by
pinning them in ELK / tagging in your log management system. Audit records are
append-only; do not delete or modify existing entries.

---

## Section 8: Exiting Safe Mode — Controlled Recovery

> **Authorization required:** Recovery from safe mode requires authorization from
> the **platform lead** AND the **safety/compliance officer** (or designee).
> Single-operator recovery is not permitted.

### Pre-Recovery Checklist

Before restoring autonomous operation, confirm **all** of the following:

- [ ] Root cause of safe-mode trigger identified and documented.
- [ ] Root cause remediated (code fix, config fix, hardware repair).
- [ ] Staging validation passed (affected services tested in staging).
- [ ] Safety officer has authorized recovery in writing (INCIDENTS.md entry).
- [ ] Platform lead has authorized recovery in writing (INCIDENTS.md entry).
- [ ] Hardware interlocks confirmed healthy and ready to transfer gradual control.
- [ ] All on-call personnel notified of imminent recovery.

### Recovery Sequence

**Execute in order. Do not skip steps.**

1. **Restore policy engine to normal mode:**
   ```bash
   kubectl set env deploy/policy-engine \
     -n neurologix \
     POLICY_ENGINE_MODE=normal
   kubectl rollout restart deploy/policy-engine -n neurologix
   kubectl rollout status deploy/policy-engine -n neurologix --timeout=60s
   ```

2. **Scale recipe-executor to nominal replicas:**
   ```bash
   kubectl scale deploy/recipe-executor -n neurologix --replicas=2
   kubectl rollout status deploy/recipe-executor -n neurologix --timeout=60s
   ```

3. **Restore AI inference services:**
   ```bash
   kubectl scale deploy -n neurologix \
     -l tier=ai-inference \
     --replicas=1
   # Monitor for 5 minutes before scaling to full capacity
   ```

4. **Clear safe-mode flag on mission-control:**
   ```bash
   kubectl set env deploy/mission-control \
     -n neurologix \
     SAFE_MODE_ACTIVE=- SAFE_MODE_REASON=-
   kubectl rollout restart deploy/mission-control -n neurologix
   ```

5. **Monitor for 15 minutes** at 1-minute polling intervals:
   - Control loop latency (target p95 < 50 ms, p99 < 100 ms)
   - Recipe execution success rate (target > 99.9%)
   - Error rate (target < 0.1%)

6. **Confirm hardware interlocks** have transitioned gracefully back to
   co-operative mode (PLC watchdog receiving NeuroLogix heartbeat).

7. **Close the PagerDuty / OpsGenie incident** and update `.developer/INCIDENTS.md`
   with the resolution timestamp and recovery validation evidence.

8. **Post recovery notification** to `#neurologix-ops`:
   ```
   ✅ SAFE MODE DEACTIVATED — [site name] — [timestamp UTC]
   Recovery authorized by: [platform lead name] + [safety officer name]
   All services nominal. Monitoring active.
   Incident: [link]
   ```

---

## Related Runbooks and References

| Resource | Purpose |
|----------|---------|
| [release-rollback.md](./release-rollback.md) | If safe mode accompanies a deployment rollback |
| [observability-baseline.md](./observability-baseline.md) | Alert triage procedures and Prometheus query reference |
| [capability-registry-triage.md](./capability-registry-triage.md) | Service-specific triage during safe mode |
| [policy-engine-triage.md](./policy-engine-triage.md) | Policy engine diagnostics |
| [recipe-executor-triage.md](./recipe-executor-triage.md) | Recipe execution diagnostics |
| [digital-twin-triage.md](./digital-twin-triage.md) | Digital twin sync diagnostics |
| [site-registry-triage.md](./site-registry-triage.md) | Site provisioning triage |
| `.developer/RELEASE.md` | Release procedure and rollback trigger thresholds |
| `.developer/INCIDENTS.md` | Incident log (append-only) |
| `.github/.system-state/model/system_state_model.yaml` | Safety model and invariants |
| `infrastructure/observability/prometheus-alerts.yml` | Alert rule definitions |

---

## Maintenance

This runbook must be reviewed and updated:

- After every safe-mode activation (within 5 business days of recovery).
- After any change to the platform safety architecture or PLC integration.
- At the start of each Phase 7 delivery slice.

**Owner:** Platform Engineering / Safety & Compliance  
**Review cadence:** Every 90 days or after any activation
