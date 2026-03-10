# Handoff Standard

## Required Header (Exact)

```text
[Context]
Work Item: Issue#<id>
Chain Step: <n>
Target Agent: <Planner-Architect|Builder|Validator-Merger>
Source: <Issue#id|PR#id>
Status: <state>
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

## Command Rules

- Final executed command in run must be `code chat` dispatch to next agent.
- Dispatch should be executed via `.utils/dispatch-code-chat.ps1` using `-PromptFile` to transport the handoff payload as an attachment.
- Dispatch must include `-TargetAgent` matching the handoff header and include all context files via `-AddFile` (comma-separated values are allowed).
- Do not pass multiline handoff payload directly as a positional `code chat` argument.
- No command may execute after the dispatch command.
