[Context]
Work Item: Issue#33
Chain Step: 18
Target Agent: Validator-Merger
Source: Issue#33
Status: ready-for-validation

Objective
Validate and disposition the Issue #33 bounded Phase 5 slice implementing one deterministic WMS/WCS connector+dispatch path with idempotency, retry classification, and dead-letter routing.

Required Actions
1. Re-validate scope is bounded to the Issue #33 slice (no `.github/` edits, no Issue `#34+` scope expansion, no unrelated refactors).
2. Verify typed contract and deterministic behavior for:
   - WMS/WCS ingestion + normalization,
   - idempotent duplicate command handling,
   - transient retry behavior,
   - dead-letter routing for terminal failures.
3. Re-run required lane checks (`npm run lint`, `npm test`, `npm run build`) and compare with builder evidence.
4. Confirm rollback path is explicit and reversible.
5. Update validator review/decision artifacts and proceed per validator merge policy.

Forbidden Actions
- Do not widen scope into UI (`#34`), security (`#35`), validation/chaos (`#36`), or federation (`#37`) feature work.
- Do not modify `.github/` framework internals during this normal issue run.
- Do not merge with failing required checks.

Files to Inspect
- `packages/schemas/src/intents/index.ts`
- `packages/schemas/src/intents/index.test.ts`
- `packages/schemas/src/index.ts`
- `packages/adapters/src/wms-wcs/index.ts`
- `packages/adapters/src/wms-wcs/index.test.ts`
- `packages/adapters/src/index.ts`
- `planning/validation-evidence-issue-33.md`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/33

Acceptance Criteria
1. One bounded WMS/WCS connector+dispatch service path is implemented with typed contracts.
2. Duplicate command submissions resolve idempotently and deterministically.
3. Retry and dead-letter behavior is deterministic and test-covered.
4. Changed behavior has targeted automated tests.
5. Scope remains bounded, reviewable, and reversible.

Required GitHub Updates
1. Post validator PR summary comment with findings and gate outcomes.
2. Post validator disposition comment (approve/request changes) with rationale.
3. Update Issue #33 with validator status and merge readiness.

Validation Expectations
- Treat unrelated warnings as baseline unless this slice introduces new lint/build/test failures.
- Confirm idempotency/retry/dead-letter behavior remains deterministic under validator reruns.
- Preserve deterministic validator evidence under `planning/`.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-33.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-33.md"
```
