[Context]
Work Item: Issue#49
Chain Step: 20
Target Agent: Builder
Source: Issue#49
Status: selected-and-ready

Objective
Deliver the smallest complete, testable policy-clarification slice for Issue #49 by defining a deterministic standard-lane handling rule for model/evidence-only PRs and aligning planner/validator handoff usage outside `.github/`.

Required Actions
1. Create a short-lived branch from latest `main` named with issue ID and concise slug.
2. Add one canonical policy artifact under `planning/` that defines lane selection/exemption behavior for model/evidence-only slices.
3. Define explicit evidence requirements (required fields and pass/fail interpretation) in a reviewer-consumable artifact under `planning/`.
4. Create or update Issue #49 cycle handoff artifacts so planner-target and validator-target handoffs reference the same canonical policy rule.
5. Record execution and verification evidence in `planning/validation-evidence-issue-49.md` (commands, files changed, decision evidence, risks).
6. Keep scope within PR guardrails (preferred: <=25 files, <=600 lines changed).
7. Open a PR linked to Issue #49 and hand off to Validator-Merger only after required checks are green.
8. If full template propagation would require `.github/` edits, record that as a follow-up framework-maintenance issue instead of widening current scope.

Forbidden Actions
- Do not modify `.github/` during this normal issue execution.
- Do not reopen Issue #33 or Issue #44 implementation scopes except through a dedicated regression issue.
- Do not widen scope into runtime feature delivery (`#34+`) or infrastructure refactors.
- Do not perform unrelated refactors or dependency upgrades.
- Do not bypass PR workflow, required checks, or branch protection.

Files to Inspect
- `planning/issue-selection-issue-49.md`
- `planning/handoff-to-planner-issue-33.md`
- `planning/validation-evidence-issue-33-validator.md`
- `planning/validation-evidence-issue-44-validator.md`
- `planning/open-issues-live-2026-03-10-post33.json`
- `planning/eligibility-snapshot-2026-03-10-post33.json`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/49

Acceptance Criteria
1. Deterministic lane-selection/exemption rule for model/evidence-only slices is documented in one canonical policy artifact.
2. Required evidence fields for exemption/override are explicit and auditable.
3. Planner-target and validator-target handoff artifacts for this cycle reference the same policy rule.
4. Changed behavior is bounded to planning/policy artifacts and remains reversible.

Required GitHub Updates
1. Comment on Issue #49 at implementation start with bounded slice plan and file targets.
2. Update Issue #49 with PR link and checks status when PR is opened.
3. Include in PR body: in-scope, out-of-scope, tests/checks run, risk notes, rollback path.
4. If a framework-maintenance follow-up is required for `.github/` template propagation, link that issue in both Issue #49 and PR body.

Validation Expectations
- Run at minimum: `npm run lint`, `npm test`, `npm run build`.
- Keep evidence deterministic and auditable in `planning/validation-evidence-issue-49.md`.
- Ensure policy wording is unambiguous and references a single canonical decision source.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-49.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-49.md"
```
