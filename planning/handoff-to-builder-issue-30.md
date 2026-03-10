[Context]
Work Item: Issue#30
Chain Step: 8
Target Agent: Builder
Source: Issue#30
Status: selected-and-ready

Objective
Deliver the smallest complete, testable Phase 1 vertical slice for Issue #30 (Data Spine and Contract Enforcement) now that dependencies (#19, #20, #29) are closed.

Required Actions
1. Create a short-lived branch from latest `main` named with issue ID and concise slug.
2. Implement one bounded Phase 1 slice outside `.github/` that advances Data Spine and Contract Enforcement acceptance criteria.
3. Add or update targeted tests only for changed behavior.
4. Keep scope within PR guardrails (preferred <=25 files, <=600 lines changed).
5. Produce/update execution evidence in `planning/validation-evidence-issue-30.md`.
6. Open a PR linked to Issue #30 with a bounded scope summary and validation evidence.
7. Re-dispatch to Validator-Merger only after required checks are green.

Forbidden Actions
- Do not modify `.github/` framework internals during this normal issue execution.
- Do not widen into Issues #31+ except unavoidable wiring needed for this bounded slice.
- Do not perform unrelated refactors in `packages/`, `services/`, or docs.
- Do not bypass PR workflow, required checks, or branch protections.

Files to Inspect
- `planning/issue-selection-issue-30.md`
- `planning/validation-evidence-issue-29-validator.md`
- `planning/merge-record-issue-29.md`
- `planning/closure-record-issue-29.md`
- `planning/open-issues-live-2026-03-10.json`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/30

Acceptance Criteria
1. A single bounded Phase 1 implementation slice is complete and reviewable.
2. Changed behavior has targeted test evidence.
3. PR remains within stated scope guardrails with clear rollback path.
4. Validator receives reproducible evidence for lint/test/build and scope bounds.

Required GitHub Updates
1. Comment on Issue #30 when implementation starts with planned bounded slice.
2. Update Issue #30 with PR link and check status once opened.
3. Include in PR body: in-scope, out-of-scope, tests run, risk/rollback notes.

Validation Expectations
- Run minimal deterministic checks proving slice correctness (at least lint, targeted tests, and build as applicable).
- Preserve strict scope discipline; if scope pressure appears, split and keep highest-value safe slice.
- Document command outputs in `planning/validation-evidence-issue-30.md`.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-30.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-30.md"
```