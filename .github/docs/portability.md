# Portability Model

## Portability Principles

- No repository-specific business logic in framework files.
- No stack-specific implementation assumptions.
- Standards and templates focus on universally applicable engineering controls.

## What Makes This Portable

- Policy-first architecture (not tooling-heavy)
- GitHub-native traceability as primary record
- Generic issue/PR forms and operational templates
- Deterministic agent responsibilities and handoffs

## Adaptation Guidance

Permitted adaptations in target repositories:

- adjust labels used by issue forms
- align required checks and branch protections with repository policy
- extend standards with additional controls while keeping core constraints

Disallowed adaptations if portability baseline must be preserved:

- removing deterministic loop
- removing traceability requirements
- weakening merge safety constraints
- enabling normal-run edits to framework internals

## Cost-Aware Operation

- Framework does not require heavy GitHub Actions dependence.
- Validation can be primarily repository policy + existing project checks.
- Additional automation is optional and should remain lightweight.
