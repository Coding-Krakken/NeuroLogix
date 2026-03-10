# Issue Selection Record — Issue #20 PR-Readiness Recovery

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`
Source Handoff: `planning/handoff-to-planner-issue-20.md`

## Recovery Context

Issue `#20` remains the active in-flight work item.

Validator outcome (from `planning/validation-evidence-issue-20-validator.md`):
- Acceptance-criteria content checks: PASS
- Merge-gate policy checks: FAIL
- Blocking causes:
  1. Issue #20 artifact set is untracked/uncommitted.
  2. No PR exists for branch `issue-20-data-model-phase4`.

Deterministic implication:
- Issue `#21` remains ineligible because dependency `#20` is still OPEN and unmerged.

## Deterministic Selection Decision

Selected active work item: **Issue #20 (bounded PR-readiness remediation)**.

Selection rationale:
1. Authoritative planner handoff explicitly requires continuation on Issue `#20`.
2. Recovery slice is small, safe, and directly resolves merge-gate blockers without changing accepted model content.
3. Dependency unlocking power remains highest because closing `#20` unblocks `#21` and downstream model phases.

## Eligibility Re-Check (Recovery Slice)

- Not marked blocked: PASS
- Dependencies resolved or safely implementable first: PASS (`#19` remains closed)
- Acceptance criteria implementable with sufficient confidence: PASS (already content-validated)
- Fits PR guardrails or can be split safely: PASS (bounded artifact commit + PR creation)
- Safety/compliance constraints satisfiable: PASS (PR workflow + required checks enforced)

## Weighted Scoring Continuity

Eligible set remains unchanged from prior snapshot:
- Eligible issues: `#20`
- Ineligible issues by dependency: `#21`–`#37`

Scoring continuity (from prior planner selection):
- `#20` weighted total: **0.884**
- Tie-breakers: not required (single eligible issue)

## Smallest Safe Vertical Slice

In-scope:
1. Prepare a clean, bounded commit containing only Issue #20 artifacts.
2. Open PR from `issue-20-data-model-phase4` to `main`, linked to Issue #20.
3. Capture required-check status evidence and keep Issue #20 open until merge.
4. Re-dispatch Validator-Merger only after PR exists and required checks are green.

Out-of-scope:
- Runtime/service/product code changes in `packages/` or `services/`.
- New model work from Issue #21+.
- Unrelated refactors, framework changes, or policy bypass.

## Acceptance Boundaries for Builder

Builder completion is valid only when all are true:
1. Committed PR diff is strictly bounded to Issue #20 artifacts.
2. PR is open and linked to Issue #20.
3. Required PR checks are green (or fully reported if still running at handoff time).
4. Updated evidence artifacts are present for validator review.

## Risks and Rollback

Primary risks:
- Scope contamination from unrelated local workspace changes.
- Repeated validator block if PR/check evidence is incomplete.

Mitigations:
- Explicit allow-list of files in commit/PR scope.
- Pre-push `git status` and `git diff --name-only` verification against bounded file set.
- Required-check snapshot captured before validator dispatch.

Rollback:
- Revert the bounded recovery commit(s) from the Issue #20 branch if scope or gate integrity fails.

## Required GitHub Traceability Updates

1. Issue #20 progress comment linking validator blocked decision and remediation plan.
2. Issue #21 dependency-status comment reaffirming block on unresolved #20 (if still applicable).
3. Builder handoff references validator evidence artifacts for auditable continuity.
