[Context]
Work Item: Issue#39
Chain Step: 4
Target Agent: Builder
Source: PR#40
Status: Blocked - remediation required before validator re-run

Objective
Remediate PR #40 with the smallest possible change set to clear validator blockers while preserving already-validated deterministic `validate:model:system-state` behavior.

Required Actions
1. Keep Issue #39 selected and work only on PR #40 remediation.
2. Apply formatting fixes required to clear `🧹 Lint & Format` for changed planning files in this PR:
   - `planning/handoff-to-validator-issue-39.md`
   - `planning/validation-evidence-issue-39.md`
3. Re-align scope for `planning/handoff-to-validator-issue-39.md`:
   - either remove it from PR #40, or
   - document explicit policy justification for retaining it in-scope in PR comments and evidence.
4. Push updates to PR #40 and re-run CI until all required checks are green.
5. Update `planning/validation-evidence-issue-39.md` with remediation command outputs and final check status.
6. Handoff back to Validator-Merger only after required checks are fully green.

Forbidden Actions
- Do not broaden into runtime/product/model feature work (#18+).
- Do not perform unrelated refactors.
- Do not modify framework internals in `.github/`.
- Do not bypass required checks, branch protection, or PR workflow.
- Do not re-open or alter already validated script logic unless a new regression is observed.

Files to Inspect
- `planning/handoff-to-validator-issue-39.md`
- `planning/validation-evidence-issue-39.md`
- `planning/validation-evidence-issue-39-validator.md`
- `planning/review-summary-issue-39.md`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/39
- PR: https://github.com/Coding-Krakken/NeuroLogix/pull/40
- Validator PR comment: https://github.com/Coding-Krakken/NeuroLogix/pull/40#issuecomment-4030257838
- Validator issue comment: https://github.com/Coding-Krakken/NeuroLogix/issues/39#issuecomment-4030258848

Acceptance Criteria
1. PR #40 has all required checks green.
2. Scope is bounded to approved Issue #39 remediation slice, with explicit justification if any non-core planning file remains.
3. Validator can confirm no hidden scope creep.
4. Deterministic command behavior evidence remains intact and traceable.

Required GitHub Updates
1. Update PR #40 with a remediation summary comment including:
   - formatting fixes applied,
   - scope-alignment decision for `planning/handoff-to-validator-issue-39.md`,
   - required-check status after rerun.
2. Update Issue #39 with concise remediation progress and status.
3. Preserve links to validator findings for auditability.

Validation Expectations
- Validate only minimum commands needed to clear current blockers.
- Keep PR small, reviewable, and reversible.
- Do not broaden validation scope unless remediation changes warrant it.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-39.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-39.md"
```
