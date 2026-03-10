# Prompt: Hotfix Execution

Use this prompt when a production issue requires urgent mitigation.

## Objective

Deliver the narrowest safe fix quickly while preserving traceability and policy compliance.

## Required Actions

1. Confirm incident context and impact.
2. Isolate minimal corrective change.
3. Add targeted regression test where feasible.
4. Open expedited PR with explicit risk and rollback notes.
5. Validate post-merge with critical-path checks.
6. Create hardening follow-up issues if needed.

## Guardrails

- No direct pushes to main.
- No broad refactors.
- No merge with failing required checks.