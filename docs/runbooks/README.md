# Operations Runbooks

## Purpose

This directory contains operational runbooks for incident response, service
recovery, and safe-mode procedures.

## Runbooks

| Runbook | Scope | Status |
|---------|-------|--------|
| [release-rollback.md](./release-rollback.md) | Production + staging Helm rollback, automated and manual rollback procedures | Active |
| [observability-baseline.md](./observability-baseline.md) | Alert triage, availability, control-loop latency, audit log, policy engine, safety interlock procedures | Active |
| [capability-registry-triage.md](./capability-registry-triage.md) | Incident triage for capability lifecycle, health checks, and registry recovery | Active |
| [policy-engine-triage.md](./policy-engine-triage.md) | Incident triage for policy evaluation latency, decision anomalies, and safety escalation | Active |
| [recipe-executor-triage.md](./recipe-executor-triage.md) | Incident triage for recipe execution failures, stalled progress, and safety-guarded recovery | Active |
| [digital-twin-triage.md](./digital-twin-triage.md) | Incident triage for twin state ingestion, simulation failures, and sync lag recovery | Active |
| [site-registry-triage.md](./site-registry-triage.md) | Incident triage for provisioning, feature flags, and federation topology integrity | Active |
| [safe-mode-activation.md](./safe-mode-activation.md) | Full platform safe-mode activation, service suspension sequence, hardware interlock verification, and controlled recovery | Active |
| [plc-interlock-override-checklist.md](./plc-interlock-override-checklist.md) | Temporary PLC interlock override authorization, execution guardrails, abort criteria, and audit evidence checklist | Active |

## Related Guidance

Operational guidance also lives in:

- `docs/runbooks/` — platform-wide and service-specific triage runbooks
- `.developer/RELEASE.md` — full release checklist and rollback triggers
- planning validation and closure records under `planning/`

## Near-Term Contents

- No pending runbook-only gaps; near-term delivery tracked in `.developer/TODO.md`.

## Related Architecture Evidence

- [ADR-004: Observability Strategy](../architecture/ADR-004-observability-strategy.md)
- [Phase 0 Gap Report](../architecture/phase-0-gap-report.md)
