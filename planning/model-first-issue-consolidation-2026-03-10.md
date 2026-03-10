# Model-First Issue Consolidation Proposal (2026-03-10)

This document provides ready-to-paste GitHub issue templates to consolidate model-first phases while preserving dependency gating and traceability.

Current recommendation: keep Issue #20 standalone until PR #43 is merged, then apply the three consolidation issues below.

---

## Consolidation Map

- New A (Security/Resilience): combines #21 + #22
- New B (Observability/Traceability/Performance): combines #23 + #24 + #25
- New C (Governance/CI-CD/Roadmap): combines #26 + #27 + #28

---

## New Issue A (replace #21 + #22)

### Title

Model-First: Security and Resilience Baseline (Phases 5-6)

### Labels

`documentation`, `epic`, `model-first`, `track:security`, `phase:model`

### Body

## Objective
Define a unified security and resilience baseline covering trust boundaries, control enforcement, failure containment, and deterministic recovery.

## Scope
Create:
- `.github/.system-state/security/security_model.yaml`
- `.github/.system-state/resilience/resilience_model.yaml`

## TODO Checklist
- [ ] Define identity trust model for users, services, and edge devices.
- [ ] Specify mTLS/service identity strategy and certificate lifecycle.
- [ ] Define RBAC/ABAC policy boundaries and OPA integration points.
- [ ] Document secrets handling, key rotation, and incident response triggers.
- [ ] Map controls to IEC 62443 / ISO 27001 objectives.
- [ ] Create failure mode catalog (dependency outage, stale state, policy denial storms, queue lag).
- [ ] Define blast radius and containment actions per failure class.
- [ ] Define retry budgets, timeouts, circuit-breaking, and dead-letter paths.
- [ ] Specify rollback criteria and <5 minute recovery mechanics.
- [ ] Link failure classes to runbooks and alerts.

## Acceptance Criteria
- [ ] Security model identifies top threats and concrete mitigations.
- [ ] AuthN/AuthZ and service-to-service trust flows are fully described.
- [ ] Control mappings include verification mechanism per control.
- [ ] Failure matrix includes detection, mitigation, and recovery owner.
- [ ] Rollback trigger thresholds are explicit and measurable.
- [ ] Critical paths have fallback behavior defined.

## Deliverables
- [ ] `.github/.system-state/security/security_model.yaml`
- [ ] `.github/.system-state/resilience/resilience_model.yaml`

## Quality Gate Checklist
- [ ] G1 Lint passes
- [ ] G2 Format passes
- [ ] G3 Typecheck passes
- [ ] G4 Tests pass with required coverage
- [ ] G5 Build succeeds
- [ ] G6 Security scan and dependency audit pass
- [ ] G7 Documentation/ADR updates complete
- [ ] G8 PR completeness and linked issue verified
- [ ] G9 Performance budget checked (if relevant)
- [ ] G10 Release/rollback readiness confirmed

## Dependencies / Blockers
- MF-01: https://github.com/Coding-Krakken/NeuroLogix/issues/17
- MF-03: https://github.com/Coding-Krakken/NeuroLogix/issues/19
- MF-04: https://github.com/Coding-Krakken/NeuroLogix/issues/20

## Out of Scope
- Any unrelated refactors not required for this scope

## Definition of Done
- [ ] Scope items completed and demoable
- [ ] Acceptance criteria verified with evidence
- [ ] All quality gates green
- [ ] Linked docs/models updated
- [ ] Rollback or mitigation path documented

---

## New Issue B (replace #23 + #24 + #25)

### Title

Model-First: Observability, Test Traceability, and Performance Budgets (Phases 7-9)

### Labels

`documentation`, `epic`, `model-first`, `track:qa`, `phase:model`

### Body

## Objective
Define a single operability model that unifies telemetry contracts, requirement-to-test traceability, and enforceable performance budgets.

