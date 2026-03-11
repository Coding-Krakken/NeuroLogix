## Summary

Resolves #87

Aligns `recipe-executor` service contracts to canonical recipe schemas in `@neurologix/schemas` and removes duplicated contract definitions.

## Problem

`services/recipe-executor/src/types/index.ts` duplicated canonical recipe contracts that already exist in `packages/schemas/src/recipes/index.ts`, creating drift and inconsistent field semantics.

## Changes

- Replaced duplicated recipe enums/schemas/types in `services/recipe-executor/src/types/index.ts` with canonical imports/re-exports from `@neurologix/schemas`.
- Updated recipe-executor service logic and tests to align with canonical contract fields:
  - ISO timestamp string fields (`createdAt`, `updatedAt`, `startedAt`, `completedAt`, `lastUpdated`)
  - `durationMs` naming for execution/step durations
  - canonical `SafetyCheckType` values in safety violations
- Added/retained package aliasing in `services/recipe-executor/vitest.config.ts` and added root `vitest.config.ts` aliases so root-invoked validation command resolves workspace packages deterministically.
- Added planning traceability artifacts:
  - `planning/issue-selection-issue-87.md`
  - `planning/validation-evidence-issue-87.md`
  - `planning/handoff-to-validator-issue-87.md`

## Validation

- `npm run --workspace @neurologix/recipe-executor test` ✅ (`50 passed`)
- `npm run --workspace @neurologix/recipe-executor type-check` ✅
- `npm run --workspace @neurologix/recipe-executor build` ✅
- `npx tsc --noEmit -p services/recipe-executor/tsconfig.json` ✅
- `npx vitest run services/recipe-executor/src` ✅ (`50 passed`)

## Risk / Rollback

- Risk: root-level test invocations can fail in monorepos if internal package exports are unresolved at runtime.
- Mitigation: root Vitest aliases now map to workspace sources.
- Rollback: revert this PR commit to restore previous service-local contract definitions.