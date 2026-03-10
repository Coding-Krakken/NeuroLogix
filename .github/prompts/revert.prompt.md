# Prompt: Revert Execution

Use this prompt when reverting a merged change is safer than forward-fixing in place.

## Objective

Restore system safety rapidly and preserve a full forensic trail.

## Required Actions

1. Identify merge/commit to revert and impact scope.
2. Open revert PR with explicit reason and incident linkage.
3. Run smoke/critical-path checks post-revert.
4. Update issue/PR artifacts with revert rationale.
5. Create follow-up issue for forward-fix if still needed.

## Guardrails

- Keep revert minimal and targeted.
- Preserve traceability links across original PR, revert PR, and follow-up issue.