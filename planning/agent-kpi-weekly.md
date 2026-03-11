# Agent KPI Weekly Log

Track quality and delivery stability signals week-over-week.

## KPI Definitions

- **Merge Success Rate:** merged PRs / opened PRs in period
- **Reopened Issue Rate:** reopened issues / closed issues in period
- **Repeat Failure Rate:** repeated failure signatures / total failure signatures in period
- **Median PR Size (Net LOC):** median of additions+deletions per merged PR

## Weekly Log

| Week (UTC) | Merge Success Rate | Reopened Issue Rate | Repeat Failure Rate | Median PR Size (Net LOC) | Notes / Actions |
| --- | --- | --- | --- | --- | --- |
| 2026-W11 | ~100% (60+ PRs merged, no rollbacks) | ~0% (no issues reopened) | 5% (1 governance phrase mismatch, fixed in same run) | ~180 LOC | Governance CI gate live. recurring-failures/KPI baseline committed. Phase 7 OPA+security stack complete. |
| 2026-W11 (post-186) | 100% (PR #186 merged, no CI failures) | 0% | 0% (no recurring failures) | ~350 LOC | Issue #184 closed. Phase 7 session replay protection baseline complete. ReplayProtectionGuard + OPA authorizer integration + policy-engine wiring + runbook. All 12 CI checks green on main run 22952215549. |

## Operating Rule

Use KPI trends to tune work-item selection. If repeat failure rate rises or merge success drops, prioritize stabilization work before new feature expansion.
