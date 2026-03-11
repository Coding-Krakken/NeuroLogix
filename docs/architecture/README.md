# Architecture Decision Records (ADRs)

This directory contains Architectural Decision Records for the NeuroLogix
platform. ADRs document important architectural decisions, their rationale, and
consequences.

## Canonical Models

- [System State Model (Phase 1)](../../.github/.system-state/model/system_state_model.yaml)

## Index

### Phase 0 - Foundations

- [ADR-001: Monorepo Structure](./ADR-001-monorepo-structure.md)
- [ADR-002: TypeScript and Build System](./ADR-002-typescript-build-system.md)
- [ADR-003: Security-First Architecture](./ADR-003-security-first-architecture.md)
- [ADR-004: Observability Strategy](./ADR-004-observability-strategy.md)
- [Phase 0 Gap Report (Foundations Hardening)](./phase-0-gap-report.md)

### Phase 1 - Data Spine

- [ADR-005: Message Broker Selection](./ADR-005-message-broker-selection.md)
- [ADR-006: Schema Registry and Contracts](./ADR-006-schema-registry-contracts.md)
- [Phase 1 Topic Governance (Bounded Slice)](./phase-1-topic-governance.md)
- [Phase 1 Definition of Ready](./phase-1-definition-of-ready.md)

### Phase 2 - Core Runtime

- [ADR-007: Capability Registry Design](./ADR-007-capability-registry-design.md)
- [ADR-008: Policy Engine with OPA](./ADR-008-policy-engine-opa.md)

### Phase 3 - Edge Adapters and Simulator

- [Phase 3 Edge Adapter + Demo Simulator (Bounded Slice)](./phase-3-edge-adapter-simulator-slice.md)

### Phase 6 - Mission Control UI

- [Phase 6 Mission Control Foundation (Bounded Slice)](./phase-6-mission-control-foundation-slice.md)

### Phase 9 - Multi-Site Federation

- [ADR-009: Multi-Site Federation Architecture](./ADR-009-federation-architecture.md)

## Template

All ADRs should follow this template:

```markdown
# ADR-XXX: Title

## Status

[Proposed | Accepted | Superseded by ADR-XXX | Deprecated]

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing or doing?

## Rationale

Why are we making this change? What are the trade-offs?

## Consequences

What becomes easier or more difficult to do and any risks introduced?

## Alternatives Considered

What other options were considered and why were they not chosen?

## References

Links to external resources, discussions, or related ADRs.
```
