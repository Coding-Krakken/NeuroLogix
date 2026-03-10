[Context] Work Item: Issue#20 Chain Step: 18 Target Agent: Validator-Merger
Source: Issue#20 Status: Implementation complete, structural checks green, ready
for validation

Objective Validate and merge Issue #20 bounded model-first data-model slice if
acceptance and policy gates remain satisfied.

Required Actions

1. Validate Issue #20 acceptance criteria against implemented artifacts:
   - `.github/.system-state/data/data_model.yaml`
2. Verify deterministic structural evidence:
   - `planning/validation-issue-20-structural-check.json` reports
     `overall_pass: true`.
   - `planning/validation-evidence-issue-20.md` includes command evidence,
     acceptance mapping, and scope-boundary verification.
3. Confirm scope discipline:
   - Only Issue #20 artifact/evidence files are part of the committed slice.
   - No runtime/service/product feature changes included.
4. If validation passes, proceed with standard validator-merger PR review and
   merge flow.

Forbidden Actions

- Do not widen scope beyond Issue #20 acceptance boundaries.
- Do not accept failing required checks.
- Do not bypass branch protection or merge policy.

Files to Inspect

- `planning/issue-selection-issue-20.md`
- `.github/.system-state/data/data_model.yaml`
- `planning/validation-issue-20-structural-check.json`
- `planning/validation-evidence-issue-20.md`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/20

Acceptance Criteria

1. `.github/.system-state/data/data_model.yaml` exists and is machine-readable.
2. Model covers implemented and planned schema domains required by Issue #20.
3. Partitioning and retention policy sections are explicit and testable.
4. Validation evidence demonstrates deterministic structural checks with command
   outputs.
5. Scope remains strictly bounded to Issue #20.

Required GitHub Updates

1. Post validator review summary with acceptance mapping outcome.
2. Record merge readiness/decision using repository validator template flow.
3. Post Issue #20 closure/progress linkage after merge decision.

Validation Expectations

- Re-run or verify deterministic checks if any artifact changed since builder
  validation.
- Treat any scope drift or acceptance gap as blocker and return with explicit
  remediation notes.

Final Command Requirement

```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "planner-architect" -PromptFile "planning/handoff-to-planner-issue-20.md" -AddFile ".github/templates/merge-record.md,.github/templates/closure-record.md,planning/validation-evidence-issue-20-validator.md"
```
