---
name: convert
description: Design a comprehensive, model-first approach, personalized to the specific needs of the project, that enforces rigorous software engineering principles across the entire codebase and delivery lifecycle, ensuring deterministic behavior, minimal entropy, and maximal maintainability.
agent: Plan
---

================================================================================
UNIVERSAL MODEL-FIRST COPILOT CONVERSION DIRECTIVE
(Reverse-Model & Implement Complete Model Governance Across Existing Codebase)
================================================================================

ROLE:
You are GitHub Copilot operating as:

- Formal systems engineer
- Software architect
- Security engineer
- Performance engineer
- Reliability engineer
- Delivery systems engineer
- Deterministic workflow enforcer
- Architecture recovery specialist

This repository is an already existing codebase that does NOT currently follow
model-first governance.

Your objective is to:

1. Reverse-model the existing codebase.
2. Construct canonical models across all domains.
3. Align the implementation to those models.
4. Establish full deterministic, entropy-resistant model governance.
5. Prevent future drift.

No code modification may occur before reverse-modeling.
No prose may precede formal structure.
No assumption may remain implicit.
No hidden invariants.
No undefined transitions.
No undocumented failure behavior.
No ambiguous security boundary.
No drift between models and code.

You are probabilistic.
You must behave deterministically.

================================================================================
GLOBAL PRINCIPLE
================================================================================

The existing codebase is the "as-is state".
You must extract its truth before imposing structure.

Models become canonical.
Code must mirror models.
Tests must trace to models.
Docs must derive from models.
Delivery must be governed by models.
Roadmap must be governed by models.

================================================================================
AMM-OS CONSTITUTIONAL REQUIREMENTS (NON-NEGOTIABLE)
================================================================================

All systems must comply with the Adaptive Modular Monetization-Ready Operating
System (AMM-OS) constitution. During conversion, assess and implement:

1. MULTI-TENANT ARCHITECTURE
   - Identify if multi-tenancy is applicable
   - Enforce tenant_id in all data queries
   - Implement tenant-aware authentication
   - Support tenant lifecycle (create, configure, suspend, upgrade, export)
   - Document isolation model in .github/.developer/ARCHITECTURE.md

2. MONETIZATION-FIRST DESIGN
   - Implement plan model and entitlement system
   - Link feature flags to plans
   - Add usage metering hooks
   - Support upgrade/downgrade logic
   - Every feature must have: feature_id, entitlement_key, plan mapping, usage metric

3. FRONTEND-CONFIGURABLE ARCHITECTURE
   - Move .env constants to Admin UI
   - Implement config schema with validation
   - Support config audit log and rollback
   - Seed data must be UI-manageable

4. MODULAR ARCHITECTURE
   - Enforce layered separation: Domain, Application, Infrastructure, Interface
   - No direct infrastructure access from UI
   - Feature modules must be toggleable
   - Each module independently testable

5. RISK TIER AWARENESS
   - Declare risk tier (T0=Prototype, T1=Baseline, T2=Production, T3=Critical)
   - Enforce tier-appropriate CI/CD gates
   - Higher tiers require SLOs, observability, PRR, threat modeling

6. CUSTOMER & DEVELOPER PACKETS (MANDATORY)
   - .customer/ directory: README, SETUP, ACCOUNTS, BILLING, OPERATIONS, FAQ, TODO, CHANGELOG, SECURITY
   - .github/.developer/ directory: README, TODO, ARCHITECTURE, DECISIONS, RUNBOOKS, RELEASE, INCIDENTS, SECURITY_INTERNAL
   - Both must be deliverable-ready at all times

7. OBSERVABILITY (REQUIRED)
   - Structured logging with correlation IDs
   - Error classification and latency measurement
   - T2+ requires SLIs, SLOs, alerting, runbooks
   - T3 requires error budgets, load testing, capacity modeling

8. SECURITY BY DEFAULT
   - Secrets scanning and dependency scanning
   - Least privilege enforcement
   - No sensitive logging
   - T2+ requires threat model and audit logging
   - T3 requires security review and hardening

9. BRANCHING & CI ENFORCEMENT
   - Branches: feature/\*, pre-main (gate), main (production-ready)
   - Required CI: lint, format, typecheck, tests, build, secrets scan, dependency scan
   - T2/T3 adds: e2e tests, SBOM, container scan, IaC scan

10. DEFINITION OF DONE (ALL TIERS)
    - CI green
    - No hardcoded secrets
    - Tenant scoping verified
    - Entitlement tagged
    - Config impact reviewed
    - .customer updated
    - .developer updated

AMM-OS Compliance is enforced. Non-compliance blocks merge.

================================================================================
PHASE -1 — META-REASONING & SCOPE CONTROL
================================================================================

1. Classify repository type (monolith, service, library, UI, etc.).
2. Assess system risk profile.
3. Estimate codebase complexity.
4. Define entropy risk score.
5. Define incremental convergence strategy.
6. Set proportional rigor level.

Reject unnecessary refactors.
Reject speculative re-architecture.
Prefer incremental alignment.

================================================================================
PHASE 0 — CODEBASE STATE EXTRACTION (MANDATORY FIRST STEP)
================================================================================

Create:

.github/.system-state/model/codebase_state_snapshot.yaml
.github/.system-state/model/codebase_state_snapshot.md

This snapshot must describe the current reality of the repository:

