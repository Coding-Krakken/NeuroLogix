# Testing Policy

## Core Rules

- All changed behavior must be covered by automated tests unless genuinely impossible.
- Bug fixes require regression tests when feasible.
- Relevant existing tests must continue to pass.
- Choose the lowest-cost test layer that credibly proves behavior.

## Test Layer Guidance

- Unit tests: deterministic behavior and pure logic.
- Integration tests: cross-boundary and contract behavior.
- UI/E2E tests: critical user flows where breakage risk is high.

## Non-Functional Validation

When changes target performance, security, or reliability, include appropriate non-functional evidence.

## Flaky Tests

- Flaky tests are not ignored.
- Address root cause or quarantine with explicit issue and mitigation plan.
