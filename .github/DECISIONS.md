# Architecture Decision Records (ADR) Index

> **Version:** 1.0.0 | **Updated:** 2026-02-25

---

## ADR Process

1. **Identify** a decision point (new dependency, pattern change, architecture change)
2. **Draft** an ADR using the template below
3. **Propose** via PR or design discussion
4. **Review** with relevant stakeholders
5. **Decide** — Accept / Reject / Defer
6. **Record** in this index
7. **Implement** (only after acceptance)

---

## ADR Template

```markdown
# ADR-XXXX: Title

**Status:** Proposed | Accepted | Rejected | Superseded | Deprecated
**Date:** YYYY-MM-DD
**Deciders:** [list of people/agents involved]
**Supersedes:** ADR-XXXX (if applicable)

## Context

What is the issue that we're seeing that is motivating this decision?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

### Positive

- What becomes easier?

### Negative

- What becomes harder?

### Risks

- What could go wrong?

## Alternatives Considered

| Alternative | Pros | Cons | Why Not |
| ----------- | ---- | ---- | ------- |
| Option A    | ...  | ...  | ...     |
| Option B    | ...  | ...  | ...     |

## Compliance

- [ ] Consistent with existing models
- [ ] Security implications reviewed
- [ ] Performance implications reviewed
- [ ] Implementation complexity within budget
```

---

## ADR Index

| #        | Title                                                 | Status   | Date       | Category         |
| -------- | ----------------------------------------------------- | -------- | ---------- | ---------------- |
| ADR-0001 | <WEB_FRAMEWORK> as frontend framework                 | Accepted | 2026-01-15 | Architecture     |
| ADR-0002 | <PAYMENT_PROVIDER> APIs as backend integration        | Accepted | 2026-01-15 | Architecture     |
| ADR-0003 | <DEPLOYMENT_PLATFORM> as deployment platform          | Accepted | 2026-01-15 | Infrastructure   |
| ADR-0004 | Zustand for client state management                   | Accepted | 2026-01-20 | State Management |
| ADR-0005 | Tailwind CSS for styling                              | Accepted | 2026-01-20 | Styling          |
| ADR-0006 | Model-first development workflow                      | Accepted | 2026-02-01 | Process          |
| ADR-0007 | Copilot Agent organization for autonomous engineering | Accepted | 2026-02-25 | Process          |
| ADR-0008 | Portfolio site architecture for vanilla single-page v1 | Proposed | 2026-02-26 | Architecture     |
| ADR-0009 | Package-first universal framework adoption             | Accepted | 2026-03-01 | Process          |
| ADR-0010 | Generic checkout slice telemetry contract                  | Accepted | 2026-03-02 | Architecture     |

---

## Decision Categories

- **Architecture** — System structure, component boundaries
- **Infrastructure** — Hosting, CI/CD, monitoring
- **State Management** — Client/server state approach
- **Styling** — CSS methodology, design tokens
- **Security** — Auth, encryption, compliance
- **Process** — Workflow, governance, methodology
- **Dependencies** — New library additions
- **Performance** — Optimization trade-offs

---

## Governance Rules

1. **Mandatory ADR triggers:**
   - New runtime dependency
   - New abstraction layer
   - Change to canonical pattern
   - Infrastructure change
   - Security boundary change
   - Performance trade-off

2. **ADR review requirements:**
   - Solution Architect approval for Architecture/Infrastructure
   - Security Engineer approval for Security
   - Tech Lead approval for Dependencies/Patterns
   - Quality Director veto authority on any ADR

3. **ADR lifecycle:**
   - Proposed → 72h review window
   - Accepted → Implementation allowed
   - Rejected → Document reasoning, close
   - Superseded → Link to replacement ADR
