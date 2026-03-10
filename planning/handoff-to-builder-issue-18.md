[Context]
Work Item: Issue#18
Chain Step: 13
Target Agent: Builder
Source: PR#41
Status: Recovery dispatch - required check failure on bounded PR

Objective
Restore merge eligibility for Issue #18 by remediating the failing `CI/CD Pipeline / 🧹 Lint & Format` check on PR #41 using the smallest possible bounded change.

Required Actions
1. Keep Issue #18 and PR #41 (`issue-18-delivery-model-phase-2` → `main`) as the active recovery vehicle.
2. Remediate formatter failure by changing only the CI-flagged files:
   - `planning/handoff-to-validator-issue-18.md`
   - `planning/validation-evidence-issue-18.md`
3. Run targeted formatter commands on those files and verify no unrelated file deltas are introduced.
4. Commit and push only the bounded formatter remediation to PR #41.
5. Capture refreshed merge-gate evidence from PR #41 after push:
   - required-check status snapshot
   - approval/review decision snapshot
6. Update Issue #18 with remediation status and check snapshot evidence.
7. Re-dispatch Validator-Merger only after required checks are green.

Forbidden Actions
- Do not modify `.github/.system-state/delivery/delivery_model.yaml` content in this recovery slice.
- Do not include unrelated changed files in commit(s) or widen scope beyond formatter remediation.
- Do not bypass required checks, required approvals, or branch protection policy.
- Do not mark Issue #18 merged or closed while any required check is failing.

Files to Inspect
- `planning/issue-selection-issue-18-recovery.md`
- `planning/validation-evidence-issue-18-validator.md`
- `planning/review-summary-issue-18.md`
- `planning/validation-evidence-issue-18.md`
- `planning/handoff-to-validator-issue-18.md`
- PR: https://github.com/Coding-Krakken/NeuroLogix/pull/41
- Issue: https://github.com/Coding-Krakken/NeuroLogix/issues/18

Acceptance Criteria
1. PR #41 remains bounded to the intended Issue #18 file set.
2. Formatter remediation is limited to the two flagged planning files.
3. All required checks are green on PR #41.
4. Validator receives updated evidence with PR gate status and can issue final merge/no-merge decision.

Required GitHub Updates
1. Comment on Issue #18 with start-of-remediation note and bounded-scope intent.
2. Comment on Issue #18 with updated PR #41 required-check and approval snapshots after push.
3. Ensure validator handoff references the refreshed gate evidence.

Validation Expectations
- Preserve deterministic, minimally sufficient validation focused on formatter-gate remediation only.
- Treat any remaining required-check failure as a blocking no-merge condition.
- Run targeted checks first (`prettier --check` on affected files), then confirm PR required-check rollup status.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-18.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-18.md"
```
