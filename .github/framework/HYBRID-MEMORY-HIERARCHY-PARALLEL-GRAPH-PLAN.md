# Hybrid Orchestration Implementation Plan

> **Title:** Memory Hierarchy + Parallel Graph Orchestration
> **Owner:** Chief of Staff (`00-chief-of-staff`)
> **Status:** Ready for Execution
> **Priority:** P0
> **Target Branch:** `feature/<WORK_ITEM_ID>-<WORK_ITEM_SLUG>`
> **Date:** 2026-02-26

---

## 1) Executive Intent

Implement a production-grade hybrid orchestration mode that combines:

1. **Memory Hierarchy**
   - L1: Minimal task context in-session
   - L2: GitHub Issue/PR comment handoff cache
   - L3: Canonical files (ADRs, plans, architecture docs)
2. **Parallel Graph Execution**
   - DAG-based routing with dependency-aware wave execution
   - Parallel dispatch for independent work items
   - Deterministic merge/join semantics and gate enforcement

This hybrid mode MUST reduce token spend, improve throughput, preserve auditability, and remain fully compatible with existing GitHub-native handoff workflow.

---

## 2) Non-Negotiable Constraints

1. Maintain model-first governance and quality gates G1-G10.
2. No external long-running service dependency; execution remains CLI/library based.
3. Every dispatch must preserve traceability (Issue/PR comment URL + agent + timestamp).
4. No bypass of security, compliance, or Definition-of-Done checks.
5. Feature flag rollout only; no forced cutover.
6. Deterministic behavior under retries, partial failures, and restarts.

---

## 3) Scope

### In Scope

- `HybridOrchestrator` runtime mode
- Context tiering and retrieval policy
- Dependency graph builder and wave scheduler
- Parallel dispatch controller with concurrency limits
- Aggregated result collector and reconciliation
- Retry/timeout/circuit-breaker policies
- Telemetry for token usage, latency, failure rate, and savings
- Rollout flags and kill switch
- Comprehensive tests + synthetic scenarios

### Out of Scope

- Replacing GitHub handoff mechanism
- Removing existing sequential mode
- UI dashboard redesign beyond required metrics extension
- Agent role taxonomy redesign

---

## 4) Target Architecture

### 4.1 Memory Hierarchy

- **L1 (Hot Context):**
  - Max 20K token budget per agent task
  - Includes active work item metadata, explicit acceptance criteria, and unresolved blockers
  - TTL: per dispatch session

- **L2 (Warm Context):**
  - GitHub handoff comments and summaries
  - Filtered fetch by Issue/PR + agent chain + recency
  - Max comment fetch window configurable (`MAX_L2_COMMENTS`)

- **L3 (Cold Context):**
  - Canonical docs and source-of-truth files (`.system-state`, ADRs, architecture docs)
  - On-demand targeted retrieval only (never full repo scan by default)

### 4.2 Parallel Graph

- Build DAG from task decomposition:
  - Node: work package (agent, scope, inputs, outputs, AC)
  - Edge: hard dependency
- Execute by waves:
  - Wave `n` starts when all predecessors of its nodes are complete
  - Nodes in same wave execute concurrently up to configured limit

### 4.3 Merge/Join Semantics

- A join node consumes outputs from prior nodes using deterministic resolver:
  - conflict policy (`fail-fast | merge-with-rules | manual-escalation`)
  - priority policy (`security > architecture > implementation > docs`)

---

## 5) Delivery Phases

### Phase A — Foundations (Week 1)

### Deliverables

- `hybrid-orchestrator.ts` (skeleton + interfaces)
- `context-hierarchy.ts` (L1/L2/L3 provider contract)
- `dependency-graph.ts` (node/edge model + validation)
- Feature flags:
  - `hybrid_orchestration_enabled`
  - `parallel_graph_enabled`
  - `memory_hierarchy_enabled`

### Acceptance Criteria

- Build/typecheck passes.
- Graph model validates acyclic input and reports cycle path.
- Context loader can return L1 + L2 + L3 slices with token estimates.
- Flags can disable each subsystem independently.

---

### Phase B — Parallel Execution Engine (Week 2)

### Deliverables

- `wave-scheduler.ts`
- `parallel-dispatch-controller.ts`
- Concurrency settings (`MAX_PARALLEL_AGENTS`, per-priority caps)
- Deterministic ordering for wave creation and scheduling

