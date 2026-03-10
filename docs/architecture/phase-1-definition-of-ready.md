# Phase 1 Definition of Ready — Data Spine and Contracts

## Purpose

Define objective, testable entry criteria for Phase 1 work so that each slice is
safe, reviewable, and traceable before implementation begins.

## Scope

Applies to Phase 1 issues and PRs covering schema contracts, broker setup,
contract testing, and topic ACL/security controls.

## Entry Criteria (All Required)

1. **Dependency clarity**
   - All prerequisite issues are closed, or unresolved dependencies are
     explicitly documented as safely ignorable for the selected slice.
2. **Bounded scope statement**
   - The issue execution brief lists in-scope and out-of-scope items, and the
     planned change is within PR size guardrails.
3. **Contract-first artifact target**
   - The slice identifies affected schema/message contract artifacts and their
     owning package/service boundaries.
4. **Acceptance mapping prepared**
   - Every acceptance criterion is mapped to an implementation action and at
     least one validation method.
5. **Risk and rollback defined**
   - The slice has explicit rollback steps and known risks with mitigations.

## Required Quality Gates (Before Validator Handoff)

All gates must pass for changed behavior:

1. `npm run lint`
2. `npm test`
3. `npm run build`

If any gate fails due to unrelated pre-existing issues, the evidence file must
differentiate:

- pre-existing failures, and
- failures introduced by the current slice.

## Test Readiness Expectations

1. Tests are added or updated for changed behavior.
2. Bug fixes include regression coverage when feasible.
3. Validation targets the smallest affected scope first, then broader lane
   checks.

## Evidence Requirements

Each Phase 1 slice must include:

1. Validation evidence artifact under `planning/` with executed command outputs.
2. PR body with:
   - summary,
   - linked issue,
   - testing evidence,
   - risk assessment,
   - follow-up links when needed.
3. Issue/PR traceability comments for dependency and scope decisions.

## Not Ready Conditions

A Phase 1 slice is not ready if any apply:

- Acceptance criteria are ambiguous or not testable.
- Contract ownership is unclear across `packages/` and `services/` boundaries.
- Required gates cannot be run in the current repository state.
- Scope requires governance/CI model changes coupled to skipped issues (#45/#46).

## Ready Decision Rule

Phase 1 work is ready only when all entry criteria are met, no not-ready
conditions apply, and required evidence targets are prepared before coding.