## Scope
Create:
- `.github/.system-state/ops/observability_model.yaml`
- `.github/.system-state/ops/test_traceability_model.yaml`
- `.github/.system-state/perf/budgets.yaml`

## TODO Checklist
- [ ] Define mandatory structured log fields and trace correlation IDs.
- [ ] Define golden signals per service and data pipeline.
- [ ] Define SLI/SLOs for availability, latency, correctness, and freshness.
- [ ] Define dashboard and alert ownership with escalation routing.
- [ ] Define audit trail requirements and retention boundaries.
- [ ] Define trace matrix linking invariants/contracts to test IDs.
- [ ] Define minimum suite composition by phase (unit, integration, contract, e2e, chaos).
- [ ] Define pass/fail evidence artifact format for CI and PR comments.
- [ ] Define gap-reporting and waiver process for uncovered controls.
- [ ] Set coverage thresholds by package/service criticality.
- [ ] Set latency budgets for core service APIs and control loops.
- [ ] Define ingestion throughput targets for telemetry and event streams.
- [ ] Define UI budgets (LCP/INP/CLS and bundle ceilings) for Mission Control.
- [ ] Define benchmark scenario matrix and pass/fail thresholds.
- [ ] Wire budget checks into PR and pre-release gates.

## Acceptance Criteria
- [ ] Each service has minimum metric and alert set documented.
- [ ] SLO math and thresholds are explicit and testable.
- [ ] Log schema includes enough fields for forensics.
- [ ] Critical invariants have at least one mapped automated test requirement.
- [ ] Traceability output format is machine-readable.
- [ ] Coverage expectations are phase-aware and documented.
- [ ] Budgets exist for all critical runtime paths and UI surfaces.
- [ ] Thresholds map to explicit gate actions (warn/block).
- [ ] Budget regressions have deterministic remediation path.

## Deliverables
- [ ] `.github/.system-state/ops/observability_model.yaml`
- [ ] `.github/.system-state/ops/test_traceability_model.yaml`
- [ ] `.github/.system-state/perf/budgets.yaml`

## Quality Gate Checklist
- [ ] G1 Lint passes
- [ ] G2 Format passes
- [ ] G3 Typecheck passes
- [ ] G4 Tests pass with required coverage
- [ ] G5 Build succeeds
- [ ] G6 Security scan and dependency audit pass
- [ ] G7 Documentation/ADR updates complete
- [ ] G8 PR completeness and linked issue verified
- [ ] G9 Performance budget checked (if relevant)
- [ ] G10 Release/rollback readiness confirmed

## Dependencies / Blockers
- MF-04: https://github.com/Coding-Krakken/NeuroLogix/issues/20
- MF-06 (merged): Security/Resilience baseline issue (this consolidation doc: New Issue A)
- MF-03: https://github.com/Coding-Krakken/NeuroLogix/issues/19

## Out of Scope
- Any unrelated refactors not required for this scope

## Definition of Done
- [ ] Scope items completed and demoable
- [ ] Acceptance criteria verified with evidence
- [ ] All quality gates green
- [ ] Linked docs/models updated
- [ ] Rollback or mitigation path documented

---

## New Issue C (replace #26 + #27 + #28)

### Title

Model-First: Dependency Governance, CI/CD Environment Model, and Roadmap Prioritization (Phases 10-12)

### Labels

`documentation`, `epic`, `model-first`, `track:governance`, `phase:model`

### Body

## Objective
Define one governance bundle for dependency intake, release environment controls, and machine-readable roadmap prioritization.

## Scope
Create:
- `.github/.system-state/deps/dependency_governance_model.yaml`
- `.github/.system-state/ci/ci_cd_model.yaml`
- `.github/.system-state/roadmap/roadmap_model.yaml`
- Alignment report for `.github/workflows/ci-cd.yml`
- Prioritized implementation queue artifact

