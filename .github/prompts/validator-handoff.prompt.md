# Prompt: Validator Handoff

Use this prompt to dispatch from Builder to Validator-Merger using `.utils/dispatch-code-chat.ps1` with a generated `planning/handoff-to-validator-issue-<id>.md` file.
This file is a template for composing the handoff payload; do not pass this file via `-AddFile`.

## Required Header

```text
[Context]
Work Item: Issue#<id>
Chain Step: <n>
Target Agent: Validator-Merger
Source: PR#<id>
Status: Ready for validation
```

## Required Sections

- Objective
- Required Actions
- Forbidden Actions
- Files to Inspect
- Acceptance Criteria
- Required GitHub Updates
- Validation Expectations
- Final Command Requirement

## Required Actions Checklist

- Verify correctness, completeness, maintainability, safety
- Verify test sufficiency and edge case handling
- Enforce required checks and approvals
- Merge only when all policy gates are satisfied
- Run post-merge validation
- Update closure and follow-up records

## Final Command Requirement

Final executed command must be:

```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "planner-architect" -PromptFile "planning/handoff-to-planner-issue-<id>.md" -AddFile ".github/templates/merge-record.md,.github/templates/closure-record.md,<validation-evidence-file>"
```