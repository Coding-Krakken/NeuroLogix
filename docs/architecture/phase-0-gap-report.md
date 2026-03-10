# Phase 0 Gap Report — Foundations Hardening and Documentation Closure

## Status

Accepted for Issue #29 implementation slice.

## Scope

This report is limited to Phase 0 documentation and readiness gaps that are
independent of skipped governance issues #45 and #46. It does not introduce
runtime features, CI policy changes, or `.github/.system-state/*` expansion.

## Inputs Reviewed

- `README.md`
- `docs/architecture/README.md`
- `docs/architecture/ADR-001-monorepo-structure.md`
- `planning/issue-selection-issue-29.md`
- `planning/eligibility-snapshot-2026-03-10.json`

## Gap 1: Declared vs Actual Repository Structure

`README.md` currently documents a target monorepo structure that is broader than
the repository's current, committed directories.

| Area | Declared in `README.md` | Actual repository state | Gap classification |
|---|---|---|---|
| Top-level apps | `apps/` with `mission-control`, `edge-gateway`, `simulator` | `apps/` not present | Documentation drift |
| Shared packages | `core`, `schemas`, `security`, `observability`, `adapters`, `ai`, `ui` | Only `packages/core`, `packages/schemas` present | Planned-vs-implemented drift |
| Services | `capability-registry`, `policy-engine`, `recipe-executor`, `digital-twin`, `dispatch`, `asr-engine`, `cv-processor` | Only `capability-registry`, `policy-engine`, `recipe-executor`, `digital-twin` present | Planned-vs-implemented drift |
| Infrastructure | `docker`, `kubernetes`, `terraform`, `helm` | Only `infrastructure/docker` present | Planned-vs-implemented drift |
| Docs | `architecture`, `api`, `deployment`, `compliance`, `runbooks` | Only `docs/architecture` present | Planned-vs-implemented drift |
| Tools | `tools/` with `codegen`, `testing`, `ci` | `tools/` not present | Documentation drift |

### Bounded Remediation Recommendation

1. Keep `README.md` as roadmap-oriented structure, but add evidence links per
   phase to distinguish "planned" from "implemented" artifacts.
2. Require each phase-closure slice to include one explicit structure-delta note
   in planning evidence when declared and actual trees diverge.
3. Defer governance-model and system-state updates to dedicated governance
   issues (out of scope for Issue #29).

## Gap 2: ADR Index Completeness vs Files on Disk

`docs/architecture/README.md` indexes ADR-002 through ADR-008, but only
`ADR-001-monorepo-structure.md` is currently present.

| ADR in index | File exists | Gap classification |
|---|---|---|
| ADR-001 | Yes | None |
| ADR-002 | No | Missing artifact |
| ADR-003 | No | Missing artifact |
| ADR-004 | No | Missing artifact |
| ADR-005 | No | Missing artifact |
| ADR-006 | No | Missing artifact |
| ADR-007 | No | Missing artifact |
| ADR-008 | No | Missing artifact |

### Bounded Remediation Recommendation

1. For each missing ADR, either:
   - add the ADR file with current status, or
   - explicitly mark as "planned, not yet authored" in the ADR index.
2. Do not mark Phase 0 architecture documentation complete until the index and
   authored files are consistent.

## Phase 0 Closure Guidance for This Slice

This Issue #29 slice closes the documentation-readiness gap by creating:

- `docs/architecture/phase-0-gap-report.md` (this report)
- `docs/architecture/phase-1-definition-of-ready.md`

and anchoring these artifacts from `README.md` Phase 0 checklist evidence.

## Out of Scope Confirmation

- No runtime code changes in `packages/` or `services/`
- No CI/governance policy changes
- No `.github/.system-state/*` modifications
