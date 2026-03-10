# Issue Selection Record — Issue #18 Lint-Gate Recovery

Date: 2026-03-10
Agent Mode: `planner-architect`
Repository: `Coding-Krakken/NeuroLogix`
Source Handoff: `planning/handoff-to-planner-issue-18.md`

## Recovery Context

Issue `#18` remains the active in-flight work item with dedicated PR `#41`.

Current validator blocker (from `planning/validation-evidence-issue-18-validator.md`):
- Required check failure: `CI/CD Pipeline / 🧹 Lint & Format`
- Failing files identified by CI:
	- `planning/handoff-to-validator-issue-18.md`
	- `planning/validation-evidence-issue-18.md`

Acceptance-criteria content status remains PASS; only merge-gate compliance is failing.

## Deterministic Selection Decision

Selected active work item: **Issue #18 (bounded remediation on PR #41)**.

Selection rationale:
1. Authoritative planner handoff explicitly locks continuation on Issue `#18` and PR `#41`.
2. Recovery is a small, safe, deterministic slice that removes the current blocking gate.
3. No dependency changes are required; remediation is isolated to formatter-compliance updates.

## Eligibility Re-Check (Recovery Slice)

- Not marked blocked: PASS
- Dependencies resolved or safely implementable first: PASS
- Acceptance criteria implementable with sufficient confidence: PASS
- Fits PR guardrails or can be split safely: PASS (two-file formatting fix)
- Safety/compliance constraints satisfiable: PASS (requires all checks green before re-validation)

## Smallest Safe Vertical Slice

In-scope:
1. Apply formatter-compliant changes only to the two CI-flagged planning files.
2. Push bounded update to existing PR `#41`.
3. Capture refreshed required-check and approval snapshots for validator.
4. Re-dispatch Validator-Merger only after required checks are green.

Out-of-scope:
- Any change to runtime/service/product code.
- Any modification to `.github/.system-state/delivery/delivery_model.yaml` content.
- Any additional issue work, refactor, or policy/framework changes.

## Acceptance Boundaries for Builder

Builder completion is valid only when all are true:
1. PR `#41` diff remains bounded to Issue #18 files.
2. Remediation edits are limited to formatter-fix scope for the two flagged planning files.
3. Required checks on PR `#41` are green and evidence is captured.
4. Validator handoff includes updated gate-status evidence.

## Risks and Rollback

Primary risks:
- Scope creep from accidental formatting or content edits in unrelated files.
- Repeat validator block if check-status evidence is stale or incomplete.

Mitigations:
- Use explicit two-file formatter target.
- Validate working tree before commit/push.
- Record check rollup snapshot immediately before validator dispatch.

Rollback:
- Revert the remediation commit from PR `#41` and re-apply minimal formatter-only changes.

## Required GitHub Traceability Updates

1. Issue #18 comment documenting planner recovery decision and bounded remediation scope.
2. Builder issue/PR evidence update with required-check and approval snapshots.
3. Validator re-dispatch only after green required checks are confirmed.
