# Implementation Policy

## Scope and Design

- Implement the smallest complete vertical slice.
- Preserve backward compatibility unless explicitly authorized.
- Keep design simple and explicit.
- Respect existing architectural and style conventions.

## Allowed Changes

- Product code changes tied to issue scope.
- Required tests for changed behavior.
- Required docs/config/schema/migration updates directly supporting scope.

## Prohibited Changes

- Unrelated cleanup/refactoring.
- Speculative redesign.
- TODO-only incomplete delivery without follow-up issue.
- Framework edits under `.github/` during normal issue execution.

## Commit Policy

Commits must be coherent, intent-based, and traceable.

Examples:

- `feat(1234): add template cloning service and API`
- `fix(5678): correct timezone normalization in next-run calculation`
- `test(5678): add regression coverage for DST rollover`
