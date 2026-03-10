# ADR Generation

> **Category:** Architecture
> **File:** `architecture/adr-generation.prompt.md`

---

## Purpose

Generate a complete Architecture Decision Record (ADR) for a significant technical decision, including context, alternatives analysis, and consequences.

## When to Use

- Adding a new dependency
- Changing a canonical pattern
- Modifying infrastructure
- Changing security boundaries
- Making a performance trade-off
- Any decision that affects multiple files/components

## Inputs Required

- Decision to be made
- Context and constraints
- Alternatives considered
- Stakeholder input (if available)

## Outputs Required

Complete ADR following the template:

```markdown
# ADR-XXXX: [Title]

**Status:** Proposed
**Date:** YYYY-MM-DD
**Deciders:** [list]

## Context

[What situation or problem prompted this decision?]

## Decision

[What are we doing?]

## Consequences

### Positive

- [What becomes easier?]

### Negative

- [What becomes harder?]

### Risks

- [What could go wrong?]

## Alternatives Considered

| Alternative | Pros | Cons | Why Not |
| ----------- | ---- | ---- | ------- |
| ...         | ...  | ...  | ...     |

## Compliance

- [ ] Consistent with existing models
- [ ] Security implications reviewed
- [ ] Performance implications reviewed
```

## Quality Expectations

- At least 2 alternatives analyzed
- Concrete pros/cons (not vague)
- Risk assessment included
- Compliance checklist completed

## Failure Cases

- No alternatives considered → Must evaluate at least 2 options
- Decision contradicts existing ADR → Reference and supersede

## Evidence Expectations

- Research data (benchmarks, docs, community feedback)
- Consistency check with existing architecture
- Security and performance impact assessment
