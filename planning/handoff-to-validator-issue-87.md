[Context]
Work Item: Issue#87
Target Agent: Validator-Merger
Status: ready-for-validation

Objective
Validate and disposition the Issue #87 recipe-executor contract-alignment slice.

Required Actions
1. Confirm duplicated recipe schema/type definitions were removed from `services/recipe-executor/src/types/index.ts` in favor of canonical `@neurologix/schemas` exports.
2. Validate service compatibility updates in:
   - `services/recipe-executor/src/services/recipe-executor.service.ts`
   - `services/recipe-executor/src/services/recipe-executor.service.test.ts`
   - `services/recipe-executor/src/types/index.test.ts`
3. Re-run checks:
   - `npx tsc --noEmit -p services/recipe-executor/tsconfig.json`
   - `npx vitest run services/recipe-executor/src`
   - `npm run --workspace @neurologix/recipe-executor build`
4. Validate evidence completeness in `planning/validation-evidence-issue-87.md`.

Acceptance Criteria
1. No duplicated canonical recipe schema definitions remain in `recipe-executor` types module.
2. Recipe-executor compiles and tests pass.
3. Contract behavior remains safety-first and backward-compatible at service boundary.

Final Command Requirement
```bash
.\.utils\dispatch-code-chat.ps1 -Mode ask -TargetAgent "validator-merger" -PromptFile "planning/handoff-to-validator-issue-87.md" -AddFile ".github/templates/pr-summary.md,.github/templates/review-summary.md,planning/validation-evidence-issue-87.md"
```