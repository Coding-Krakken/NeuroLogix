# Refactor

> **Category:** Implementation
> **File:** `implementation/refactor.prompt.md`

---

## Purpose

Restructure existing code to improve quality, readability, performance, or maintainability WITHOUT changing external behavior. All existing tests must continue to pass.

## When to Use

- Tech Lead identifies code quality issues
- Performance Engineer identifies bottlenecks
- During model-code consistency checks
- When extracting reusable patterns
- When reducing duplication

## Inputs Required

- Files to refactor (specific paths)
- Reason for refactoring
- Existing test coverage
- Target pattern or structure

## Outputs Required

1. **Refactored code** (same behavior, better structure)
2. **Updated tests** (if test structure changes, not behavior)
3. **Verification** that all existing tests still pass
4. **Diff summary** of changes

## Refactoring Rules

1. **Never change behavior** — All existing tests must pass unchanged
2. **One refactoring per PR** — Don't mix refactoring with features
3. **Tests first** — Ensure adequate test coverage before refactoring
4. **Small steps** — Series of small, verifiable changes
5. **Run tests after each step** — Catch regressions immediately

## Quality Expectations

- All existing tests pass without modification
- Code is measurably improved (fewer lines, better patterns, etc.)
- No new functionality added
- Canonical patterns followed
- Max 300 lines per file

## Failure Cases

- Existing tests fail → Revert. Refactoring changed behavior.
- No existing tests → Write tests FIRST, then refactor.
- Too many changes → Break into smaller refactorings.

## Evidence Expectations

- Before/after file comparison
- All tests passing (before and after)
- Coverage unchanged or improved
- Quality gate output
