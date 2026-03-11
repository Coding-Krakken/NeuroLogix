## Summary
This PR closes the Phase 7 documentation gap for PLC interlock override operations by adding a dedicated checklist runbook and aligning runbook/backlog indexes.

Closes #145.

## What changed
- Added `docs/runbooks/plc-interlock-override-checklist.md`.
- Updated `docs/runbooks/README.md` runbook table to include the new checklist.
- Updated `.developer/TODO.md` to mark PLC interlock override checklist as complete.

## Scope
Docs-only, merge-safe change.

## Validation
- `npm run lint` (passes; existing repo warnings only)

## Risk
Low. No runtime code or infrastructure behavior changes.

## Rollback
Revert this PR commit to restore prior docs state.
