# Prompt: Builder Handoff

Use this prompt to dispatch from Planner-Architect to Builder using `.utils/dispatch-code-chat.ps1` with a generated `planning/handoff-to-builder-issue-<id>.md` file.
This file is a template for composing the handoff payload; do not pass this file via `-AddFile`.

## Required Header

```text
[Context]
Work Item: Issue#<id>
Chain Step: <n>
Target Agent: Builder
Source: Issue#<id>
Status: Ready for implementation
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

- Create short-lived branch from latest main
- Implement smallest complete slice
- Add/update tests for all changed behavior
- Prepare/update PR with required evidence
- Keep changes bounded and reversible

## Forbidden Actions Checklist

- No `.github/` edits during normal issue execution
- No unrelated refactors
- No direct merge to main
- No human questions during normal execution

## Final Command Requirement

Final executed command must be:

```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-<id>.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,<evidence-file>"
```