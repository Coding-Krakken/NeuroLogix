# Issue Selection Record — Issue #89

Date: 2026-03-10
Agent Mode: `auto-agent`
Repository: `Coding-Krakken/NeuroLogix`

## Candidate Scan

Open issues snapshot (`gh issue list --state open --limit 30`):
- `#89` chore(agent-handoff): restore dispatch-code-chat helper script

## Selection Decision

Selected issue: **#89**

Rationale:
1. It is the only open issue and therefore highest-priority actionable backlog item.
2. It blocks deterministic planner/builder/validator handoff automation.
3. Scope is bounded and directly verifiable with command-level tests.

## Planned Bounded Slice

In scope:
- Add `.utils/dispatch-code-chat.ps1` with `-Mode`, `-TargetAgent`, `-PromptFile`, and `-AddFile` support.
- Implement deterministic path resolution and explicit failures for missing files.
- Add developer-facing usage documentation with a validated command example.
- Capture validation evidence in planning artifacts.

Out of scope:
- Reworking the orchestration framework.
- Recreating missing historical `.github/templates/*` files referenced by older handoff docs.
- Updating all legacy planning files in this issue.
