# Operating Standard

## Purpose

Define the universal autonomous operating model for repository delivery using exactly three agents.

At least 80% of operational emphasis is allocated to quality and safety outcomes: correctness, maintainability, testing rigor, review depth, and traceability.

## Canonical Loop

1. Planner-Architect Agent
2. Builder Agent
3. Validator-Merger Agent

Loop repeats continuously.

## Human Participation Model

- Human authors and curates issues.
- Normal execution is autonomous.
- Ambiguity handling:
  - choose narrowest safe interpretation when possible
  - otherwise block cleanly and create clarification-needed issue

## Quality Order of Precedence

1. Correctness
2. Safety
3. Maintainability
4. Test quality and coverage
5. Traceability
6. Scope discipline
7. Speed

## Non-Negotiable Rules

- No direct push to main.
- No merge without PR.
- No merge with failing required checks.
- No branch-protection bypass.
- No unrelated refactors.
- No silent scope expansion.
- No framework edits during normal issue execution.

## Definition of Done

- Acceptance criteria met.
- Tests updated for changed behavior.
- Required checks pass.
- Required review/approval policy satisfied.
- Merged safely.
- Post-merge validation complete.
- GitHub traceability updates complete.
