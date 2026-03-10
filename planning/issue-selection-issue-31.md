# Issue Selection Record — Issue #31

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`
Source Handoff: `planning/handoff-to-planner-issue-30.md`

## Baseline Confirmation

Issue `#30` and PR `#51` are treated as complete baseline for this cycle.

Dependency closure evidence used for sequencing:
- `planning/validation-evidence-issue-30-validator.md`
- `planning/merge-record-issue-30.md`
- `planning/closure-record-issue-30.md`

## Candidate Collection

Live open issues considered:
- `#49`, `#46`, `#45`, `#37`, `#36`, `#35`, `#34`, `#33`, `#32`, `#31`

## Eligibility Gates

Gate criteria applied to each open issue:
1. Not blocked.
2. Dependencies resolved or safely implementable first.
3. Acceptance criteria implementable with sufficient confidence.
4. Fits PR size guardrails or can be split safely.
5. Safety/compliance constraints satisfiable.

### Eligibility Outcomes

- `#31`: **ELIGIBLE**
  - Dependencies: PASS (`#30` is closed)
  - Implementability confidence: PASS (single bounded vertical slice feasible)
  - PR guardrails: PASS (targeted adapter/simulator slice within preferred limits)
  - Safety/compliance satisfiable: PASS

- `#32`: INELIGIBLE (depends on open `#31`)
- `#33`: INELIGIBLE (depends on open `#31` and `#32`)
- `#34`: INELIGIBLE (depends on open `#33` and open `#45`)
- `#35`: INELIGIBLE (depends on open `#33` and `#34`)
- `#36`: INELIGIBLE (depends on open `#31`, `#33`, `#34`, `#35`)
- `#37`: INELIGIBLE (depends on open `#35`, `#36`, `#46`)
- `#45`: INELIGIBLE (normal issue execution cannot satisfy `.github/` model artifact scope safely)
- `#46`: INELIGIBLE (depends on open `#45`; also includes `.github/` model artifact scope)
- `#49`: INELIGIBLE (acceptance requires `.github/` template alignment not executable in normal product issue lane)

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
| #31 | 0.90 | 0.84 | 0.88 | 0.96 | 0.94 | 0.82 | 0.78 | 0.88 | 0.74 | **0.880** |

Tie-breakers: not required.

## Selection Decision

Selected issue: **#31 — Phase 3 Delivery: Edge Adapters and Demo Line Simulator**.

Deterministic rationale:
1. Highest score among eligible issues (sole eligible item).
2. Immediately unblocked by completed Issue `#30` dependency.
3. Highest dependency-unlocking power for downstream runtime/integration chain (`#32`, `#33`, `#36`).
4. Supports a small, reviewable, reversible implementation slice.

## Smallest Safe Vertical Slice

In-scope (strict):
1. Add one bounded edge-ingestion slice for Sparkplug MQTT normalization and connection-state handling.
2. Add a deterministic simulator slice that emits controlled telemetry for one canonical scenario profile.
3. Add targeted tests proving malformed payload rejection and disconnect/reconnect behavior.
4. Add minimal architecture note for phase-3 slice behavior and boundaries.
5. Keep PR within preferred guardrails (target <=25 files / <=600 lines changed).

Out-of-scope (strict):
- Full OPC UA connector implementation.
- Full multi-scenario simulator framework or UI surfaces.
- Any work for Issues `#32+` beyond unavoidable type/interface reuse.
- Any `.github/` framework or template modifications.
- Unrelated refactors in existing services/packages.

## Risks and Rollback

Primary risks:
1. Protocol-normalization assumptions may diverge from downstream consumer expectations.
2. Reconnect/failure behavior can become non-deterministic without explicit state transition tests.

Mitigations:
1. Keep first slice limited to one canonical Sparkplug path and one deterministic simulator profile.
2. Add explicit pass/fail tests for malformed payloads and connection lifecycle transitions.
3. Validate lint/test/build before validator handoff.

Rollback plan:
- Revert Issue `#31` PR to last green `main` if adapter normalization causes regressions.
- Preserve failing scenario evidence and reopen a narrower follow-up issue if required.

## Required Traceability Updates

- Post selection rationale on Issue `#31`, linking Issue `#30` merge/closure baseline evidence.
- Post blocked-dependency sequencing comment on high-ranking non-selected Issue `#32`.
- Keep handoff and validation artifacts in `planning/` for deterministic Builder/Validator chain.