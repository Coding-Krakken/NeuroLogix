# Policy: Standard-Lane Efficiency Handling for Model/Evidence-Only Slices

Date: 2026-03-10  
Policy ID: `NLX-LANE-STD-EXEMPT-001`  
Status: Active (Issue #49)

## Purpose

Define one deterministic rule for how standard-lane efficiency gating is evaluated when a pull request is intentionally limited to model/evidence artifacts.

## Canonical Rule

1. **Default lane remains `standard`.**
2. A PR is classified as **model/evidence-only** only when every changed file is under one or both of these paths:
   - `.github/.system-state/**`
   - `planning/**`
3. If classified as model/evidence-only and required evidence is complete, then standard-lane evaluation applies a **targeted exemption** for:
   - doc-to-code ratio threshold, and
   - preferred-line threshold.
4. All other required checks remain mandatory:
   - `npm run lint`
   - `npm test`
   - `npm run build`
5. If any changed file falls outside the model/evidence-only path set, exemption is denied and full standard-lane thresholds apply.

## Deterministic Decision Matrix

| Condition | Decision |
|---|---|
| All changed files are in `.github/.system-state/**` and/or `planning/**` AND required evidence fields are complete | `standard` lane with targeted exemption (`docRatio`, `preferredLine`) |
| Any changed file outside allowed paths | Full `standard` lane (no exemption) |
| Required evidence fields incomplete | Full `standard` lane (no exemption) |

## Source Context

- Trigger event: Issue #44 / PR #48 lane mismatch for bounded model/evidence-only slice.
- Selection record: `planning/issue-selection-issue-49.md`.
- Validator evidence baseline: `planning/validation-evidence-issue-44-validator.md`.