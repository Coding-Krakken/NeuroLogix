# Issue Selection Record — Issue #19

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`
Source Handoff: `planning/handoff-to-planner-issue-18.md`

## Closure Continuity from Prior Cycle

Issue #18 closure traceability was re-verified before selection:
- PR #41 merged safely: https://github.com/Coding-Krakken/NeuroLogix/pull/41
- Validator evidence artifact: `planning/validation-evidence-issue-18-validator.md`
- Issue #18 validator closure comment: https://github.com/Coding-Krakken/NeuroLogix/issues/18#issuecomment-4030681557
- Planner closure continuity comment: https://github.com/Coding-Krakken/NeuroLogix/issues/18#issuecomment-4030703203

## Candidate Collection

Open issues considered: `#19`–`#37` (19 total).

Dependency eligibility outcome (from `planning/eligibility-snapshot-2026-03-10.json`):
- Eligible by dependency state: `#19`
- Ineligible by unresolved dependencies: `#20`–`#37`

## Eligibility Gates

### Issue #19
- Blocked status: PASS (not marked blocked)
- Dependencies resolved or safely implementable first: PASS (`#17` and `#18` are closed)
- Acceptance criteria implementable with sufficient confidence: PASS
- Fits PR guardrails or can be split safely: PASS (single model artifact + bounded evidence)
- Safety/compliance constraints satisfiable: PASS

### Highest blocked follow-on issue (#20)
- Gate outcome: INELIGIBLE this cycle due to unresolved dependency `#19`
- Block-context comment posted: https://github.com/Coding-Krakken/NeuroLogix/issues/20#issuecomment-4030703397

## Weighted Scoring (Eligible Set)

Scoring model (normalized weights):
- business_value: 0.30
- urgency: 0.15
- risk_reduction_or_opportunity_enablement: 0.15
- dependency_unlocking_power: 0.10
- strategic_alignment: 0.10
- implementation_confidence: 0.10
- size_efficiency: 0.05
- testability: 0.03
- observability_readiness: 0.02

### Scores

| Issue | BV | U | RR/OE | DUP | SA | IC | SE | T | OR | Weighted Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| #19 | 0.86 | 0.80 | 0.88 | 0.92 | 0.95 | 0.90 | 0.82 | 0.90 | 0.82 | **0.871** |

Tie-breakers not required (single eligible candidate).

## Selection Decision

Selected issue: **#19** — Model-First: Create Contracts Model (Phase 3).

Deterministic rationale:
1. Highest-ranked eligible issue under current dependency graph (only eligible candidate).
2. Unlocks direct successor work (`#20`) and downstream model-first chain.
3. Smallest safe, reviewable, reversible next slice after Issue #18 closure.
4. Strong alignment with model-first governance trajectory and acceptance confidence.

## Smallest Safe Vertical Slice

In-scope (strict):
1. Create `.github/.system-state/contracts/contracts_model.yaml` with machine-readable API/event contract model covering current and planned services.
2. Add `.github/.system-state/contracts/api.yaml` (or equivalent contracts artifact) with bounded stub structure aligned to model references.
3. Add/refresh validation evidence in planning artifacts showing structural integrity checks and acceptance mapping.
4. Keep PR size within preferred guardrails and scope-limited to Issue #19 deliverables.

Out-of-scope (strict):
- Runtime/service/product implementation work for phases #30+.
- Unrelated refactors or cross-track documentation overhauls.
- Framework/policy changes outside Issue #19 acceptance boundaries.

## Risks and Rollback

Primary risks:
- Over-scoping contract detail beyond minimum acceptance slice.
- Inconsistent references between `contracts_model.yaml` and companion contract stub artifact.

Mitigations:
- Enforce strict acceptance-boundary checklist in builder handoff.
- Require machine-readable structural validation and explicit file-scope checks.

Rollback:
- Revert Issue #19 PR commit set if model structure or scope guardrails fail validation.

## Required Traceability Updates

- Issue #19 selection rationale comment posted:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/19#issuecomment-4030703300
- Issue #20 blocked-dependency context comment posted:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/20#issuecomment-4030703397
- Issue #18 closure continuity comment posted:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/18#issuecomment-4030703203