## TODO Checklist
- [ ] Define dependency request template and mandatory justification fields.
- [ ] Define license/security/maintenance review criteria.
- [ ] Define dependency and abstraction budget per phase.
- [ ] Define SBOM and vulnerability remediation cadence.
- [ ] Define exception process requiring ADR and security signoff.
- [ ] Define environment topology (dev/test/staging/prod) and promotion criteria.
- [ ] Define required checks and risk-profile matrix per promotion.
- [ ] Define secrets and environment variable boundary management rules.
- [ ] Define deployment safety controls (canary/blue-green/rollback automation).
- [ ] Define operational evidence required for release signoff.
- [ ] Define scoring dimensions (business impact, risk reduction, dependency unlock, effort, compliance urgency).
- [ ] Map current backlog items to phase and score.
- [ ] Define WIP limits and sequencing rules for parallel work.
- [ ] Define reprioritization trigger conditions.
- [ ] Publish initial prioritized backlog and review cadence.

## Acceptance Criteria
- [ ] Governance model expresses enforceable rules and exception workflow.
- [ ] Review checkpoints exist for license and CVE risk.
- [ ] SBOM/dependency scan integration requirements are explicit.
- [ ] CI/CD model enumerates required checks per risk level.
- [ ] Rollback and deploy approval flow are explicit and testable.
- [ ] Workflow-to-model alignment gaps are documented.
- [ ] Roadmap model contains all active implementation tracks.
- [ ] Each item has score inputs and computed priority.
- [ ] Dependencies and parallelization constraints are explicit.

## Deliverables
- [ ] `.github/.system-state/deps/dependency_governance_model.yaml`
- [ ] `.github/.system-state/ci/ci_cd_model.yaml`
- [ ] `.github/.system-state/roadmap/roadmap_model.yaml`
- [ ] Alignment report for `.github/workflows/ci-cd.yml`
- [ ] Prioritized implementation queue artifact

## Quality Gate Checklist
- [ ] G1 Lint passes
- [ ] G2 Format passes
- [ ] G3 Typecheck passes
- [ ] G4 Tests pass with required coverage
- [ ] G5 Build succeeds
- [ ] G6 Security scan and dependency audit pass
- [ ] G7 Documentation/ADR updates complete
- [ ] G8 PR completeness and linked issue verified
- [ ] G9 Performance budget checked (if relevant)
- [ ] G10 Release/rollback readiness confirmed

## Dependencies / Blockers
- MF-02: https://github.com/Coding-Krakken/NeuroLogix/issues/18
- MF-05 (merged): Security/Resilience baseline issue (this consolidation doc: New Issue A)
- MF-07-09 (merged): Observability/Traceability/Performance issue (this consolidation doc: New Issue B)
- MF-01: https://github.com/Coding-Krakken/NeuroLogix/issues/17

## Out of Scope
- Any unrelated refactors not required for this scope

## Definition of Done
- [ ] Scope items completed and demoable
- [ ] Acceptance criteria verified with evidence
- [ ] All quality gates green
- [ ] Linked docs/models updated
- [ ] Rollback or mitigation path documented

---

## Migration Checklist (GitHub)

Run this sequence after PR #43 (Issue #20) is merged:

1. Create New Issue A, New Issue B, New Issue C from this doc.
2. Add comments to old issues linking replacements:
   - #21, #22 -> New Issue A
   - #23, #24, #25 -> New Issue B
   - #26, #27, #28 -> New Issue C
3. Close old issues as superseded (not done) with explicit note: "Superseded by consolidated model-first issue #<new>."
4. Keep dependency comments in the new issues so eligibility tooling stays deterministic.
5. Regenerate planning snapshots so selection logic sees the new issue graph.

Suggested supersede comment template:

> Superseded by #<new-issue-number> to reduce planning overhead while preserving all original acceptance criteria and deliverables. No scope dropped; checklist items were merged verbatim and dependency gating is retained.