### Acceptance Criteria

- Independent nodes run in parallel; dependent nodes wait correctly.
- Max concurrency is strictly enforced.
- Timeout + retry behavior follows configured policy.
- Dispatcher emits structured events for start/success/failure/timeout.

---

### Phase C — Memory Policy Integration (Week 3)

### Deliverables

- Budget-aware context composition
- Context trimming policy (`hard cap`, `priority pruning`, `critical pinning`)
- L2/L3 retrieval with selective fetch and caching
- Context provenance block in each dispatch prompt

### Acceptance Criteria

- Token budget stays below configured hard cap per dispatch.
- Prompt includes provenance (what came from L1/L2/L3).
- On cache miss, fallback behavior is deterministic and logged.
- No full-context blowup in synthetic long-chain tests.

---

### Phase D — Reliability & Recovery (Week 4)

### Deliverables

- Checkpointing between waves
- Idempotent replay for failed wave/node
- Circuit breaker for repeated agent/tool failures
- Escalation path to Chief of Staff with actionable diagnostics

### Acceptance Criteria

- Restart from checkpoint works with no duplicate side effects.
- Replay of failed node does not duplicate completed sibling outputs.
- Circuit breaker opens and closes per thresholds.
- Post-mortem payload includes root cause and remediation hints.

---

### Phase E — Telemetry, Guardrails, Rollout (Week 5)

### Deliverables

- Hybrid-specific telemetry fields:
  - `token_input`, `token_output`, `token_savings_estimated`
  - `wave_count`, `parallelism_ratio`, `critical_path_ms`
  - `cache_hit_l2`, `cache_hit_l3`
- Quality gate integration for hybrid mode
- Rollout playbook and kill switch validation

### Acceptance Criteria

- Metrics emitted for every hybrid run.
- Dashboard/summary can compare sequential vs hybrid.
- Rollout supports `5% -> 25% -> 50% -> 100%` progression.
- Kill switch reverts to sequential within one execution cycle.

---

## 6) Detailed Acceptance Criteria Matrix

| Category | Criteria | Threshold | Verification |
|---|---|---:|---|
| Correctness | DAG execution respects dependencies | 100% | 200 synthetic DAG tests |
| Determinism | Same inputs produce same schedule order | 100% | replay test suite |
| Performance | End-to-end duration improvement vs sequential | >=30% median | benchmark harness |
| Token Efficiency | token reduction vs sequential | >=35% median | telemetry comparison |
| Reliability | successful completion under transient failures | >=99% | chaos tests |
| Recovery | checkpoint restart success | 100% | fault injection suite |
| Observability | required metrics present | 100% runs | schema validator |
| Security | no secret leakage in prompts/logs | 0 findings | scanning gate |
| Governance | G1-G10 unchanged enforcement | 100% | integration tests |
| Compatibility | legacy sequential mode unaffected | 100% | regression suite |

---

## 7) Engineering To-Do Backlog (Atomic)

### Core Runtime

- [ ] Add `HybridMode` enum + config contract in `types.ts`
- [ ] Add orchestration strategy selector in `routing-optimizer.ts`
- [ ] Implement `HybridOrchestrator.execute()`
- [ ] Add `DependencyGraphBuilder` with cycle detection
- [ ] Add `WaveScheduler` with stable ordering
- [ ] Add `ParallelDispatchController` with concurrency caps

### Context System

- [ ] Implement L1 composer (task-local essentials)
- [ ] Implement L2 fetcher from GitHub comments
- [ ] Implement L3 targeted file retrieval
- [ ] Add token estimator and budget enforcer
- [ ] Add context provenance renderer

### Resilience

- [ ] Checkpoint persistence contract
- [ ] Replay planner for failed nodes
- [ ] Circuit-breaker state machine
- [ ] Escalation + abort policy

### Telemetry

- [ ] Extend telemetry schema for hybrid metrics
- [ ] Add token savings report generator
- [ ] Add critical-path analysis metric
- [ ] Add cache hit/miss tracking

### Tests

- [ ] Unit tests for each module (`>=90%` new code coverage)
- [ ] Integration tests for mixed dependency DAGs
- [ ] Fault-injection tests (timeouts/tool failures)
- [ ] Regression tests for sequential mode
- [ ] Snapshot tests for deterministic schedule plans

