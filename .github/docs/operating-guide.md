# Operating Guide

## Operating Model

The loop is fixed and continuous:

1. Planner-Architect Agent selects next issue and creates implementation brief.
2. Builder Agent implements and validates the scoped slice in a PR.
3. Validator-Merger Agent reviews, merges safely, validates post-merge, and dispatches next cycle.

## Human Interaction Model

- Human creates and curates issues.
- Agents run autonomously for normal planning, implementation, review, merge, and closure.

## Daily Execution Pattern

1. Create or refine issues using issue templates.
2. Allow Planner-Architect to select and hand off.
3. Allow Builder to implement and open/update PR.
4. Allow Validator-Merger to enforce gates and merge when safe.
5. Repeat automatically.

## Blocked Path

When issue cannot be safely implemented:

- create blocked record
- create clarification/prerequisite issue
- continue with next eligible issue

## Required Handoff Behavior

- Use strict metadata header.
- Include all required sections.
- Final command must be `code chat` dispatch to next agent with `-m` and `--add-file`.

## Quality Expectations

- Changed behavior must be tested.
- Review must be explicit, evidence-based, and policy-compliant.
- Merge requires all required checks green and required approvals satisfied.
