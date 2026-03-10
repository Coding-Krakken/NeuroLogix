# Prompt: Cycle Reset

Use this prompt to dispatch from Validator-Merger back to Planner-Architect using `.utils/dispatch-code-chat.ps1` with a generated `planning/handoff-to-planner-issue-<id>.md` file.
This file is a template for composing the handoff payload; do not pass this file via `-AddFile`.

## Purpose

Close the current cycle with full traceability and start the next issue selection cycle.

## Required Content

- Merged PR reference
- Post-merge validation outcome
- Open follow-up issues list
- Any new constraints discovered
- Explicit instruction to select next highest-value safe issue

## Required Header

```text
[Context]
Work Item: Issue#<id>
Chain Step: <n>
Target Agent: Planner-Architect
Source: PR#<id>
Status: Cycle complete, continue backlog execution
```

## Final Command Requirement

Final executed command must be:

```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "planner-architect" -PromptFile "planning/handoff-to-planner-issue-<id>.md" -AddFile ".github/templates/merge-record.md,.github/templates/closure-record.md,<merge-context-file>"
```