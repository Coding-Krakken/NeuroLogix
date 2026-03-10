# Issue Selection Record — Issue #32

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`
Source Handoff: `planning/handoff-to-planner-issue-31.md`

## Baseline Context

- Issue #31 and PR #52 are treated as complete and validated baseline artifacts.
- Validation and closure references:
  - `planning/validation-evidence-issue-31-validator.md`
  - `planning/merge-record-issue-31.md`
  - `planning/closure-record-issue-31.md`

## Candidate Collection

Live open issues snapshot (`gh issue list --state open` refresh):
- `#49`, `#46`, `#45`, `#37`, `#36`, `#35`, `#34`, `#33`, `#32`

## Eligibility Gates

| Issue | Blocked Status | Dependencies Resolved / Safe First | Implementable Confidence | PR Guardrails Fit | Safety/Compliance Constraints | Eligibility | Notes |
|---|---|---|---|---|---|---|---|
| #49 | PASS | PASS | PASS | PASS | FAIL | Ineligible | Acceptance requires template policy synchronization; normal execution forbids `.github/` edits. |
| #46 | PASS | FAIL | PASS | PASS | FAIL | Ineligible | Dependency `#45` still open; required deliverables are `.github/.system-state/...` files. |
| #45 | PASS | PASS | PASS | PASS | FAIL | Ineligible | Deliverables are fully under `.github/.system-state/...`, which is out of bounds in normal execution. |
| #37 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#35`, `#36`, `#46`. |
| #36 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#33`, `#34`, `#35`. |
| #35 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#33`, `#34`. |
| #34 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#33`, `#45`. |
| #33 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependency `#32`. |
| #32 | PASS | PASS | PASS | PASS | PASS | **Eligible** | Dependencies `#30`, `#31`, and `#44` are closed; implementation can remain outside `.github/`. |

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

| Issue | BV | U | RR/OE | DUP | SA | IC | SE | T | OR | Weighted Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| #32 | 0.93 | 0.80 | 0.84 | 0.92 | 0.90 | 0.64 | 0.46 | 0.72 | 0.66 | **0.829** |

Tie-breakers not required (single eligible issue).

## Selection Decision

Selected issue: **#32 — Phase 4 Delivery: AI Services (ASR/NLU, CV, Optimization)**

Rationale:
1. Highest-value issue in the current **eligible** set after applying all gates.
2. Unlocks downstream integration execution (`#33`) and subsequently `#34`/`#35`/`#36` chain progression.
3. Can be delivered in a bounded, reversible vertical slice strictly outside `.github/`.
4. Preserves scope discipline while continuing post-Issue-31 delivery momentum.

## Smallest Safe Vertical Slice (for Builder)

In-scope:
1. Introduce a minimal AI service scaffold in existing non-`.github/` runtime packages for one service path (ASR/NLU) with typed request/response contract.
2. Add deterministic policy-gated recommendation path proving unsafe recommendations are vetoed.
3. Add degraded-mode fallback behavior for missing/low-confidence inference output.
4. Add targeted tests for: allowed recommendation, vetoed recommendation, and degraded fallback path.
5. Produce execution evidence in `planning/validation-evidence-issue-32.md`.

Out-of-scope:
- Full multi-service production pipelines for CV and optimizer.
- UI, integration connectors, or federation behavior (`#33+`).
- Any `.github/` framework/internal modifications.
- Unrelated refactors or dependency churn not required by the slice.

## Risks and Rollback

Primary risks:
- Over-expansion into full AI platform scope.
- Contract instability across package boundaries.

Mitigations:
- Constrain to one end-to-end AI path with explicit interfaces.
- Use tests to lock deterministic policy veto and fallback semantics.

Rollback:
- Revert bounded Issue #32 PR changeset; no data migration or irreversible side effects expected.

## Required GitHub Traceability Updates

- Post issue-selection rationale comment on Issue `#32` with weighted score and bounded slice intent.
- Post dependency-sequencing note on high-ranking blocked Issue `#33` noting unblock path via `#32`.
- Reference Issue #31 completion artifacts as baseline continuity.

## GitHub Traceability Links

- Issue #32 selection rationale comment:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/32#issuecomment-4032452175
- Issue #33 dependency sequencing comment:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/33#issuecomment-4032453374
