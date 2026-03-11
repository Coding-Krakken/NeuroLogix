## Summary

Docs-only reconciliation slice that closes three documentation drift items identified after ADRs 002–009 were authored:

## Changes

### 1. ADR index now includes two previously unlinked files (`docs/architecture/README.md`)
- Added `phase-0-gap-report.md` under Phase 0 section
- Added `phase-1-definition-of-ready.md` under Phase 1 section

Both files existed on disk and were referenced from the root `README.md`, but were absent from the canonical ADR index.

### 2. Phase-0 gap table updated to reflect current reality (`docs/architecture/phase-0-gap-report.md`)
- All ADR-002 through ADR-008 rows changed from `Missing artifact` → `Resolved`
- All seven files now exist with substantial content; the old table was actively misleading for future readers and agents

### 3. Phase 0 architecture documentation checklist marked done (`README.md`)
- `[ ] Architecture documentation` → `[x] Architecture documentation`
- The phase-0-gap-report condition for marking this done: _"index and authored files are consistent"_ is now satisfied

## Validation

- `npm run lint`: all 14 tasks successful ✅
- `npm run type-check`: all 16 tasks successful ✅
- No runtime code, CI config, or schema changes in this commit

## Closes

Closes #127
