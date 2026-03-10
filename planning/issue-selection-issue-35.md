# Issue Selection Record — Issue #35

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`
Source Handoff: `planning/handoff-to-planner-issue-49.md`

## Baseline Context

- Issue #49 policy clarification merged and remains the active lane-selection baseline for model/evidence-only slices.
- Issue #34 Phase 6 Mission Control UI is merged (`PR #56`).
- Issue #57 Phase 7 security foundation is merged (`PR #58`) and provides the new `@neurologix/security-core` workspace package.
- The next eligible runtime delivery work is expected to continue Issue #35 from the newly merged security foundation.

## Candidate Collection

Live open issues refresh (`gh issue list --state open`):
- `#46`, `#35`, `#37`, `#45`, `#36`

## Eligibility Gates

| Issue | Blocked Status | Dependencies Resolved / Safe First | Implementable Confidence | PR Guardrails Fit | Safety/Compliance Constraints | Eligibility | Notes |
|---|---|---|---|---|---|---|---|
| #35 | PASS | PASS | PASS | PASS | PASS | **Eligible** | Dependencies `#34` and `#44` are resolved; bounded runtime slice can build directly on `@neurologix/security-core`. |
| #36 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependency `#35`. |
| #37 | PASS | FAIL | PASS | PASS | PASS | Ineligible | Blocked by unresolved dependencies `#35`, `#36`, and `#46`. |
| #45 | PASS | PASS | PASS | PASS | FAIL | Ineligible | Deliverables remain under `.github/.system-state/**`, disallowed in the normal execution lane. |
| #46 | PASS | FAIL | PASS | PASS | FAIL | Ineligible | Depends on unresolved `#45`; deliverables remain under `.github/.system-state/**`. |

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
| #35 | 0.92 | 0.88 | 0.91 | 0.83 | 0.90 | 0.89 | 0.84 | 0.87 | 0.85 | **0.888** |

Tie-breakers not required (single eligible issue).

## Selection Decision

Selected issue: **#35 — Phase 7 Delivery: Security and Compliance Hardening**

Rationale:
1. It is the highest-value fully eligible issue after deterministic gating.
2. It directly extends the newly merged Phase 7 security foundation with concrete runtime hardening.
3. A bounded slice can deliver queryable immutable audit evidence for privileged and safety-critical policy-engine actions without widening scope.
4. The slice is small, reviewable, reversible, and improves readiness for later control-verification work.

## Smallest Safe Vertical Slice (Implemented)

In scope:
1. Extend `@neurologix/security-core` audit primitives with chain-entry metadata, integrity reports, and evidence checkpoints.
2. Integrate the `policy-engine` service with immutable audit recording for policy create/update/delete/evaluate/violation paths.
3. Expose query and integrity APIs from `PolicyEngineService` for validator-consumable evidence.
4. Add focused tests covering privileged mutations, blocked evaluations, and audit disablement behavior.
5. Refresh the workspace lockfile after wiring the new workspace dependency.

Out of scope:
- Fleet-wide mTLS rollout across every service.
- Secrets scanning pipeline changes.
- `.github/` model or workflow changes.
- Phase 8/9 runtime delivery.
- Unrelated service refactors.

## Risks and Rollback

Primary risks:
- Module-format mismatch between workspace packages could break runtime imports.
- Audit logging changes could widen into unrelated service behavior.

Mitigations:
- Keep the runtime slice isolated to `security-core`, `policy-engine`, and lockfile wiring.
- Validate both focused workspace commands and repository-level `lint`, `test`, and `build`.

Rollback:
- Revert the Issue #35 bounded slice commit to restore prior `security-core` and `policy-engine` behavior.

## Required GitHub Traceability Updates

- Comment on Issue `#35` with the bounded slice plan and file targets.
- Open a PR linked to Issue `#35` after commit/push.
- Hand off to Validator-Merger with validation evidence and bounded rollback notes.
