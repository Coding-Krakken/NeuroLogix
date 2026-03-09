# Framework Modernization: System Architecture

> **Version:** 1.0.0  
> **Status:** Design Phase  
> **Last Updated:** 2026-02-25  
> **GitHub Issue:** #25

---

## Executive Summary

This document defines the architecture for modernizing the Core-3-first agentic
framework (with specialist escalation) to achieve:

- **70% faster task execution** (50 min → 5-15 min for simple tasks)
- **40% reduction in dispatch handoffs** (5-6 → 3-4 agents average)
- **50% faster developer feedback loop**
- **90% confidence in framework resilience**

The architecture introduces smart routing, parallel execution, streaming
feedback, and adaptive learning while maintaining backward compatibility with
existing agents.

---

## System Overview

### Current State

```
User Request
    ↓
Chief of Staff (always)
    ↓
Sequential agent chain (5-6 agents)
    ↓
Quality Director (always)
    ↓
Sequential quality gates (10 gates, ~5-10 min)
    ↓
PR Creation
```

**Problems:**

- Unnecessary handoffs for simple tasks
- Sequential quality gate execution
- No streaming feedback (black box until completion)
- No learning from past tasks
- 27 agents (many underutilized)

### Target State

```
User Request
    ↓
Chief of Staff
    ↓
Smart Routing Optimizer ──→ Express Lane (simple tasks)
    ↓                            ↓
Optimized agent chain      Direct to Engineer
    ↓                            ↓
Parallel Quality Gates (concurrent execution)
    ↓
Quality Director
    ↓
PR Creation
```

**Improvements:**

- Smart routing with express lanes
- Parallel quality gate execution
- Streaming feedback (real-time progress)
- Learning from task patterns
- Consolidated agents (27 → 20)

---

## Component Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ User Interface Layer                                            │
│ ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│ │ Streaming    │  │ Monitoring      │  │ Abort/Pause       │  │
│ │ Logger       │  │ Dashboard       │  │ Controls          │  │
│ └──────────────┘  └─────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Control Layer                                                   │
│ ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│ │ Routing Optimizer    │  │ Task Scheduler                   │ │
│ │ - Express lanes      │  │ - Parallel execution             │ │
│ │ - Bypass rules       │  │ - Dependency management          │ │
│ │ - Pattern matching   │  │ - Resource allocation            │ │
│ └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Agent Execution Layer                                           │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│ │ Core     │  │ Specialists│ │ Quality  │  │ Agent Learning   ││
│ │ Agents   │  │ (on-demand)│ │ Gates    │  │ Engine           ││
│ │ (always) │  │            │  │(parallel)│  │ (feedback loops) ││
│ └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ Data Layer                                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│ │ Context      │  │ Telemetry    │  │ Pattern Database       ││
│ │ Cache        │  │ Store        │  │ (successful routes)    ││
│ └──────────────┘  └──────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Phase 1: Smart Routing & Quick Wins

```
[User Request]
      ↓
[Chief of Staff]
      ↓
[Classify Task] ──→ (TaskType, Priority, Scope, Complexity)
      ↓
[Routing Optimizer]
      ├─→ Express Lane? (scope=Small, type=Bug/Docs) ──→ [Direct to Engineer]
      ├─→ Bypass Architecture? (scope=Small, type=Feature) ──→ [Tech Lead]
      └─→ Standard Chain (scope≥Medium) ──→ [Full agent chain]
      ↓
[Agent Execution] ──→ [Streaming Logger] ──→ [Real-time Terminal Output]
      ↓
[Quality Gates] ──→ [Parallel Execution] (G1-G4 concurrent, then G5)
      ↓
[Quality Director] ──→ [PR Creation]
```

**Key Changes in Phase 1:**

1. Routing Optimizer makes intelligent bypass decisions
2. Streaming Logger provides real-time feedback
3. Parallel Quality Gates reduce gate time from 5-10 min to 2-3 min
4. Abort capability allows cancellation of in-progress tasks

### Phase 2: Core Optimizations

