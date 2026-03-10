[Context]
Work Item: Issue#33
Chain Step: 17
Target Agent: Builder
Source: Issue#33
Status: selected-and-ready

Objective
Deliver the smallest complete, testable Phase 5 vertical slice for Issue #33 by implementing one deterministic WMS/WCS dispatch path with idempotency, retry, and dead-letter behavior outside `.github/`.

Required Actions
1. Create a short-lived branch from latest `main` named with issue ID and concise slug.
2. Implement one bounded connector contract path (WMS/WCS command ingestion + normalization) in existing runtime package(s) outside `.github/`.
3. Implement deterministic idempotent dispatch handling keyed by command/correlation ID for duplicate submissions.
4. Implement bounded retry policy for transient failures and deterministic dead-letter routing for terminal failures.
5. Add targeted tests covering duplicate-command idempotency, retry transition, and dead-letter transition.
6. Capture execution evidence in `planning/validation-evidence-issue-33.md` (commands, outputs, changed files, risks).
7. Keep scope within PR guardrails (preferred: <=25 files, <=600 lines changed).
8. Open a PR linked to Issue #33 and hand off to Validator-Merger only after required checks are green.

Forbidden Actions
- Do not modify `.github/` during this normal issue execution.
- Do not widen scope into full connector ecosystem, UI (`#34`), security (`#35`), validation/chaos (`#36`), or federation (`#37`).
- Do not reopen Issue #32 implementation scope except through a dedicated regression issue.
- Do not perform unrelated refactors or dependency upgrades.
- Do not bypass PR workflow, required checks, or branch protection.

Files to Inspect
- `planning/issue-selection-issue-33.md`
- `planning/handoff-to-planner-issue-32.md`
- `planning/validation-evidence-issue-32-validator.md`
- `planning/merge-record-issue-32.md`
- `planning/closure-record-issue-32.md`
- `packages/adapters/src/`
- `packages/schemas/src/`
- `services/`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/33

Acceptance Criteria
1. One bounded WMS/WCS connector+dispatch service path is implemented with typed contracts.
2. Duplicate command submissions resolve idempotently and deterministically.
3. Retry and dead-letter behavior is deterministic and test-covered.
4. Changed behavior has targeted automated tests.
5. Scope remains bounded, reviewable, and reversible.

Required GitHub Updates
1. Comment on Issue #33 at implementation start with bounded slice plan.
2. Update Issue #33 with PR link and checks status when PR is opened.
3. Include in PR body: in-scope, out-of-scope, tests run, risk notes, rollback path.

Validation Expectations
- Run at minimum: `npm run lint`, `npm test`, `npm run build`.
- Run package-targeted checks for changed workspace(s) when available.
- Keep evidence deterministic and auditable in `planning/validation-evidence-issue-33.md`.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-33.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-33.md"
```