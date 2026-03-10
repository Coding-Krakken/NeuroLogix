# Vertical Slice Implementation

> **Category:** Implementation
> **File:** `implementation/vertical-slice.prompt.md`

---

## Purpose

Implement a complete vertical slice: types, API route, component, state management, tests, and documentation — all in one cohesive unit.

## When to Use

- Engineer is implementing a planned slice
- Building a new feature end-to-end
- Implementing from architecture design

## Inputs Required

- Slice definition from Tech Lead
- Domain model (types/interfaces)
- API contracts (if applicable)
- Component hierarchy
- Acceptance criteria

## Outputs Required

1. **Types** — TypeScript interfaces matching domain model
2. **API Route** — Next.js route handler with Zod validation
3. **Components** — React components with typed props
4. **State** — Zustand store updates (if client state needed)
5. **Tests** — Unit + component tests
6. **Documentation** — JSDoc on public functions

## Implementation Order

```
1. Types/Interfaces (from domain model)
2. Zod schemas (from contracts)
3. API route (backend)
4. API route tests
5. Components (frontend)
6. Component tests
7. State management (if needed)
8. Integration verification
9. Quality gates (lint, typecheck, test, build)
```

## Quality Expectations

- Every file matches domain model
- Every API input validated with Zod
- Every component has typed props
- Every new function has tests
- All quality gates pass
- Max 300 lines per file
- Single canonical pattern used

## Failure Cases

- Domain model undefined → Do NOT implement. Request model from Solution Architect.
- API contract undefined → Do NOT implement API. Request contract.
- Tests fail → Fix code, not tests (unless test is wrong)
- Lint errors → Fix before committing

## Evidence Expectations

- All files created/modified listed
- Test output (all passing)
- Coverage (≥80%)
- Quality gate output (lint, typecheck, build)
- Acceptance criteria checklist

## Example Slice

```
Slice: Product Listing Page
Files:
  - src/types/product.ts (types)
  - src/app/api/products/route.ts (API)
  - src/components/products/ProductCard.tsx (component)
  - src/components/products/ProductGrid.tsx (component)
  - src/app/products/page.tsx (page)
  - src/components/products/__tests__/ProductCard.test.tsx
  - src/components/products/__tests__/ProductGrid.test.tsx
  - src/app/api/products/__tests__/route.test.ts
```