```
[User Request]
      ↓
[Chief of Staff]
      ↓
[Task Scheduler] ──→ [Parallel Task Execution] (multiple tasks simultaneously)
      ↓
[Context Cache] ──→ Preloaded contexts (repo structure, common patterns)
      ├─→ Cache Hit: Skip redundant file reads
      └─→ Cache Miss: Load & cache for next task
      ↓
[Handoff v2 Protocol] ──→ Delta-based handoffs (not full duplication)
      ├─→ Ephemeral handoffs (memory-only, no disk I/O)
      └─→ Context references (links instead of copies)
      ↓
[Express Lanes] ──→ Pre-defined fast paths for common patterns
      ├─→ lint-fix → frontend-engineer → quality-director
      ├─→ type-error → backend-engineer → quality-director
      └─→ docs-update → documentation-engineer → quality-director
      ↓
[Quality Gates] ──→ Dependency-based parallel execution
      ↓
[Quality Director] ──→ [PR Creation]
```

**Key Changes in Phase 2:**

1. Task Scheduler enables multiple tasks to run in parallel
2. Context Cache eliminates redundant file reads (40% speedup)
3. Handoff v2 Protocol reduces handoff overhead (delta-based)
4. Express Lanes bypass 2-3 agents for simple tasks

### Phase 3: Strategic Enhancements

```
[User Request]
      ↓
[Chief of Staff]
      ↓
[Telemetry System] ──→ [Task Events] ──→ [Pattern Database]
      ├─→ Task Started, Agent Dispatched, Gate Passed, Task Completed
      ├─→ Metrics: Duration, Token Cost, Success Rate
      └─→ Alerts: SLO violations, Failures, Anomalies
      ↓
[Agent Learning Engine]
      ├─→ Pattern Recognition: Similar tasks → Similar routes
      ├─→ Feedback Loops: Successful routes → Preferred routes
      └─→ Adaptive Routing: Update rules based on outcomes
      ↓
[Dynamic Agent Loading] ──→ Load specialists on-demand, unload when idle
      ├─→ Core Agents: Always loaded (Chief, Tech Lead, Engineers, Quality)
      └─→ Specialists: Load when needed (Legal, Privacy, Localization)
      ↓
[Agent Consolidation] ──→ Merge underutilized agents (27 → 20)
      ├─→ Merge: Privacy + Legal → Compliance Officer
      └─→ Merge: Performance + SRE → Performance/Reliability Engineer
      ↓
[Cloud Test Environment] ──→ Synthetic task suite (50+ scenarios)
      ↓
[Quality Director] ──→ [PR Creation]
```

**Key Changes in Phase 3:**

1. Telemetry System captures all task events for analysis
2. Agent Learning Engine adapts routing rules based on patterns
3. Dynamic Agent Loading reduces memory footprint
4. Agent Consolidation reduces complexity
5. Cloud Test Environment validates all framework changes

---

## Integration Points

### 1. Existing Agents

**Backward Compatibility Strategy:**

- All 27 agents continue to work unchanged
- Framework enhancements are opt-in via feature flags
- Routing optimizer gracefully falls back to default chains if rules fail
- Handoff v2 protocol is backward compatible with v1 (version field in handoff)

**Integration Mechanism:**

```typescript
// Existing agent code - NO CHANGES REQUIRED
const handoff = {
  version: 1, // Continue using v1
  from: 'solution-architect',
  to: 'tech-lead',
  task: taskObject,
  context: '...',
};

// Framework automatically upgrades to v2 if both agents support it
// Falls back to v1 if either agent is on old version
```

### 2. Quality Gates

**Current:** Sequential execution in Quality Director agent  
**New:** Parallel execution with dependency graph

**Integration Mechanism:**

```typescript
// Before: Sequential
await runGate('G1'); // Lint
await runGate('G2'); // Format
await runGate('G3'); // Type
await runGate('G4'); // Test
await runGate('G5'); // Build (depends on G1-G4)

// After: Parallel
const results = await ParallelQualityGates.runAll();
// G1, G2, G3, G4 run concurrently
// G5 waits for G1-G4 to complete
// Total time: max(G1, G2, G3, G4) + G5 time
```

### 3. GitHub Workflow

**No Changes Required:**

- Quality Director continues to create PRs
- Commit authority unchanged
- Branch strategy unchanged

