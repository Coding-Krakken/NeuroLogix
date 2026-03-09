# Hybrid Orchestration Phase B Parallel Execution Plan

**Issue:** #6  
**Parent PR:** #5  
**Phase:** B (Parallel Execution Engine)  
**Date:** 2026-02-26  
**Branch:** `feat/hybrid-memory-hierarchy-parallel-graph`

---

## Objective

Implement Phase B with strict 1:1 mapping to acceptance criteria in:
- `.github/framework/HYBRID-MEMORY-HIERARCHY-PARALLEL-GRAPH-PLAN.md`
- `.github/issue-bodies/hybrid-phase-b.md`

No Phase C/D/E scope is included.

---

## Acceptance Criteria Mapping (1:1)

| AC ID | Required Outcome | Vertical Slice(s) | Evidence |
|---|---|---|---|
| B1 | Independent nodes run in parallel; dependent nodes wait correctly | S1 + S2 | Mixed DAG integration tests with wave barriers |
| B2 | Max concurrency strictly enforced | S2 | Cap-enforcement tests (global + per-priority) |
| B3 | Timeout + retry behavior follows configured policy | S3 | Timeout/retry tests + deterministic attempt timeline assertions |
| B4 | Structured events emitted for start/success/failure/timeout | S4 | Event schema tests + ordered lifecycle snapshots |

---

## Vertical Slices

### S1 — Deterministic Wave Scheduler

**Deliverables**
- `wave-scheduler.ts` (new)
- Add schedule types in `types.ts` (new Phase B contracts only)
- Unit tests in `__tests__/wave-scheduler.test.ts`

**Behavior**
- Input: validated DAG nodes (`id`, `dependsOn`, `priority`)
- Output: deterministic execution plan with ordered waves
- Ordering rule (deterministic):
  1. wave index ascending
  2. priority weight (`P0 > P1 > P2 > P3`)
  3. node id lexicographic ascending

**Invariants**
- A node is schedulable iff all dependencies have terminal success state.
- A node appears in exactly one wave.
- Same graph + config => byte-identical wave plan snapshot.

---

### S2 — Parallel Dispatch Controller + Concurrency Caps

**Deliverables**
- `parallel-dispatch-controller.ts` (new)
- Concurrency config in `types.ts`:
  - `maxParallelAgents`
  - `perPriorityCaps` (`P0..P3`)
- Integration tests in `__tests__/parallel-dispatch-controller.test.ts`

**Behavior**
- Executes each wave with bounded parallelism.
- Applies strict cap: active tasks must never exceed min(global cap, priority cap).
- Dependent nodes cannot start until predecessor nodes reach success.

**Concurrency Semantics (explicit)**
- Admission control is checked before dispatch.
- If cap reached, node remains queued (no speculative dispatch).
- Queue ordering inside a wave is deterministic by rule from S1.
- No priority starvation inside same wave because every node is reevaluated after each completion in deterministic order.

---

### S3 — Timeout + Retry Policy Engine

**Deliverables**
- Policy module integrated in `parallel-dispatch-controller.ts` (or helper file if needed)
- Retry policy types in `types.ts`:
  - `maxAttempts`
  - `attemptTimeoutMs`
  - `retryBackoffMs`
  - `retryJitter: 'none'` (Phase B deterministic default)
- Tests in `__tests__/parallel-dispatch-retry-timeout.test.ts`

**Failure Semantics (explicit)**
- Attempt states: `started -> success | failure | timeout`.
- Node states: `pending | running | succeeded | failed | timed_out | exhausted | blocked`.
- `exhausted` = attempts reached `maxAttempts` without success.
- Descendant handling:
  - if predecessor `succeeded`, continue normal scheduling
  - if predecessor `failed|timed_out|exhausted`, descendants become `blocked`
- Retry timeline uses deterministic formula:
  - delay for attempt `n` (2..N): `(n - 1) * retryBackoffMs`

---

### S4 — Structured Lifecycle Events

**Deliverables**
- Event emitter contract in `types.ts`
- Emission in scheduler/dispatcher runtime
- Tests in `__tests__/parallel-dispatch-events.test.ts`

**Event Requirements**
- Required event types: `dispatch_start`, `dispatch_success`, `dispatch_failure`, `dispatch_timeout`
- Required fields:
  - `runId`, `nodeId`, `waveIndex`, `attempt`, `priority`, `timestamp`, `durationMs`, `status`
- Ordering requirement:
  - events are append-only with deterministic sequence number `seq`
  - same deterministic run yields same logical order (`seq`), independent of wall-clock timestamp

---

## Sequencing Plan

1. **S1 first** (deterministic schedule contract baseline)
2. **S2 second** (parallel execution bounded by S1 output)
3. **S3 third** (policy semantics layered on dispatcher)
4. **S4 fourth** (instrument lifecycle events over stable runtime)
5. **Phase B evidence run** (targeted tests + typecheck + build)

Dependency rule: no slice may bypass S1 ordering contract.

---

## Deterministic Replay Evidence Strategy

Phase B replay evidence must prove deterministic planning and runtime semantics.

### Artifacts

- `phase-b-schedule.snapshot.json` (expected wave plan for canonical synthetic DAG)
- `phase-b-events.snapshot.json` (ordered lifecycle events with `seq`)
- `phase-b-attempts.snapshot.json` (attempt timeline for timeout/retry scenario)

### Replay Controls

- Fixed `runId` in test harness
- Frozen clock in tests for deterministic duration/timestamp assertions
- No jitter in Phase B (`retryJitter='none'`)
- Stable input ordering by node id

### Required Replay Assertions

1. Same graph/config produces identical wave plan snapshot.
2. Same failure injection script produces identical event `seq` ordering.
3. Retry attempt counts and backoff delays match policy exactly.

---

## Test + Validation Commands (Phase B)

From `.github/framework`:

```bash
npx jest __tests__/wave-scheduler.test.ts __tests__/parallel-dispatch-controller.test.ts __tests__/parallel-dispatch-retry-timeout.test.ts __tests__/parallel-dispatch-events.test.ts --runInBand
npm run typecheck
npm run build
npx eslint wave-scheduler.ts parallel-dispatch-controller.ts types.ts --ext .ts
```

Note: repository-wide lint debt remains out of scope; focused lint on touched files is required.

---

## Complexity and Scope Control

- Estimated complexity: **18 points**
  - S1: 4
  - S2: 6
  - S3: 5
  - S4: 3
- No new dependency additions required.
- No speculative abstractions; only Phase B contracts and runtime.
- Keep files under 300 lines; split helpers only when needed for line limit or testability.

---

## Done Criteria for Tech Lead Handoff

- [x] Slices mapped 1:1 to Phase B acceptance criteria.
- [x] Determinism replay evidence strategy defined.
- [x] Concurrency and failure semantics explicitly specified.
- [x] Sequencing and validation plan defined with no model drift.
