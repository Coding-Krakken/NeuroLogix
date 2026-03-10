# Handoff Message Template

```text
[Context]
Work Item: Issue#<id>
Chain Step: <n>
Target Agent: <Planner-Architect|Builder|Validator-Merger>
Source: <Issue#id|PR#id>
Status: <state>

Objective
<clear objective>

Required Actions
- <action 1>
- <action 2>

Forbidden Actions
- <forbidden 1>
- <forbidden 2>

Files to Inspect
- <path>
- <path>

Acceptance Criteria
- <criterion>

Required GitHub Updates
- <update>

Validation Expectations
- <check>

Final Command Requirement
Final executed command must be:
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "<target-agent>" -PromptFile "planning/handoff-to-<target-agent>-issue-<id>.md" -AddFile "<context-file-1>,<context-file-2>"
```