**Enhancement:**

- Telemetry automatically creates GitHub comments with task metrics
- Monitoring dashboard links added to PR descriptions

### 4. Terminal Commands

**Normalized Commands:**

```powershell
# Canonical dispatch command (normalized ID)
code chat -m 11-tech-lead --add-file $repo "Task description"

# New enhanced dispatch with routing optimization (opt-in)
code chat -m 00-chief-of-staff --add-file $repo --optimize "Task description"
# Chief of Staff automatically routes to optimal agent (may skip directly to 11-tech-lead)
```

### 5. Feature Flags

**All enhancements controlled by feature flags:**

```typescript
// .github/framework-config/feature-flags.yaml
features:
  smart_routing: true # Phase 1
  streaming_logger: true # Phase 1
  parallel_quality_gates: true # Phase 1
  abort_capability: true # Phase 1
  task_scheduler: false # Phase 2 (not yet enabled)
  handoff_v2: false # Phase 2 (not yet enabled)
  context_cache: false # Phase 2 (not yet enabled)
  express_lanes: false # Phase 2 (not yet enabled)
  telemetry_system: false # Phase 3 (not yet enabled)
  agent_learning: false # Phase 3 (not yet enabled)
  agent_consolidation: false # Phase 3 (not yet enabled)
  dynamic_loading: false # Phase 3 (not yet enabled)
```

**Gradual Rollout:**

- Phase 1: Enable flags one at a time, validate each
- Phase 2: Beta testing with synthetic tasks before production
- Phase 3: Dogfooding period (use on internal tasks only)

---

## State Management Strategy

### Framework State

**State Model:**

```typescript
interface FrameworkState {
  tasks: Map<string, Task>; // All active tasks
  agents: Map<AgentId, AgentState>; // Agent status
  routing: RoutingCache; // Cached routing decisions
  telemetry: TelemetryBuffer; // Buffered events
  cache: ContextCache; // Preloaded contexts
}

interface AgentState {
  id: AgentId;
  status: AgentStatus; // idle | working | blocked | error
  currentTask?: string; // Task ID
  queuedTasks: string[]; // Waiting tasks
  lastActive: Date;
  totalTasksCompleted: number;
}
```

**State Persistence:**

- **In-Memory:** Active tasks, agent status, routing cache (ephemeral)
- **Disk:** Telemetry events, pattern database, successful routes (persistent)
- **Backup:** Framework state snapshots every 5 minutes (disaster recovery)

**State Synchronization:**

- Single-process architecture (no distributed state)
- GitHub-native handoff comments for durability (resume via comment URL +
  issue/PR history)
- Telemetry buffered in memory, flushed to disk every 30 seconds

### Task State Machine

```
[pending] ──→ [in-progress] ──→ [completed]
    ↓              ↓                   ↑
    ↓         [blocked] ──────────────┘
    ↓              ↓
    └──────→ [aborted]
                   ↑
              [failed] ──→ (retry?) ──→ [in-progress]
```

**State Transitions:**

- `pending → in-progress`: Task assigned to agent
- `in-progress → completed`: Task successfully finished
- `in-progress → blocked`: Waiting for dependency
- `blocked → in-progress`: Dependency resolved
- `in-progress → failed`: Agent reported error
- `failed → in-progress`: Retry triggered
- `pending|in-progress|blocked → aborted`: User cancelled task

**Invariants:**

- Task cannot be `in-progress` without an `assignedAgent`
- Task cannot be `completed` without `completedAt` timestamp
- Task `dispatchDepth` cannot exceed 10 (prevent infinite loops)
- Task must have at least one entry in `dispatchChain` (originating agent)

---

## Error Handling & Failure Modes

### Routing Optimizer Failures

**Failure:** Routing rule evaluation throws exception

**Recovery:**

1. Log error to telemetry
2. Fall back to default agent chain for task type
3. Alert: Framework error requiring attention

**Prevention:**

- All routing rules have unit tests
- Routing optimizer has try/catch wrapper
- Default chains are hardcoded (cannot fail)

### Quality Gate Failures

**Failure:** Quality gate hangs or times out

**Recovery:**

