[Context]
Work Item: Issue#32
Chain Step: 14
Target Agent: Builder
Source: Issue#32
Status: selected-and-ready

Objective
Deliver the smallest complete, testable Phase 4 vertical slice for Issue #32 by implementing one bounded AI service path with deterministic policy-veto and degraded-mode behavior outside `.github/`.

Required Actions
1. Create a short-lived branch from latest `main` named with issue ID and concise slug.
2. Implement one minimal ASR/NLU service scaffold with typed contracts in runtime package(s) outside `.github/`.
3. Implement a deterministic policy-gated recommendation path where unsafe recommendations are vetoed.
4. Implement deterministic degraded-mode fallback when inference confidence is below threshold or result payload is missing.
5. Add targeted tests covering allow, veto, and degraded fallback outcomes.
6. Capture execution evidence in `planning/validation-evidence-issue-32.md` (commands, outputs, changed files, risks).
7. Keep scope within PR guardrails (preferred: <=25 files, <=600 lines changed).
8. Open a PR linked to Issue #32 and hand off to Validator-Merger only after required checks are green.

Forbidden Actions
- Do not modify `.github/` during this normal issue execution.
- Do not widen scope into full CV and optimizer production pipelines.
- Do not implement UI, connector, federation, or unrelated backlog scope (`#33+`).
- Do not perform unrelated refactors or dependency upgrades.
- Do not bypass PR workflow, required checks, or branch protection.

Files to Inspect
- `planning/issue-selection-issue-32.md`
- `planning/handoff-to-planner-issue-31.md`
- `planning/validation-evidence-issue-31-validator.md`
- `planning/merge-record-issue-31.md`
- `planning/closure-record-issue-31.md`
- `packages/` (runtime/service contracts and tests)
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/32

Acceptance Criteria
1. One bounded AI service path is implemented with typed contracts and deterministic behavior.
2. Unsafe recommendations are policy-vetoed deterministically.
3. Low-confidence/missing inference result paths fail over deterministically to degraded mode.
4. Changed behavior has targeted automated tests.
5. Scope remains bounded, reviewable, and reversible.

Required GitHub Updates
1. Comment on Issue #32 at implementation start with bounded slice plan.
2. Update Issue #32 with PR link and checks status when PR is opened.
3. Include in PR body: in-scope, out-of-scope, tests run, risk notes, rollback path.

Validation Expectations
- Run at minimum: `npm run lint`, `npm test`, `npm run build`.
- Run package-targeted checks for changed workspace(s) when available.
- Keep evidence deterministic and auditable in `planning/validation-evidence-issue-32.md`.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-32.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-32.md"
```