### Documentation

- [ ] Update `.github/framework/README.md` hybrid section
- [ ] Add architecture diagrams (memory tiers + wave DAG)
- [ ] Add runbook for rollback and failure handling
- [ ] Add operator guide for flags/tuning knobs

---

## 8) Guidelines & Guardrails

### Guardrails

1. Never dispatch in parallel when dependency edge exists.
2. Never exceed configured per-wave and global concurrency caps.
3. Never include secrets/PII in L1/L2/L3 context.
4. Never suppress failed node outcomes; all failures are surfaced.
5. Never bypass mandatory quality gates in hybrid mode.

### Coding Guidelines

- Keep modules <300 lines where practical.
- Prefer pure functions for graph planning and deterministic sorting.
- Avoid hidden mutable shared state across parallel workers.
- Use strict typed event contracts for orchestration lifecycle.
- Keep retry policies centralized and configurable.

### Operational Guidelines

- Enable hybrid only for non-critical internal tasks first.
- Require telemetry completeness before increasing rollout percentage.
- Roll back immediately on any deterministic regression or gate bypass.

---

## 9) Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Race conditions in parallel dispatch | High | Medium | immutable planning + synchronized result collector |
| Context truncation of critical details | High | Medium | critical pinning + provenance + AC pinset |
| Graph misclassification of dependencies | High | Low | explicit dependency contracts + cycle validation |
| Token estimate drift | Medium | Medium | conservative budgets + runtime telemetry correction |
| Operator misconfiguration | Medium | Medium | safe defaults + schema validation |

---

## 10) Rollout & Rollback

### Rollout

1. Stage 0: disabled by default
2. Stage 1: 5% eligible tasks (dogfood)
3. Stage 2: 25% tasks after 72h stable
4. Stage 3: 50% tasks after 7d stable
5. Stage 4: 100% for eligible classes

### Rollback Triggers

- deterministic scheduling failures
- gate bypass or incorrect DoD status
- token usage regression >15% vs baseline for 48h
- completion success rate drop below 99%

### Rollback Action

- set `hybrid_orchestration_enabled=false`
- continue sequential mode only
- open incident with telemetry bundle and failed run IDs

---

## 11) Definition of Done (Hybrid Epic)

- [ ] All phase acceptance criteria met.
- [ ] No regression in sequential mode.
- [ ] Benchmarks show >=30% duration and >=35% token improvements.
- [ ] Reliability >=99% under fault-injection test suite.
- [ ] Security/privacy checks pass with zero findings.
- [ ] Documentation, runbooks, and operator guides complete.
- [ ] Quality Director approval documented in issue/PR comments.

---

## 12) Dispatch Contract for Chief of Staff

Chief of Staff must:

1. Create execution issue(s) mapped to phases A-E.
2. Route architecture tasks first (Solution Architect) before implementation tasks.
3. Enforce handoff protocol with comment URL for every dispatch.
4. Enforce quality gate evidence before phase transitions.
5. Maintain progress ledger and risk register in GitHub comments.
6. Escalate blockers within one business cycle.

---

## 13) Suggested Work Breakdown by Agent

- `solution-architect`: hybrid architecture, dependency semantics, ADR updates
- `11-tech-lead`: slicing, sequencing, integration checkpoints
- `backend-engineer`: orchestration modules and runtime policy code
- `qa-test-engineer`: synthetic DAG + fault injection test harness
- `security-engineer`: context sanitation and leak prevention checks
- `devops-engineer`: rollout flags, telemetry deployment, rollback automation
- `99-quality-director`: final gate validation and sign-off

---

## 14) Success Metrics Dashboard (Minimum)

- `median_duration_improvement_pct`
- `median_token_savings_pct`
- `run_success_rate_pct`
- `checkpoint_recovery_success_pct`
- `parallelism_ratio`
- `determinism_regression_count`
- `gate_bypass_incidents`
- `security_findings_count`

All metrics must be trended by day/week and broken down by task type.

---

## 15) Final Note

This plan is intentionally strict: optimize throughput and token usage **without sacrificing determinism, safety, or governance**. If hybrid mode ever conflicts with quality or compliance, sequential mode remains the source-of-truth fallback.