1. Timeout after 5 minutes
2. Mark gate as failed
3. Abort remaining gates
4. Surface error to Quality Director

**Prevention:**

- All quality gates have 5-minute timeout
- Quality gates run in separate processes (cannot block framework)
- Dependency graph prevents deadlocks

### Agent Failures

**Failure:** Agent throws unhandled exception or exits early

**Recovery:**

1. Log stack trace to telemetry
2. Mark task as `failed`
3. Notify Quality Director for manual review
4. Option: Retry with different agent (if rule exists)

**Prevention:**

- All agent prompts include error handling guidance
- Agents must acknowledge errors in handoffs
- Quality Director reviews all failed tasks

### Telemetry System Failures

**Failure:** Telemetry storage unavailable

**Recovery:**

1. Continue task execution (non-blocking)
2. Buffer events in memory
3. Retry writes every 30 seconds
4. Drop oldest events if buffer full (>1000 events)

**Prevention:**

- Telemetry is async and non-blocking
- Separate process for telemetry writes
- Circuit breaker after 3 consecutive failures

---

## Backward Compatibility Strategy

### Principles

1. **No Breaking Changes:** Existing agents work without modification
2. **Opt-In Enhancements:** New features enabled via feature flags
3. **Graceful Degradation:** Framework falls back to default behavior on errors
4. **Version Detection:** Handoff protocol version negotiation

### Compatibility Matrix

| Component           | Old Behavior                    | New Behavior                       | Compatibility   |
| ------------------- | ------------------------------- | ---------------------------------- | --------------- |
| Handoff Protocol    | v1 (full context duplication)   | v2 (delta-based, context refs)     | Bidirectional   |
| Quality Gates       | Sequential execution            | Parallel execution                 | Drop-in replace |
| Routing             | Chief of Staff manually routes  | Routing Optimizer auto-routes      | Opt-in flag     |
| Agent Loading       | All 27 agents loaded at startup | Dynamic loading (Core + on-demand) | Opt-in flag     |
| Telemetry           | No tracking                     | Full event tracking                | Non-invasive    |
| Feedback            | Silent until completion         | Streaming real-time logs           | Additive        |
| Task Execution      | One task at a time              | Parallel execution                 | Opt-in flag     |
| Agent Consolidation | 27 agents                       | 20 agents (merge underutilized)    | Gradual rollout |

### Rollback Strategy

**Failure Triggers:**

- Framework error rate >5%
- Task completion rate <95%
- Quality gate false positives >10%

**Rollback Procedure:**

1. Disable all feature flags (return to baseline)
2. Clear routing cache and context cache
3. Restart framework (revert to old behavior)
4. Validate: Run 10 test tasks, confirm success
5. **Estimated Rollback Time:** <5 minutes

**Data Preservation:**

- Telemetry data retained (for post-mortem analysis)
- Successful routing patterns exported (not lost)
- Failed tasks logged for replay

---

## Performance Architecture

### Optimization Targets

| Metric                    | Baseline   | Target     | Strategy                     |
| ------------------------- | ---------- | ---------- | ---------------------------- |
| Simple task duration      | 50 min     | 5-15 min   | Smart routing, express lanes |
| Average handoffs per task | 5-6 agents | 3-4 agents | Bypass unnecessary agents    |
| Quality gate time         | 5-10 min   | 2-3 min    | Parallel execution           |
| Developer feedback time   | 50 min     | Real-time  | Streaming logger             |
| Framework overhead        | N/A        | <100ms     | Optimized routing algorithm  |
| Context loading time      | 5-10 sec   | <1 sec     | Context cache (preloaded)    |
| Handoff creation time     | 2-5 sec    | <500ms     | Handoff v2 (delta-based)     |

### Caching Strategy

**Context Cache:**

- **What:** Repository structure, common file paths, frequently accessed files
- **Key:** `repo:${repoName}:structure:v1`
- **TTL:** 1 hour (refresh on change)
- **Eviction:** LRU (Least Recently Used)
- **Size:** Max 100 MB

**Routing Cache:**

- **What:** Successful routing decisions for similar tasks
- **Key:** `route:${taskType}:${scope}:${description_hash}`
- **TTL:** 7 days
- **Eviction:** LRU
- **Size:** Max 10,000 entries

