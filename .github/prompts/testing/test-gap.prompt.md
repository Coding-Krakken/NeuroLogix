# Test Gap Analysis

> **Category:** Testing
> **File:** `testing/test-gap.prompt.md`

---

## Purpose

Identify missing tests across the testing pyramid. Map acceptance criteria to test cases. Find untested code paths, error handlers, and edge cases.

## When to Use

- After implementing a feature
- During QA review
- When coverage is below threshold
- Before production deployment

## Inputs Required

- Source code files
- Existing test files
- Coverage report
- Acceptance criteria

## Outputs Required

```markdown
## Test Gap Report

### Coverage Summary

| Metric     | Current | Target | Status |
| ---------- | ------- | ------ | ------ |
| Statements | 72%     | 80%    | ❌     |
| Branches   | 65%     | 75%    | ❌     |
| Functions  | 78%     | 80%    | ⚠️     |
| Lines      | 73%     | 80%    | ❌     |

### Untested Files

| File                          | Lines | Uncovered | Priority |
| ----------------------------- | ----- | --------- | -------- |
| src/lib/square/client.ts      | 45    | 32        | HIGH     |
| src/app/api/checkout/route.ts | 78    | 45        | HIGH     |

### Missing Test Types

- [ ] Unit: CartStore.removeItem (no test)
- [ ] Component: ErrorBoundary error state (no test)
- [ ] Integration: POST /api/checkout (no test)
- [ ] E2E: Checkout flow (no test)

### Acceptance Criteria → Test Mapping

| Criteria              | Test                 | Status |
| --------------------- | -------------------- | ------ |
| AC-1: Product listing | ProductGrid.test.tsx | ✅     |
| AC-2: Add to cart     | (missing)            | ❌     |
| AC-3: Checkout error  | (missing)            | ❌     |

### Recommended Tests to Write

1. [Highest priority test with file path]
2. [Next test]
3. [Next test]
```

## Quality Expectations

- Every uncovered file identified
- Priority based on risk (checkout > cosmetic)
- Concrete test descriptions (not just "add tests")
- Acceptance criteria mapped to tests

## Failure Cases

- No coverage report → Run `npm test -- --coverage` first
- No acceptance criteria → Request from Product Owner

## Evidence Expectations

- Coverage report numbers
- Specific file and line references
- Acceptance criteria → test traceability matrix
