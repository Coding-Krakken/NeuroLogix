## Summary
Create service-specific incident triage playbooks for the five core runtime services to close the Phase 7 runbook coverage gap tracked in `.developer/TODO.md`.

## Why this matters
The repository currently has global rollback and observability runbooks, but lacks first-responder triage procedures per service. For a T1 system, responders need deterministic, service-scoped steps for symptom detection, containment, escalation, and safe recovery.

## Current behavior
- `docs/runbooks/README.md` lists only:
  - `release-rollback.md`
  - `observability-baseline.md`
- `.developer/TODO.md` still tracks "Add service incident triage playbooks per service (Phase 7)" as active work.

## Desired outcome
Add one runbook per service with consistent format and explicit triage steps:
- capability-registry
- policy-engine
- recipe-executor
- digital-twin
- site-registry

## Scope
- Add 5 new markdown runbooks under `docs/runbooks/`.
- Update `docs/runbooks/README.md` runbook index to include all new files.
- Update `.developer/TODO.md` to mark this gap as completed.

## Non-goals
- No runtime service code changes.
- No CI workflow behavior changes.
- No architecture/model contract changes.

## Acceptance criteria
- [ ] `docs/runbooks/` contains five new service triage runbooks.
- [ ] Each runbook includes at minimum:
  - Overview/purpose
  - Trigger symptoms
  - Immediate containment steps
  - Service-specific diagnostics
  - Recovery/rollback criteria
  - Escalation + compliance logging notes
- [ ] `docs/runbooks/README.md` links all five runbooks.
- [ ] `.developer/TODO.md` marks this runbook item complete.
- [ ] Repository checks used for docs-only slice are green.

## Validation plan
- Local: run lint and type-check to ensure no incidental repo regressions.
- CI: validate merged change via mainline GitHub Actions run.

## Risks / constraints
- Keep content aligned to existing T1 language and safety constraints.
- Keep change minimal and merge-safe (documentation-only).