**Pattern Cache:**

- **What:** Learned patterns from agent learning engine
- **Key:** `pattern:${task_signature}`
- **TTL:** 30 days
- **Eviction:** LRU + confidence score (drop low-confidence patterns first)
- **Size:** Max 50,000 entries

---

## Deployment Architecture

### Environments

1. **Local Development:** Feature flags off, manual testing
2. **Beta (Synthetic Tasks):** Feature flags on, automated test suite (50+
   tasks)
3. **Dogfooding (Internal Tasks):** Feature flags on, real tasks on internal
   projects
4. **Production (All Tasks):** Feature flags on, all user-facing tasks

### Rollout Plan

**Phase 1 (1-2 weeks):**

1. Deploy smart routing + streaming logger (flags off)
2. Enable smart_routing flag for synthetic tasks
3. Validate: 100% success rate on 50 test tasks
4. Enable for dogfooding (internal tasks only)
5. Monitor for 1 week
6. **Gate:** 95% success rate, <5% error rate → Enable for production

**Phase 2 (1 month):**

1. Deploy task scheduler + handoff v2 + context cache + express lanes
2. Enable flags one at a time for synthetic tasks
3. Validate each feature independently
4. Enable for dogfooding
5. Monitor for 2 weeks
6. **Gate:** 90% faster execution, <5% error rate → Enable for production

**Phase 3 (2-3 months):**

1. Deploy telemetry + learning engine + agent consolidation + dynamic loading
2. Beta testing on synthetic tasks (4 weeks)
3. Dogfooding (4 weeks)
4. Gradual rollout to production (25% → 50% → 100% over 2 weeks)
5. **Gate:** 70% faster execution, 90% confidence → Full production

---

## Monitoring & Observability

### Metrics

**Task Metrics:**

- Task duration (p50, p95, p99)
- Task success rate
- Task failure rate (by failure type)
- Handoffs per task (average, max)
- Token cost per task
- Time to first feedback

**Agent Metrics:**

- Agent utilization (% time working)
- Agent success rate
- Agent average task duration
- Agent queue length

**Framework Metrics:**

- Routing decision time
- Quality gate parallelization gain
- Context cache hit rate
- Handoff v2 adoption rate
- Framework overhead per task

**SLO Tracking:**

- Simple task duration <15 min (95% of tasks)
- Average handoffs ≤4 agents (90% of tasks)
- Quality gate time <3 min (95% of tasks)
- Framework error rate <1%

### Alerts

**Critical (PagerDuty):**

- Framework error rate >5% (5 min window)
- Task success rate <90% (15 min window)
- Quality gate false positive rate >10% (1 hour window)

**Warning (Slack):**

- Simple task duration >20 min (p95)
- Context cache hit rate <70%
- Agent queue length >10 tasks

### Dashboards

**Framework Health Dashboard:**

- Task throughput (tasks/hour)
- Success rate trend
- Error rate by component
- SLO compliance

**Agent Performance Dashboard:**

- Agent utilization heatmap
- Task duration by agent
- Handoff chain visualization
- Token cost by agent

**Learning Dashboard:**

- Pattern recognition accuracy
- Routing decision confidence
- Adaptive routing improvements
- Test suite coverage

---

## Security Architecture

See [SECURITY.md](SECURITY.md) for detailed security architecture including:

- Trust boundaries
- Input validation
- Secrets management
- Audit logging

---

## Failure Modes & Resilience

See [FAILURE-MODES.md](FAILURE-MODES.md) for comprehensive failure mode analysis
including:

- Component failure scenarios
- Recovery strategies
- Circuit breaker locations
- Retry policies

---

## References

- **GitHub Issue:** #25
- **ADRs:** `.github/DECISIONS/framework/ADR-FW001` through `ADR-FW007`
- **Domain Model:** [DOMAIN-MODEL.md](DOMAIN-MODEL.md)
- **API Contracts:** [API-CONTRACTS.md](API-CONTRACTS.md)
- **Implementation Plan:** [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md)

---

**Authored by:** Solution Architect  
**Reviewed by:** (Pending)  
**Approved by:** (Pending)
