# Issue Selection Record — Issue #30

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`
Source Handoff: `planning/handoff-to-planner-issue-29.md`

## Baseline Confirmation

Issue `#29` and PR `#50` are treated as complete baseline for Phase 0 closure.

Dependency closure evidence used for this cycle:
- `planning/validation-evidence-issue-29-validator.md`
- `planning/merge-record-issue-29.md`
- `planning/closure-record-issue-29.md`

## Candidate Collection

Open issues considered (live snapshot):
- `#49`, `#46`, `#45`, `#37`, `#36`, `#35`, `#34`, `#33`, `#32`, `#31`, `#30`

## Eligibility Gates

Gate criteria applied to each open issue:
1. Not blocked.
2. Dependencies resolved or safely implementable first.
3. Acceptance criteria implementable with sufficient confidence.
4. Fits PR size guardrails or can be split safely.
5. Safety/compliance constraints satisfiable.

### Eligibility Outcomes

- `#30`: **ELIGIBLE**
  - Dependencies: PASS (`#19`, `#20`, `#29` are closed)
  - Implementability confidence: PASS (bounded runtime/data-spine slice)
  - PR guardrails: PASS (small vertical slice feasible)
  - Safety/compliance satisfiable: PASS

- `#31`: INELIGIBLE (depends on open `#30`)
- `#32`: INELIGIBLE (depends on open `#30` and `#31`)
- `#33`: INELIGIBLE (depends on open `#30`, `#31`, `#32`)
- `#34`: INELIGIBLE (depends on open `#30`, `#33`, `#45`)
- `#35`: INELIGIBLE (depends on open `#33`, `#34`)
- `#36`: INELIGIBLE (depends on open `#31`, `#33`, `#34`, `#35`)
- `#37`: INELIGIBLE (depends on open `#35`, `#36`, `#46`)
- `#46`: INELIGIBLE (depends on open `#45`)
- `#45`: INELIGIBLE (safe implementation currently constrained by framework self-protection rules for `.github/`-scoped model artifacts in normal issue execution)
- `#49`: INELIGIBLE (acceptance references template alignment that implies `.github/` framework updates; requires dedicated framework-maintenance handling to execute safely)

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

Only one issue passed all eligibility gates this cycle.

| Issue | BV | U | RR/OE | DUP | SA | IC | SE | T | OR | Weighted Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| #30 | 0.92 | 0.86 | 0.88 | 1.00 | 0.95 | 0.84 | 0.74 | 0.90 | 0.78 | **0.896** |

Tie-breakers: not required.

## Selection Decision

Selected issue: **#30 — Phase 1 Delivery: Data Spine and Contract Enforcement**.

Deterministic rationale:
1. Highest score among eligible issues (sole eligible item).
2. Explicitly newly unblocked after Issue `#29` closure and dependency update.
3. Highest dependency-unlocking power for downstream runtime/integration phases (`#31` onward).
4. Supports smallest safe vertical slice delivery without reopening Phase 0 scope.

## Smallest Safe Vertical Slice

In-scope (strict):
1. Implement one bounded, reviewable slice of Phase 1 data-spine work in runtime code outside `.github/`.
2. Add/adjust targeted tests for changed behavior.
3. Add/update bounded documentation/evidence in `planning/` for Issue `#30`.
4. Keep PR within guardrails (target <=25 files / <=600 lines changed).

Out-of-scope (strict):
- Any `.github/` framework-internal modifications.
- Any work for Issues `#31+` beyond what is strictly required by this slice.
- Broad refactors, dependency churn, or unrelated architecture/model rewrites.

## Risks and Rollback

Primary risks:
1. Contract changes may unintentionally widen impact across schema consumers.
2. Topic governance assumptions may diverge from existing service wiring.

Mitigations:
1. Keep change-set to one vertical slice with explicit acceptance checks.
2. Add targeted test coverage for altered contracts/interfaces.
3. Validate lint/test/build before validator handoff.

Rollback plan:
- Revert Issue `#30` PR to last green `main` if contract regressions appear.
- Preserve failing scenario evidence and reopen with narrower follow-up slice.

## Required Traceability Updates

- Post selection rationale comment on Issue `#30` with dependency closure references to Issue `#29` records.
- Post dependency-block update on Issue `#46` (open dependency on `#45`).
- Post framework-safety block rationale on Issue `#49` for dedicated framework-maintenance routing.