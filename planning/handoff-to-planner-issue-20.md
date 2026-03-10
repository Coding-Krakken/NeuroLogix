[Context]
Work Item: Issue#20
Chain Step: 19
Target Agent: Planner-Architect
Source: Issue#20
Status: Validation blocked, merge not executed

Objective
Continue deterministic loop by resolving Issue #20 merge-gate blockers and selecting the correct next orchestration action (re-dispatch Builder for bounded PR preparation or re-plan if dependency/risk context changed).

Required Actions
1. Treat Issue #20 content validation as passing but merge-gate state as blocked.
2. Review validator artifacts:
   - `planning/validation-evidence-issue-20-validator.md`
   - `planning/review-summary-issue-20.md`
   - `planning/merge-record-issue-20.md`
   - `planning/closure-record-issue-20.md`
3. Enforce policy remediation path:
   - Ensure Builder prepares a clean, bounded commit set for Issue #20.
   - Ensure a PR is opened from `issue-20-data-model-phase4` to `main`.
   - Require green PR checks before next validator cycle.
4. Preserve dependency sequencing: keep #21 blocked on #20 until merge completion.

Forbidden Actions
- Do not mark Issue #20 as complete or closed before PR merge.
- Do not bypass PR-based merge policy.
- Do not widen scope beyond Issue #20 acceptance boundaries.

Files to Inspect
- `planning/handoff-to-validator-issue-20.md`
- `planning/validation-evidence-issue-20.md`
- `planning/validation-issue-20-structural-check.json`
- `planning/validation-evidence-issue-20-validator.md`
- `planning/review-summary-issue-20.md`
- `planning/merge-record-issue-20.md`
- `planning/closure-record-issue-20.md`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/20

Acceptance Criteria
1. Planner preserves Issue #20 as active (not closed) until policy-compliant merge completes.
2. Next handoff instructs bounded PR preparation for Issue #20 with explicit in-scope/out-of-scope controls.
3. Dependency and traceability records remain deterministic and auditable.

Required GitHub Updates
1. Post/refresh Issue #20 progress comment linking validator blocked decision and remediation path.
2. If needed, reaffirm #21 blocked status on unresolved dependency #20.
3. Link validator evidence artifacts in planner-to-builder handoff context.

Validation Expectations
- Do not advance to merge stage again until a real PR exists and required checks are available.
- Treat any scope drift from Issue #20 as blocker.
- Preserve deterministic chain artifacts under `planning/`.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "planner-architect" -PromptFile "planning/handoff-to-planner-issue-20.md" -AddFile ".github/templates/merge-record.md,.github/templates/closure-record.md,planning/validation-evidence-issue-20-validator.md"
```
