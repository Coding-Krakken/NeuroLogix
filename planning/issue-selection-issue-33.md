# Issue Selection Record — Issue #33

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`
Source Handoff: `planning/handoff-to-planner-issue-32.md`

## Baseline Context

- Issue #32 and PR #53 are treated as complete and validated baseline artifacts.
- Validation and closure references:
  - `planning/validation-evidence-issue-32-validator.md`
  - `planning/merge-record-issue-32.md`
  - `planning/closure-record-issue-32.md`

## Candidate Collection

Live open issues snapshot (`gh issue list --state open` refresh):
- `#49`, `#46`, `#45`, `#37`, `#36`, `#35`, `#34`, `#33`

## Eligibility Gates

| Issue | Blocked Status | Dependencies Resolved / Safe First | Implementable Confidence | PR Guardrails Fit | Safety/Compliance Constraints | Eligibility | Notes |
|---|---|---|---|---|---|---|---|
| #49 | PASS | PASS | FAIL | PASS | FAIL | Ineligible | Acceptance requires policy alignment in planner/validator handoff templates under `.github/`, which is out of bounds in normal execution. |
| #46 | PASS | FAIL | PASS | PASS | FAIL | Ineligible | Dependency `#45` remains open; deliverables are primarily `.github/.system-state/...` artifacts. |
| #45 | PASS | PASS | PASS | PASS | FAIL | Ineligible | Required deliverables are `.github/.system-state/...` model files, disallowed in normal execution scope. |
| #37 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#35`, `#36`, `#46`. |
| #36 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#33`, `#34`, `#35`. |
| #35 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#33`, `#34`. |
| #34 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#33`, `#45`. |
| #33 | PASS | PASS | PASS | PASS | PASS | **Eligible** | Dependencies `#30`, `#31`, and `#32` are closed; implementable outside `.github/`. |

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
| #33 | 0.91 | 0.88 | 0.90 | 0.96 | 0.92 | 0.78 | 0.62 | 0.74 | 0.71 | **0.873** |

Tie-breakers not required (single eligible issue).

## Selection Decision

Selected issue: **#33 — Phase 5 Delivery: WMS/WCS Connectors and Dispatch Service**

Rationale:
1. Highest-value issue in the current eligible set after all deterministic gates.
2. Unblocks the implementation chain for `#34`, `#35`, `#36`, and `#37`.
3. Can be delivered as a bounded, reversible vertical slice fully outside `.github/`.
4. Maintains progression from Issue #32 without reopening completed AI-service scope.

## Smallest Safe Vertical Slice (for Builder)

In-scope:
1. Introduce one bounded integration contract path for WMS/WCS command ingestion in `packages/adapters` and/or `packages/schemas`.
2. Implement deterministic idempotent dispatch handling for duplicate command IDs in one service path.
3. Implement retry classification for transient failures and dead-letter routing for non-retriable failures.
4. Add targeted tests that prove idempotency, retry, and dead-letter outcomes.
5. Capture execution evidence in `planning/validation-evidence-issue-33.md`.

Out-of-scope:
- Full production connector feature set across all integration surfaces.
- Mission Control UI, security hardening, performance/chaos suites, or federation scope (`#34+`).
- Any `.github/` modifications during this normal execution lane.
- Unrelated refactors, broad dependency churn, or architecture rewrites.

## Risks and Rollback

Primary risks:
- Scope expansion into full connector orchestration beyond bounded slice.
- Ambiguous retry semantics causing non-deterministic dispatch behavior.

Mitigations:
- Keep one deterministic command path with explicit state transitions and fixtures.
- Constrain retry/dead-letter rules to typed, test-locked behavior.

Rollback:
- Revert bounded Issue #33 PR changeset; no irreversible migrations expected.

## Required GitHub Traceability Updates

- Post issue-selection rationale comment on Issue `#33` with weighted score summary and bounded slice intent.
- Post dependency sequencing context on blocked downstream Issue `#34` referencing `#33` as active unblock path.
- Reference Issue #32 merge and closure artifacts for baseline continuity.

## GitHub Traceability Links

- Issue #33 selection rationale comment:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/33#issuecomment-4032599605
- Issue #34 dependency sequencing comment:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/34#issuecomment-4032599821