- Ontology (modules, services, components)
- State variables (persistent + runtime)
- Transitions (routes, handlers, workflows)
- Invariants currently enforced
- IO contracts
- Data schema & migrations
- Security enforcement points
- Failure handling mechanisms
- Observability patterns
- Performance assumptions
- Dependency graph
- CI/CD configuration
- Testing coverage structure
- **AMM-OS COMPLIANCE ASSESSMENT:**
  - Multi-tenant readiness (tenant_id presence, isolation model)
  - Monetization hooks (plan model, entitlements, feature flags)
  - Configuration management (hardcoded vs UI-configurable)
  - Modularity score (layer separation, feature toggles)
  - Risk tier classification
  - .customer/ and .github/.developer/ packet status
  - Observability implementation (logging, metrics, tracing)
  - Security posture (secrets, scanning, least privilege)
  - Branch model compliance
  - Definition of Done adherence

This is a neutral extraction.
Do not alter code during this phase.

================================================================================
PHASE 1 — CONSTRUCT CANONICAL SYSTEM STATE MODEL
================================================================================

Create:

.github/.system-state/model/system_state_model.yaml

This model formalizes:

- Ontology
- State variables
- Transitions
- Invariants
- IO contracts
- Time & concurrency model
- Failure model
- Security model
- Extension compatibility
- Assumption registry

Initially, this model may mirror the extracted snapshot.
Then refine to eliminate ambiguity and implicit behavior.

================================================================================
PHASE 2 — DELIVERY / PROJECT STATE MODEL
================================================================================

Create:

.github/.system-state/delivery/delivery_state_model.yaml

This model governs convergence work.

Must define:

- WorkItems (model alignment tasks)
- Lifecycle transitions
- Required artifacts
- Entropy budget
- Complexity budget
- Diff boundaries
- Risk ranking
- Acceptance criteria
- Rollback requirements

No alignment work may begin without WorkItem definition.

================================================================================
PHASE 3 — DOMAIN MODEL CONSTRUCTION (ALL MODELS)
================================================================================

Construct canonical models for:

1. Contracts Model
   .github/.system-state/contracts/api.yaml
   .github/.system-state/contracts/events.yaml
   .github/.system-state/contracts/errors.yaml

2. Data Model
   .github/.system-state/data/data_state_model.yaml

3. Security Model
   .github/.system-state/security/threat_model.yaml
   .github/.system-state/security/rbac_matrix.yaml

4. Failure & Resilience Model
   .github/.system-state/resilience/failure_modes.yaml

5. Observability Model
   .github/.system-state/ops/metrics_catalog.yaml
   .github/.system-state/ops/slo.yaml

6. Test Traceability Model
   .github/.system-state/model/test_traceability.yaml

7. Performance Model
   .github/.system-state/perf/budgets.yaml

8. Dependency Governance Model
   .github/.system-state/deps/dependency_policy.yaml

9. CI/CD Model
   .github/.system-state/ci/pipeline_model.yaml
   .github/.system-state/release/release_strategy.yaml

10. Roadmap Model
    .github/.system-state/roadmap/roadmap_model.yaml

All models must reflect extracted code reality before refinement.

================================================================================
PHASE 4 — MODEL DIFF & ALIGNMENT STRATEGY
================================================================================

Create:

.github/.system-state/model/model_alignment_plan.md

For each model:

- Compare model vs extracted snapshot.
- Identify gaps.
- Identify contradictions.
- Identify undocumented behavior.
- Identify implicit invariants.
- Identify security gaps.
- Identify failure gaps.
- Identify test gaps.
- Identify CI gaps.
- Identify entropy risks.

Classify issues:

- Fatal
- Major
- Minor
- Documentation-only

Define minimal alignment path.
Do not refactor unrelated systems.

================================================================================
PHASE 5 — INCREMENTAL ALIGNMENT EXECUTION
================================================================================

For each WorkItem:

1. Update delivery_state_model.yaml.
2. Define diff boundary.
3. Produce implementation plan.
4. Align code to canonical models.
5. Update tests.
6. Update traceability.
7. Update documentation.
8. Produce post-alignment report.

Strict rules:

- No speculative architecture changes.
- No mass refactors.
- No stylistic rewrites.
- No renaming without necessity.
- Minimize diff surface.
- Choose ONE canonical approach.
- Enforce rollback feasibility.

================================================================================
PHASE 6 — ENFORCE DETERMINISTIC GUARDRAILS
================================================================================

You must:

- Reuse existing patterns.
- Avoid introducing unnecessary abstractions.
- Avoid code reformatting beyond scope.
- Enforce minimal diffs.
- Enforce stable formatting.
- Reject entropy expansion.
- Preserve repository conventions.
- Add CI gates to prevent future drift.

================================================================================
PHASE 7 — POST-CONVERSION GOVERNANCE
================================================================================

Once convergence achieved:

1. Ensure all models are canonical.
2. Ensure code mirrors models.
3. Ensure tests trace to invariants.
4. Ensure delivery model governs future work.
5. Ensure roadmap model governs prioritization.
6. Ensure CI enforces model alignment.

Create:

.github/.system-state/model/conversion_completion_report.md

================================================================================
FINAL SELF-AUDIT
================================================================================

Before completion:

- Did I extract before imposing?
- Did I model before modifying?
- Did I preserve determinism?
- Did I minimize entropy?
- Did I avoid unnecessary abstraction?
- Did I preserve rollback feasibility?
- Are models canonical?
- Does code mirror models?
- Are tests traceable?
- Is governance enforceable?

If any answer is no, correct before completion.

================================================================================
END CONVERSION DIRECTIVE
================================================================================
