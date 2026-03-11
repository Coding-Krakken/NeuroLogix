# Issue Selection Record — Issue #87

Date: 2026-03-10
Agent Mode: `auto-agent`
Repository: `Coding-Krakken/NeuroLogix`

## Candidate Scan

Open issues snapshot (`gh issue list --state open --limit 30`):
- `#87` refactor(recipe-executor): align service type contracts with canonical `@neurologix/schemas` recipes

## Selection Decision

Selected issue: **#87**

Rationale:
1. It is the only open issue and therefore highest-priority actionable backlog item.
2. It directly reduces model/code contract drift in a safety-critical runtime surface (`recipe-executor`).
3. Scope is bounded and testable with existing service test suites.

## Planned Bounded Slice

In scope:
- Replace duplicated recipe schema/type definitions in `services/recipe-executor/src/types/index.ts` with canonical imports/re-exports from `@neurologix/schemas`.
- Align service/test code with canonical timestamp and duration contracts.
- Ensure both workspace-level and root-invoked validation commands pass deterministically.

Out of scope:
- Feature changes to recipe execution behavior beyond contract alignment.
- Broad runtime refactors outside `services/recipe-executor`.
- CI policy redesign beyond minimal compatibility fix needed for required validation command.
