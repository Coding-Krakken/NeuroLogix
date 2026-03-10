# Evidence Requirements: Model/Evidence-Only Standard-Lane Exemption

Date: 2026-03-10  
Policy Reference: `NLX-LANE-STD-EXEMPT-001` (`planning/policy-model-evidence-only-lane-rule.md`)

## Required Fields

| Field | Required | Pass Interpretation | Fail Interpretation |
|---|---|---|---|
| `issueId` | Yes | Positive integer and matches active work item | Missing, non-integer, or mismatched issue |
| `prNumber` | Yes | Positive integer and linked to the same issue | Missing or unlinked PR |
| `laneRequested` | Yes | Value is `standard` | Missing or value is not `standard` |
| `sliceType` | Yes | Value is `model-evidence-only` | Missing or different slice type |
| `changedFiles` | Yes | Non-empty array of changed paths | Missing or empty array |
| `pathsConstrained` | Yes | `true` only if every changed path is in `.github/.system-state/**` or `planning/**` | `false` or missing |
| `exemptionFlags.docRatio` | Yes | `true` when exemption requested for doc ratio | Missing |
| `exemptionFlags.preferredLine` | Yes | `true` when exemption requested for preferred line threshold | Missing |
| `checks.lint` | Yes | `pass` | Any non-pass value |
| `checks.test` | Yes | `pass` | Any non-pass value |
| `checks.build` | Yes | `pass` | Any non-pass value |
| `decision` | Yes | `approved` only when all required fields pass | Missing or `rejected` |
| `reviewedBy` | Yes | Non-empty reviewer identifier | Missing or empty |
| `reviewedAt` | Yes | ISO-8601 UTC timestamp | Missing or invalid timestamp |

## Deterministic Decision Logic

Exemption decision is **APPROVED** only if all statements below are true:

1. `laneRequested = standard`
2. `sliceType = model-evidence-only`
3. `pathsConstrained = true`
4. `checks.lint = pass`
5. `checks.test = pass`
6. `checks.build = pass`
7. `exemptionFlags.docRatio = true`
8. `exemptionFlags.preferredLine = true`

If any statement is false, decision is **REJECTED** and full standard-lane thresholds apply.