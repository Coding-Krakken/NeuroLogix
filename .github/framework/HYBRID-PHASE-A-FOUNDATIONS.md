# Hybrid Orchestration Phase A Foundations

**Issue:** #6  
**Parent PR:** #5  
**Phase:** A (Foundations)  
**Date:** 2026-02-26

---

## Scope Delivered

- Added `hybrid-orchestrator.ts` skeleton contract with sequential fallback and independent feature toggles.
- Added `context-hierarchy.ts` contract for L1/L2/L3 composition with token estimates and budget enforcement.
- Added `dependency-graph.ts` contract for deterministic DAG validation, cycle path reporting, and wave planning.
- Added foundational hybrid types in `types.ts` (`HybridMode`, flags, context and graph contracts).

---

## Architecture Decisions (Phase A)

1. **Deterministic graph planning by stable node ID ordering**
   - Ensures replayable schedule construction and predictable wave composition.

2. **Independent subsystem feature flags**
   - `hybridOrchestrationEnabled`
   - `parallelGraphEnabled`
   - `memoryHierarchyEnabled`

3. **Memory hierarchy guardrails at contract level**
   - L1/L2/L3 slices always carry token estimates.
   - Composition is budget-aware and marks truncation.
   - Secret/PII patterns are redacted during context composition.

4. **Sequential fallback preserved as source-of-truth mode**
   - Hybrid mode never forces execution when global hybrid flag or mode is disabled.

---

## Acceptance Evidence

### Build/Typecheck

```bash
npm run typecheck
npm run build
```

Result: both commands passed.

### Determinism / Cycle Detection

```bash
npm test -- dependency-graph.test.ts
```

Evidence:
- Acyclic graph produces deterministic waves (`[['a'], ['b', 'c']]`).
- Cyclic graph returns explicit cycle path where first and last node match.

### Context Hierarchy (L1/L2/L3 + token estimates)

```bash
npm test -- context-hierarchy.test.ts
```

Evidence:
- L1/L2/L3 slices are returned with positive token estimates.
- Memory hierarchy can be disabled independently (returns empty slices).

### Independent Subsystem Toggles

```bash
npm test -- hybrid-orchestrator.test.ts
```

Evidence:
- `memoryHierarchyEnabled=true` and `parallelGraphEnabled=false` enables context composition without graph waves.
- Cyclic graphs fail only when `parallelGraphEnabled=true`.
- Global hybrid disable returns sequential fallback.

---

## Notes

- Full repository `npm run lint` currently fails due pre-existing baseline lint debt unrelated to Phase A additions.
- Focused lint on new Phase A source modules passes:

```bash
npx eslint context-hierarchy.ts dependency-graph.ts hybrid-orchestrator.ts --ext .ts
```
