# Operations Runbooks

## Purpose

This directory contains operational runbooks for incident response, service
recovery, and safe-mode procedures.

## Runbooks

| Runbook | Scope | Status |
|---------|-------|--------|
| [release-rollback.md](./release-rollback.md) | Production + staging Helm rollback, automated and manual rollback procedures | Active |

## Related Guidance

Operational guidance also lives in:

- `.developer/RUNBOOKS/` — service-specific runbooks
- `.developer/RELEASE.md` — full release checklist and rollback triggers
- planning validation and closure records under `planning/`

## Near-Term Contents

- Service incident triage playbooks
- Safe-mode activation procedures
- PLC interlock override checklist (Phase 7 — Security & Compliance)

## Related Architecture Evidence

- [ADR-004: Observability Strategy](../architecture/ADR-004-observability-strategy.md)
- [Phase 0 Gap Report](../architecture/phase-0-gap-report.md)
