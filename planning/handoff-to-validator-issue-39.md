[Context]
Work Item: Issue#39
Chain Step: 2
Target Agent: Validator-Merger
Source: PR#40
Status: Implemented and ready for validation

Objective
Validate and merge Issue #39 remediation that restores deterministic `validate:model:system-state` behavior via explicit missing-file guard while preserving bounded scope.

Required Actions
1. Validate PR #40 scope remains bounded to Issue #39 slice:
   - `package.json`
   - `planning/validation-evidence-issue-39.md`
2. Re-run targeted validation checks from evidence:
   - `npm run validate:model:system-state` with model file present and formatted (expect exit `0`)
   - missing-file simulation (temporary move/rename + restore) expecting exit `1` with explicit error
3. Confirm explicit guard message is present for missing-file path.
4. Confirm Issue #39 and PR #40 traceability comments are present.
5. Merge only if required checks and policy gates pass.

Forbidden Actions
- Do not widen into runtime/product/model feature work (#18+).
- Do not modify `.github/` framework internals as part of this remediation.
- Do not bypass required checks, branch protection, or PR workflow.

Files to Inspect
- `package.json`
- `planning/validation-evidence-issue-39.md`
- `planning/validation-evidence-issue-17.md`
- PR: https://github.com/Coding-Krakken/NeuroLogix/pull/40
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/39

Acceptance Criteria
1. `npm run validate:model:system-state` exits non-zero with explicit missing-file message when `.github/.system-state/model/system_state_model.yaml` is missing.
2. `npm run validate:model:system-state` exits `0` when the model file exists and is correctly formatted.
3. PR scope remains minimal and bounded to Issue #39 remediation.
4. Validation evidence remains complete and reproducible.

Required GitHub Updates
1. Post validator summary on PR #40 with pass/fail outcomes and command evidence.
2. Update Issue #39 with merge/validation disposition.
3. If merged, include closure traceability and any residual risk note.

Validation Expectations
- Prefer targeted checks first; broaden only if scope expands.
- Treat any non-deterministic script behavior as failure.
- Record exit codes and key output strings verbatim.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-39.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-39.md"
```
