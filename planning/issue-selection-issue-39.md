# Issue Selection Record — Issue #39

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`

## Candidate Collection

Open issues considered: `#18`–`#39` (21 total).

Dependency eligibility outcome:
- Eligible by dependency state: `#39`, `#18`
- Ineligible by unresolved dependencies: `#19`–`#37`

Authoritative cycle constraint from prior handoff (`planning/handoff-to-planner-issue-17.md`):
- Issue `#39` remediation is mandatory in the immediate next cycle.
- No deferral of `#39` behind new feature/model scope.

## Eligibility Gates

### Issue #39
- Blocked status: PASS (not blocked)
- Dependencies resolved / safely implementable first: PASS (no dependencies)
- Acceptance criteria implementable with sufficient confidence: PASS (script hardening in root `package.json`)
- Fits PR guardrails: PASS (single-file focused change + targeted validation evidence)
- Safety/compliance constraints satisfiable: PASS

### Issue #18
- Blocked status: PASS (not blocked)
- Dependencies resolved / safely implementable first: PASS (`#17` merged)
- Acceptance criteria implementable with sufficient confidence: PASS
- Fits PR guardrails: PASS
- Safety/compliance constraints satisfiable: CONDITIONAL PASS
- Sequencing constraint from authoritative handoff: DEFER this cycle until `#39` remediation lands.

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
| #39 | 0.90 | 1.00 | 0.95 | 0.95 | 0.95 | 0.95 | 0.95 | 0.95 | 0.80 | **0.940** |
| #18 | 0.78 | 0.60 | 0.55 | 0.70 | 0.90 | 0.85 | 0.75 | 0.85 | 0.70 | **0.729** |

Tie-breakers not required (`#39` wins on primary weighted score).

## Selection Decision

Selected issue: **#39** — Post-merge remediation: deterministic system-state model validation script.

Rationale:
1. Highest weighted score among eligible issues.
2. Mandatory immediate remediation per authoritative handoff from Issue #17 cycle.
3. Directly addresses safety/correctness regression discovered post-merge.
4. Unlocks safe continuation of model-first chain (`#18+`) without governance drift.

## Smallest Safe Vertical Slice

In-scope (strict):
1. Harden root `package.json` script `validate:model:system-state` with explicit missing-file failure guard.
2. Preserve exact model file target path `.github/.system-state/model/system_state_model.yaml`.
3. Verify deterministic pass/fail behavior via targeted commands.
4. Produce planning validation evidence for Issue #39 execution.

Out-of-scope (strict):
- Any runtime/service/product feature work.
- Any unrelated script refactors.
- Any `.github/` framework/governance modifications not required by issue acceptance.

## Risks and Rollback

Primary risk:
- Cross-platform shell differences in npm script behavior (Windows PowerShell vs POSIX shell).

Mitigation:
- Keep command implementation deterministic and portable within existing repository script conventions.
- Validate expected behavior in local environment with explicit pass/fail checks.

Rollback:
- Revert root `package.json` script change if regression detected, then reapply with platform-safe command structure.

## Required Traceability Updates

- Post selection rationale comment on Issue `#39`.
- Post deferral/blocked-context comment on high-ranking non-selected Issue `#18` citing immediate remediation sequencing.
- Builder handoff file with explicit acceptance boundaries and linked evidence context.

## GitHub Traceability Links

- Issue `#39` selection rationale comment:
	- https://github.com/Coding-Krakken/NeuroLogix/issues/39#issuecomment-4030202910
- Issue `#18` deferral rationale comment:
	- https://github.com/Coding-Krakken/NeuroLogix/issues/18#issuecomment-4030203583

## Cycle 2 Addendum — Validator Block Remediation

Date: 2026-03-10
Source: `planning/handoff-to-planner-issue-39.md` and `planning/validation-evidence-issue-39-validator.md`

Re-selection decision: **Issue #39 remains selected**.

Deterministic rationale:
1. Validator reported merge gate failure (`🧹 Lint & Format`) on PR #40.
2. Validator flagged scope drift requiring explicit alignment for `planning/handoff-to-validator-issue-39.md`.
3. Core script behavior is already validated; highest-value safe next slice is minimal remediation only.

Bounded remediation slice for Builder:
1. Fix formatting on changed planning artifacts that fail required checks.
2. Re-align PR scope for `planning/handoff-to-validator-issue-39.md` (remove or policy-justify).
3. Re-run CI and return to validator only after all required checks are green.

Explicit non-goals:
- No further changes to runtime/product/model scope.
- No framework-internal `.github/` modifications.
- No rework of validated script behavior unless regression evidence appears.
