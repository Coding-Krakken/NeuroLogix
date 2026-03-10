# Issue Selection Record — Issue #20

Date: 2026-03-10 Agent Mode: `planner-architect` Repository:
`Coding-Krakken/NeuroLogix` Source Handoff:
`planning/handoff-to-planner-issue-19.md`

## Closure Continuity from Prior Cycle

Issue #19 closure traceability was re-verified before selection:

- PR #42 merged safely: https://github.com/Coding-Krakken/NeuroLogix/pull/42
- Validator evidence artifact:
  `planning/validation-evidence-issue-19-validator.md`
- Review/merge/closure artifacts confirmed:
  - `planning/review-summary-issue-19.md`
  - `planning/merge-record-issue-19.md`
  - `planning/closure-record-issue-19.md`
- Planner closure continuity comment:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/19#issuecomment-4030810454

## Candidate Collection

Open issues considered from live GitHub snapshot: `#20`–`#37` (18 total).

Data source artifacts refreshed this cycle:

- `planning/open-issues-live-2026-03-10.json`
- `planning/eligibility-snapshot-2026-03-10.json`

Dependency eligibility outcome:

- Eligible by dependency state: `#20`
- Ineligible by unresolved dependencies: `#21`–`#37`

## Eligibility Gates

### Issue #20

- Blocked status: PASS (not marked blocked)
- Dependencies resolved or safely implementable first: PASS (`#19` is closed)
- Acceptance criteria implementable with sufficient confidence: PASS
- Fits PR guardrails or can be split safely: PASS (single model slice + bounded
  evidence updates)
- Safety/compliance constraints satisfiable: PASS

### Highest blocked follow-on issue (#21)

- Gate outcome: INELIGIBLE this cycle due to unresolved dependency `#20`
- Block-context comment posted:
  https://github.com/Coding-Krakken/NeuroLogix/issues/21#issuecomment-4030809735

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

| Issue |   BV |    U | RR/OE |  DUP |   SA |   IC |   SE |    T |   OR | Weighted Total |
| ----- | ---: | ---: | ----: | ---: | ---: | ---: | ---: | ---: | ---: | -------------: |
| #20   | 0.87 | 0.84 |  0.89 | 0.93 | 0.95 | 0.90 | 0.84 | 0.90 | 0.84 |      **0.884** |

Tie-breakers not required (single eligible candidate).

## Selection Decision

Selected issue: **#20** — Model-First: Create Data Model (Phase 4).

Deterministic rationale:

1. Highest-ranked eligible issue under the current dependency graph (single
   eligible candidate).
2. Unlocks immediate successor model-first work (`#21`) and downstream
   dependency chains.
3. Provides smallest safe, reviewable, reversible next slice after Issue #19
   closure.
4. Maintains model-first governance sequence with high implementation
   confidence.

## Smallest Safe Vertical Slice

In-scope (strict):

1. Create `.github/.system-state/data/data_model.yaml` with canonical entities
   and constraints covering implemented and planned schema domains.
2. Encode telemetry/event/schema coverage, tenancy partitioning keys, retention
   classes, and validation-boundary ownership in machine-readable form.
3. Add bounded planning evidence updates for structural validation and
   acceptance mapping for Issue #20.
4. Keep PR size within preferred guardrails and scope-limited to Issue #20
   deliverables.

Out-of-scope (strict):

- Runtime/service implementation in `packages/` or `services/`.
- Any feature, UI, integration, or security execution work from non-selected
  issues.
- Unrelated refactors or broad documentation overhauls.
- Framework internals/policy changes outside Issue #20 acceptance boundaries.

## Risks and Rollback

Primary risks:

- Over-scoping schema-detail beyond minimum acceptance requirements.
- Inconsistent traceability between model sections and acceptance criteria.

Mitigations:

- Enforce strict acceptance-boundary checklist in builder handoff.
- Require deterministic structural validation and explicit coverage mapping in
  validation evidence.

Rollback:

- Revert Issue #20 PR commit set if scope guardrails or structural validation
  gates fail.

## Required Traceability Updates

- Issue #20 selection rationale comment posted:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/20#issuecomment-4030808844
- Issue #21 blocked-dependency context comment posted:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/21#issuecomment-4030809735
- Issue #19 closure continuity linkage comment posted:
  - https://github.com/Coding-Krakken/NeuroLogix/issues/19#issuecomment-4030810454
