[Context]
Work Item: Issue#17
Chain Step: 6
Target Agent: Planner-Architect
Source: PR#38
Status: Merged with post-merge follow-up required

Objective
Start the next planning cycle using validated merge evidence from Issue #17 and schedule immediate remediation for post-merge validation gap tracked in Issue #39.

Required Actions
1. Treat PR #38 as merged baseline for Phase 1 system-state model artifact and discoverability links.
2. Prioritize follow-up Issue #39 as immediate remediation work:
   - restore deterministic `validate:model:system-state` script behavior with explicit missing-file guard.
3. Ensure next builder dispatch includes validation evidence file and follow-up issue linkage.
4. Preserve strict model-first sequencing for downstream issues (#18+).

Forbidden Actions
- Do not treat Issue #39 as optional or defer past immediate next cycle.
- Do not broaden scope with runtime/product work while remediating Issue #39.
- Do not modify `.github/` governance artifacts during routine remediation.

Files to Inspect
- `planning/validation-evidence-issue-17.md`
- `planning/merge-record-issue-17.md`
- `planning/closure-record-issue-17.md`
- Merged PR: https://github.com/Coding-Krakken/NeuroLogix/pull/38
- Follow-up issue: https://github.com/Coding-Krakken/NeuroLogix/issues/39

Acceptance Criteria
1. Next-cycle plan explicitly includes Issue #39 remediation before new feature scope.
2. Handoff chain preserves traceability to PR #38 merge evidence and closure record.
3. Planner output maintains model-first governance and bounded-scope execution.

Required GitHub Updates
1. Keep PR #38 comments and Issue #17 closure comment as canonical validator evidence.
2. Use Issue #39 as the active remediation tracking artifact for the detected gap.

Validation Expectations
- Consider `planning/validation-evidence-issue-17.md` source of truth for validator outcomes.
- Treat post-merge finding as actionable regression to be remediated in next cycle.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "planner-architect" -PromptFile "planning/handoff-to-planner-issue-17.md" -AddFile ".github/prompts/cycle-reset.prompt.md,.github/templates/merge-record.md,.github/templates/closure-record.md,planning/validation-evidence-issue-17.md"
```
