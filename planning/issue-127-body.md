## Problem

Three documentation drift items remain after ADRs 002–009 were successfully authored:

### 1. ADR index missing two index entries
`docs/architecture/README.md` does not link to two files that exist on disk:
- `phase-0-gap-report.md` (referenced from root README but absent from the ADR index)
- `phase-1-definition-of-ready.md` (same)

### 2. phase-0-gap-report has a stale gap table
The gap table in `docs/architecture/phase-0-gap-report.md` reports ADR-002 through ADR-008 as "Missing artifact". All seven files now exist with substantial content. The status rows must be updated to "Resolved" to prevent misleading future readers.

### 3. Root README Phase 0 checklist item still unchecked
`README.md` shows `[ ] Architecture documentation` even though both linked artifacts exist and all indexed ADR files are now on disk. Per the phase-0-gap-report guidance: "Do not mark Phase 0 architecture documentation complete until the index and authored files are consistent." That condition is now met.

## Acceptance Criteria

- [ ] `docs/architecture/README.md` Phase 0 section links `phase-0-gap-report.md`
- [ ] `docs/architecture/README.md` Phase 1 section links `phase-1-definition-of-ready.md`
- [ ] Gap table in `phase-0-gap-report.md` updated: all ADR-002–ADR-008 rows show status = "Resolved"
- [ ] `README.md` Phase 0 Architecture documentation item marked `[x]`
- [ ] No runtime code or CI config changes
- [ ] Lint, typecheck, build pass

## Scope

Docs-only. No packages/, services/, or workflow changes.
