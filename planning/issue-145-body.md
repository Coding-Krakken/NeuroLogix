## Summary
Phase 7 currently lacks an explicit PLC interlock override checklist runbook, even though this is listed as a near-term compliance and safety deliverable. The safe-mode activation runbook exists, but operators still need a standalone, stepwise checklist for PLC interlock override requests, authorization, verification, and audit capture.

## Why this matters
- IEC 62443 / safety-first constraints require controlled, auditable handling of any interlock override path.
- A dedicated checklist reduces operator ambiguity during high-pressure incidents.
- Existing docs (`docs/runbooks/README.md`, `.developer/TODO.md`) already signal this gap.

## Current behavior
- `docs/runbooks/safe-mode-activation.md` references interlock verification but does not provide an override-specific checklist artifact.
- `docs/runbooks/README.md` lists this item as near-term, not delivered.
- `.developer/TODO.md` lists this item under Active / Near Term.

## Desired outcome
Deliver a minimal documentation slice that adds a standalone PLC interlock override checklist runbook and updates index/backlog references to show the gap is closed.

## Scope
- Add `docs/runbooks/plc-interlock-override-checklist.md` with:
  - Preconditions and authorization matrix
  - Step-by-step override checklist
  - Mandatory validation and rollback-to-safe-state checks
  - Required audit evidence fields
  - Escalation criteria
- Update `docs/runbooks/README.md` runbook table and near-term section.
- Update `.developer/TODO.md` to mark this near-term item completed.

## Non-goals
- No runtime code changes.
- No policy-engine or PLC adapter behavior changes.
- No CI workflow changes beyond existing docs validation.

## Acceptance criteria
- New runbook exists and is linked from the runbook index.
- Checklist explicitly enforces zero-bypass safety principle and dual-authorization requirement.
- Checklist contains concrete evidence capture requirements for immutable audit trail.
- `.developer/TODO.md` no longer lists this item as pending under Active / Near Term.
- Local validation for docs slice passes (repo lint baseline).
- PR checks pass and merge to `main`.

## Validation
- `npm run lint`
- GitHub Actions required checks green on PR

## Risks / Constraints
- Must stay aligned to model-first safety constraints and existing runbook conventions.
- Must remain docs-only and merge-safe with minimal diff.
