[Context]
Work Item: Issue#19
Chain Step: 14
Target Agent: Builder
Source: Issue#19
Status: Selected, eligible, and unblocked

Objective
Implement the smallest complete Issue #19 slice by delivering a machine-readable contracts model artifact and bounded companion contract stub with validation evidence, without widening scope.

Required Actions
1. Create `.github/.system-state/contracts/contracts_model.yaml` aligned to Issue #19 acceptance criteria:
   - enumerate current service APIs/events (`capability-registry`, `policy-engine`, `recipe-executor`, `digital-twin`),
   - enumerate planned contracts (dispatch, WMS/WCS connectors, ASR, CV, edge adapters),
   - include explicit versioning and compatibility policy fields,
   - include contract-testing obligations mapped to quality gates.
2. Create companion contract artifact `.github/.system-state/contracts/api.yaml` (or equivalent) referenced by `contracts_model.yaml`.
3. Keep changes bounded to Issue #19 deliverables and minimal planning evidence updates only.
4. Run structural validation checks (YAML parse + required field presence checks) and capture outputs.
5. Create/update `planning/validation-evidence-issue-19.md` with:
   - command evidence,
   - acceptance criteria mapping,
   - scope-boundary verification.
6. Open/refresh PR for Issue #19 with explicit scope statement and check status snapshots.
7. Dispatch Validator-Merger only after required checks are green.

Forbidden Actions
- Do not implement runtime/service/product features beyond model artifacts.
- Do not modify unrelated issue scope (`#20+`) or perform unrelated refactors.
- Do not bypass required checks, branch protection, or PR workflow.
- Do not merge directly to `main`.

Files to Inspect
- `planning/issue-selection-issue-19.md`
- `planning/eligibility-snapshot-2026-03-10.json`
- `planning/open-issues-live-2026-03-10.json`
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/19
- Dependency context issue: https://github.com/Coding-Krakken/NeuroLogix/issues/20

Acceptance Criteria
1. `contracts_model.yaml` is present, machine-readable, and covers all current/planned service contracts in Issue #19 scope.
2. Versioning/backward-compatibility and contract-testing obligations are explicit in the model.
3. Companion contract stub artifact exists and is reference-aligned with the model.
4. Validation evidence demonstrates acceptance criteria coverage and bounded scope with no hidden creep.

Required GitHub Updates
1. Post start-of-implementation comment on Issue #19 with bounded scope declaration.
2. Post PR comment summarizing structural validation results and required-check status.
3. Post Issue #19 progress/update comment linking PR and validation evidence artifact.

Validation Expectations
- Prefer deterministic, machine-readable checks over narrative-only confirmation.
- Validate exactly the changed artifact set first, then confirm PR required-check rollup.
- Treat any scope drift beyond Issue #19 artifacts as a blocker requiring correction before validator handoff.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-19.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-19.md"
```
