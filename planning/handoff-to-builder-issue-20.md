[Context]
Work Item: Issue#20
Chain Step: 20
Target Agent: Builder
Source: Issue#20
Status: Validation blocked; PR-readiness remediation required

Objective
Resolve Issue #20 merge-gate blockers with the smallest bounded remediation slice: commit the accepted Issue #20 artifacts, open a linked PR, and provide green-check evidence for validator re-run.

Required Actions
1. Keep Issue #20 selected; do not start any new issue work.
2. Prepare a clean, bounded commit set on `issue-20-data-model-phase4` containing only Issue #20 artifacts:
   - `.github/.system-state/data/data_model.yaml`
   - `planning/validation-issue-20-structural-check.json`
   - `planning/validation-evidence-issue-20.md`
   - `planning/handoff-to-validator-issue-20.md`
   - `planning/issue-selection-issue-20.md`
3. Open a PR from `issue-20-data-model-phase4` to `main`, linked to Issue #20.
4. Ensure required checks are green before validator handoff.
5. Update evidence to include:
   - bounded file-list verification,
   - PR link,
   - required-check status snapshot,
   - confirmation that accepted Issue #20 content remains unchanged except required bounded remediation updates.
6. Re-dispatch Validator-Merger with updated evidence only after step 4 is satisfied.

Forbidden Actions
- Do not modify runtime/service/product code in `packages/` or `services/`.
- Do not add new model content beyond accepted Issue #20 scope.
- Do not broaden into Issue #21+ or unrelated tracks.
- Do not bypass PR workflow, required checks, branch protection, or approval policy.
- Do not include unrelated local changes in commit or PR.

Files to Inspect
- `planning/issue-selection-issue-20.md`
- `planning/issue-selection-issue-20-recovery.md`
- `planning/validation-evidence-issue-20-validator.md`
- `planning/review-summary-issue-20.md`
- `planning/merge-record-issue-20.md`
- `planning/closure-record-issue-20.md`
- `planning/validation-evidence-issue-20.md`
- `planning/validation-issue-20-structural-check.json`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/20

Acceptance Criteria
1. Issue #20 artifact set is committed with a bounded diff only.
2. PR exists from `issue-20-data-model-phase4` to `main` and is linked to Issue #20.
3. Required PR checks are green.
4. Validation evidence captures bounded scope verification plus PR/check snapshot.
5. Scope remains strictly bounded to Issue #20.

Required GitHub Updates
1. Update Issue #20 with remediation progress, PR link, and gate status.
2. Add PR summary comment with bounded file list and required-check snapshot.
3. Preserve traceability links to planner artifacts:
   - `planning/issue-selection-issue-20.md`
   - `planning/issue-selection-issue-20-recovery.md`

Validation Expectations
- Validate with minimal commands needed to prove bounded scope and gate readiness.
- Do not re-open content modeling work unless structural checks fail on committed artifacts.
- Evidence must be reproducible from committed PR state.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-20.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-20.md"
```
