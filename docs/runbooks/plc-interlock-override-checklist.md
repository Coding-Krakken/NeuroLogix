# Runbook: PLC Interlock Override Checklist

> **Risk Tier:** T1 (Mission-Critical)
> **Scope:** Temporary PLC interlock override request, approval, execution window, and restoration
> **Model Refs:** SAFETY-001 (`.github/.system-state/model/system_state_model.yaml`), SEC-001 (`.github/.system-state/security/security_model.yaml`)
> **Phase:** Phase 7 — Security & Compliance

---

## Purpose

This runbook defines the mandatory checklist for requesting and executing a
**temporary PLC interlock override** under exceptional circumstances.

Interlock overrides are high-risk operations. They are permitted only when:

- a validated safety-critical incident requires immediate manual intervention,
- no safer operational alternative exists, and
- the override can be constrained to a short, auditable window.

This checklist enforces NeuroLogix non-negotiables:

- **Safety-first:** hardware interlocks are never bypassed silently.
- **Zero safety compromise:** every override requires explicit authorization.
- **Complete audit trail:** every step and decision is recorded immutably.

Use this runbook with:

- [safe-mode-activation.md](./safe-mode-activation.md)
- [observability-baseline.md](./observability-baseline.md)
- [release-rollback.md](./release-rollback.md)

---

## Preconditions (Must All Be True)

Before any override action, confirm all of the following:

1. **Incident declared:** a P1/P0 incident is open and linked in the incident
   tracker.
2. **Safe mode active:** platform is in safe mode or equivalent manual control
   state.
3. **Scope defined:** exact PLC zone/device and override duration are declared.
4. **Risk assessed:** explicit statement exists for expected hazard and
   mitigations.
5. **Rollback path prepared:** operator has a tested path to return to normal
   interlock state within 30 seconds.

If any precondition fails, **do not proceed**.

---

## Authorization Matrix (Dual Approval Required)

| Role | Responsibility | Required |
|------|----------------|----------|
| Safety Officer (or delegate) | Confirms operational safety controls and floor readiness | Yes |
| On-call Engineering Lead | Confirms technical necessity and rollback readiness | Yes |
| Site Operations Lead | Coordinates floor communication and zone isolation | Yes |

> **Dual-Authorization Rule:** at least two independent authorizers must approve,
> including the Safety Officer (or delegate). Single-person authorization is
> forbidden.

Record authorizer names, roles, and UTC timestamps in the incident record before
continuing.

---

## PLC Interlock Override Checklist

Execute in order. Mark each step Pass/Fail in the incident record.

| # | Checkpoint | Evidence Required | Pass/Fail |
|---|------------|-------------------|-----------|
| 1 | Incident ID and override objective documented | Incident link + objective text | ☐ |
| 2 | Dual authorization captured | Names/roles/timestamps | ☐ |
| 3 | Affected PLC zone/device identified | Device IDs + zone map reference | ☐ |
| 4 | Floor isolation confirmed | Supervisor acknowledgement | ☐ |
| 5 | E-stop devices verified reachable and functional | Physical verification note | ☐ |
| 6 | Override duration cap set (max 15 minutes) | Start/end UTC window | ☐ |
| 7 | Observability monitors active | Dashboard snapshot or alert view | ☐ |
| 8 | Override command executed by authorized operator | Command log or HMI evidence | ☐ |
| 9 | Manual supervision maintained for full window | Named observer + interval notes | ☐ |
| 10 | Interlock restored and verified | Restoration timestamp + verification | ☐ |
| 11 | Post-override safety checks completed | Checklist output attached | ☐ |
| 12 | Incident record finalized and signed off | Safety + Engineering sign-off | ☐ |

---

## Execution Guardrails

- Override window must be as short as possible and never exceed **15 minutes**
  without a fresh dual-authorization cycle.
- No new recipe dispatches may occur during active override.
- Any unexpected actuator behavior requires immediate override cancellation and
  return to safe mode.
- If audit logging is degraded, override execution is prohibited unless
  life-safety emergency is declared by Safety Officer.

---

## Immediate Abort Conditions

Abort override and return to safe mode immediately if any of the following
occur:

- unplanned motion in adjacent or non-target zones,
- loss of communication with PLC/HMI safety telemetry,
- inability to maintain continuous human supervision,
- emergency-stop fault or uncertain E-stop status,
- interlock restore command fails once.

When aborting:

1. Trigger safe-mode controls from [safe-mode-activation.md](./safe-mode-activation.md).
2. Notify `#neurologix-ops` and on-call incident channel.
3. Escalate to Safety Officer and Site Operations Lead.

---

## Post-Override Validation

After restoration, confirm all items before incident closure:

1. Interlock state reports **ENGAGED** on PLC HMI.
2. No lingering override flags remain in controller/HMI config.
3. Recipe execution remains blocked until explicit release decision.
4. Audit log contains complete sequence (request → approve → execute → restore).
5. Incident retrospective includes root cause and prevention action.

---

## Mandatory Audit Evidence Fields

Capture the following in `.developer/INCIDENTS.md` and linked ticket artifacts:

- Incident ID
- Site ID and zone/device IDs
- Business reason for override
- Hazard statement and mitigations
- Authorizers (names, roles, UTC timestamps)
- Operator executing command
- Override start and end timestamps (UTC)
- Abort events (if any)
- Restoration verification details
- Follow-up owner and due date

Missing evidence means the override is considered **non-compliant** and must be
escalated to compliance review.

---

## Related References

- [Safe-Mode Activation Procedure](./safe-mode-activation.md)
- [Observability Baseline Runbook](./observability-baseline.md)
- [Release Rollback Runbook](./release-rollback.md)
- [IEC 62443 Security Constraints](../compliance/README.md)
