# Autonomy and Boundaries

## Autonomy Model

- Execution is autonomous across planning, implementation, review, merge, and closure.
- Human role is issue authoring and issue portfolio curation.

## Ambiguity Handling

- Prefer narrowest safe interpretation.
- If unsafe or underspecified, block cleanly and create clarification-needed issue.

## Boundary Rules

- During normal issue execution, agents edit only files outside `.github/`.
- `.github/` framework internals are read-only in normal execution.
- Framework updates require dedicated framework-maintenance issue and separate branch/PR path.

## Safety Overrides

If policy conflict appears, choose the safest compliant action and document rationale.
