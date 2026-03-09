# Framework Modernization: Domain Model

> **Version:** 1.0.0  
> **Status:** Design Phase  
> **Last Updated:** 2026-02-25  
> **GitHub Issue:** #25

---

## Overview

This document defines the core domain entities, relationships, state machines,
and invariants for the framework modernization system.

---

## Core Entities

### 1. Task

**Description:** A unit of work to be executed by the agentic framework.

**Attributes:**

```typescript
interface Task {
  id: string; // Unique identifier (UUID)
  type: TaskType; // Feature | Bug | Refactor | Docs | Security | Performance | Incident
  priority: Priority; // P0 | P1 | P2 | P3
  scope: Scope; // Small | Medium | Large | XL
  title: string; // Brief description (max 100 chars)
  description: string; // Full description (supports markdown)
  acceptanceCriteria: string[]; // List of AC statements
  createdAt: Date; // Task creation timestamp
  startedAt?: Date; // When first agent started working
  completedAt?: Date; // When task finished
  status: TaskStatus; // pending | in-progress | blocked | completed | failed | aborted
  assignedAgent?: AgentId; // Current agent working on task
  dispatchChain: AgentId[]; // Sequence of agents that worked on task
  dispatchDepth: number; // Length of dispatch chain (0-10)
  githubIssue?: number; // Reference to GitHub issue
  metadata?: Record<string, unknown>; // Extensible metadata
}
```

**Cardinality:**

- One Task can have 0-10 Handoffs (dispatchDepth limit)
- One Task can have 10-100 TelemetryEvents
- One Task can reference 0-1 GitHub Issue

**Lifecycle:** See Task State Machine below

---

### 2. Agent

**Description:** An AI agent responsible for a specific role in the development
workflow.

**Attributes:**

```typescript
interface Agent {
  id: AgentId; // Unique agent identifier
  name: string; // Human-readable name
  role: string; // Brief role description
  tier: AgentTier; // Core | Specialist
  capabilities: {
    handoffV2: boolean; // Supports Handoff v2 protocol
    parallelExecution: boolean; // Can work on multiple tasks concurrently
    expressLane: boolean; // Can handle express lane tasks
  };
  currentStatus: AgentStatus; // idle | working | blocked | error
  currentTask?: string; // Task ID (if working)
  queuedTasks: string[]; // Task IDs waiting for this agent
  lastActive: Date; // Last time agent worked
  totalTasksCompleted: number; // Lifetime task count
  averageTaskDuration: number; // Average time per task (milliseconds)
}

type AgentTier = 'Core' | 'Specialist';
type AgentStatus = 'idle' | 'working' | 'blocked' | 'error';
```

**Cardinality:**

- One Agent can work on 1 Task at a time (current implementation)
- One Agent can have 0-N queued Tasks
- One Agent produces 0-N Handoffs (as sender)
- One Agent receives 0-N Handoffs (as recipient)

**Special Agents:**

- **Chief of Staff:** Always entry point (never bypassed)
- **Quality Director:** Always exit point (never bypassed)

---

### 3. Handoff

**Description:** A message passed from one agent to another, containing task
context and instructions.

**Variants:**

#### Handoff v1 (Legacy)

```typescript
interface HandoffV1 {
  version: 1;
  from: AgentId;
  to: AgentId;
  task: Task; // Full task object (duplication)
  timestamp: Date;
  filePath: string; // Path to handoff file on disk
  context: string; // Full context (markdown, 1,000-5,000 lines)
  constraints?: string[];
  nextAgent?: AgentId;
}
```

#### Handoff v2 (New)

```typescript
interface HandoffV2 {
  version: 2;
  from: AgentId;
  to: AgentId;
  taskId: string; // Reference to Task (not inline)
  timestamp: Date;
  delta: {
    added?: string[]; // New information
    removed?: string[]; // Removed information
    modified?: Record<string, unknown>; // Changed fields
  };
  contextRefs: string[]; // References to shared context (e.g., 'context://repo-structure')
  ephemeral: boolean; // True = memory-only, false = persist to disk
}
```

**Cardinality:**

- One Handoff connects exactly 2 Agents (sender, recipient)
- One Handoff references exactly 1 Task
- One Task has N Handoffs (N = dispatchDepth)

---

### 4. RoutingDecision

**Description:** The result of routing optimization determining which agent
should handle a task.

**Attributes:**

```typescript
interface RoutingDecision {
  taskId: string; // Task being routed
  targetAgent: AgentId; // Agent to dispatch to
  skipAgents: AgentId[]; // Agents bypassed
  reason: string; // Human-readable rationale
  confidence: number; // 0-1 (routing confidence)
  expressLane: boolean; // True = bypass workflow
  timestamp: Date;
  source: 'rule-based' | 'pattern-based' | 'manual'; // How decision was made
}
```

**Cardinality:**

- One RoutingDecision references exactly 1 Task
- One Task can have 1-10 RoutingDecisions (one per dispatch)

---

### 5. QualityGate

**Description:** A validation step that must pass before a task is completed.

**Attributes:**

```typescript
interface QualityGate {
  id: QualityGateId; // G1-G10
  name: string; // Human-readable name
  blocking: boolean; // True = must pass, false = warning only
  dependencies: QualityGateId[]; // Gates that must pass first
  validator: () => Promise<QualityGateResult>; // Validation function
}
```

**Cardinality:**

- 10 QualityGates exist (fixed)
- Each QualityGate can depend on 0-9 other QualityGates
- Each Task produces 10 QualityGateResults (one per gate)

---

### 6. QualityGateResult

**Description:** The result of executing a quality gate.

**Attributes:**

```typescript
interface QualityGateResult {
  taskId: string; // Task being validated
  gate: QualityGateId; // Gate identifier
  passed: boolean; // True = passed, false = failed
  duration: number; // Execution time (milliseconds)
  errors?: string[]; // Error messages (if failed)
  warnings?: string[]; // Warning messages
  metadata?: Record<string, unknown>; // Additional data (e.g., coverage %)
  timestamp: Date;
}
```

**Cardinality:**

- One QualityGateResult references exactly 1 QualityGate
- One QualityGateResult references exactly 1 Task
- One Task has exactly 10 QualityGateResults (G1-G10)

---

### 7. TelemetryEvent

**Description:** A timestamped event capturing framework activity.

**Attributes:**

```typescript
interface TelemetryEvent {
  id: string; // Unique event ID (UUID)
  timestamp: Date;
  eventType: TelemetryEventType; // See ADR-FW005
  taskId: string; // Task reference
  agentId?: AgentId; // Agent involved (if applicable)
  metadata: Record<string, unknown>; // Event-specific data
  severity: 'debug' | 'info' | 'warn' | 'error' | 'critical';
}
```

**Cardinality:**

- One TelemetryEvent references exactly 1 Task
- One Task produces 10-100 TelemetryEvents
- TelemetryEvents are append-only (never updated)

---

### 8. TaskPattern

**Description:** A learned pattern representing a recurring task type and
optimal routing.

**Attributes:**

```typescript
interface TaskPattern {
  signature: string; // Hash of (type, scope, keywords)
  route: AgentId[]; // Optimal agent chain
  successRate: number; // 0-1
  sampleCount: number; // Number of matching tasks
  confidence: number; // Derived from success rate + sample count
  avgDuration: number; // Average task duration (milliseconds)
  keywords: string[]; // Keywords that trigger this pattern
  createdAt: Date;
  lastUpdated: Date;
}
```

**Cardinality:**

- TaskPatterns are discovered from Tasks (many-to-one: many tasks → one pattern)
- One TaskPattern influences 0-N future RoutingDecisions

---

### 9. ContextCacheEntry

**Description:** A cached context item (file content, repo structure, etc.)

**Attributes:**

```typescript
interface ContextCacheEntry {
  key: string; // Cache key (e.g., 'repo:structure:v1')
  value: string; // Cached content
  expiresAt: Date; // TTL expiration timestamp
  tags: string[]; // For bulk invalidation (e.g., ['model', 'framework'])
  size: number; // Content size in bytes
  hits: number; // Number of cache accesses
  lastAccessed: Date;
}
```

**Cardinality:**

- 0-1000 ContextCacheEntries exist (bounded by max size)
- ContextCacheEntries are ephemeral (cleared on framework restart)

---

## Entity Relationships

```
┌──────────────┐
│    Task      │
│ (id, type,   │
│  status)     │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼───────────────────────────────────────────────┐
│                   Handoff (v1/v2)                    │
│ (from, to, taskId)                                   │
└──────┬───────────────────────────────────────────────┘
       │
       │ N:1           N:1
       │               │
┌──────▼───────┐  ┌───▼─────────┐
│    Agent     │  │    Agent    │
│  (sender)    │  │ (recipient) │
└──────────────┘  └─────────────┘


┌──────────────┐
│    Task      │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼──────────────────┐
│   RoutingDecision       │
│ (targetAgent,           │
│  skipAgents,            │
│  confidence)            │
└─────────────────────────┘


┌──────────────┐
│    Task      │
└──────┬───────┘
       │
       │ 1:10
       │
┌──────▼─────────────────┐
│  QualityGateResult     │
│ (gate, passed)         │
└────────┬───────────────┘
         │
         │ N:1
         │
    ┌────▼────────┐
    │ QualityGate │
    │ (id, deps)  │
    └─────────────┘


┌──────────────┐
│    Task      │
└──────┬───────┘
       │
       │ 1:N
       │
┌──────▼──────────────────┐
│   TelemetryEvent        │
│ (eventType, timestamp)  │
└─────────────────────────┘


┌──────────────┐
│    Task      │
└──────┬───────┘
       │
       │ N:1
       │
┌──────▼──────────────────┐
│   TaskPattern           │
│ (signature, route,      │
│  successRate)           │
└─────────────────────────┘
```

---

## State Machines

### Task State Machine

```
                    ┌─────────────┐
                    │   pending   │ (initial state)
                    └──────┬──────┘
                           │
                           │ assign_to_agent()
                           ↓
                    ┌─────────────┐
           ┌────────│ in-progress │────────┐
           │        └──────┬──────┘        │
           │               │               │
           │ block()       │ complete()    │
           │               │               │
           ↓               ↓               │
    ┌──────────┐    ┌────────────┐        │
    │ blocked  │    │ completed  │ (final)│
    └────┬─────┘    └────────────┘        │
         │                                 │
         │ unblock()                       │
         └─────────────────────────────────┘

    ┌──────────┐
    │  failed  │ (terminal, can retry)
    └──────────┘
           ↑
           │ fail()
           │
    ┌──────┴──────┐
    │ in-progress │
    └──────┬──────┘
           │
           │ abort()
           ↓
    ┌──────────┐
    │ aborted  │ (terminal)
    └──────────┘
```

**States:**

- **pending:** Task created, waiting for assignment
- **in-progress:** Agent actively working on task
- **blocked:** Waiting for external dependency (user input, API, etc.)
- **completed:** Task successfully finished
- **failed:** Task failed, can be retried
- **aborted:** User cancelled task

**Transitions:**

| From        | To          | Trigger    | Conditions                   |
| ----------- | ----------- | ---------- | ---------------------------- |
| pending     | in-progress | assign()   | assignedAgent is set         |
| in-progress | completed   | complete() | All acceptance criteria met  |
| in-progress | blocked     | block()    | External dependency required |
| in-progress | failed      | fail()     | Unrecoverable error          |
| in-progress | aborted     | abort()    | User cancellation            |
| blocked     | in-progress | unblock()  | Dependency resolved          |
| failed      | in-progress | retry()    | Manual retry triggered       |

**Forbidden Transitions:**

- pending → completed (must go through in-progress)
- completed → in-progress (completed is terminal)
- aborted → any (aborted is terminal)

---

### Agent State Machine

```
    ┌──────┐
    │ idle │ (initial)
    └───┬──┘
        │
        │ dispatch_task()
        ↓
    ┌──────────┐
    │ working  │
    └─┬──────┬─┘
      │      │
      │      │ complete_task()
      │      └────────────────┐
      │                       │
      │ encounter_error()     │
      ↓                       ↓
    ┌───────┐             ┌──────┐
    │ error │             │ idle │
    └───┬───┘             └──────┘
        │
        │ recover()
        └──────────────────────→ idle
```

**States:**

- **idle:** Agent available for work
- **working:** Agent executing a task
- **blocked:** Agent waiting for dependency (future state)
- **error:** Agent encountered unrecoverable error

**Transitions:**

| From    | To      | Trigger    | Conditions                |
| ------- | ------- | ---------- | ------------------------- |
| idle    | working | dispatch() | Task assigned             |
| working | idle    | complete() | Task completed/handed off |
| working | error   | error()    | Unhandled exception       |
| error   | idle    | recover()  | Error resolved            |

---

### Quality Gate Execution State Machine

```
    ┌─────────┐
    │ pending │ (initial)
    └────┬────┘
         │
         │ dependencies_met()
         ↓
    ┌─────────┐
    │ running │
    └─┬─────┬─┘
      │     │
      │     │ validation_succeeded()
      │     └────────────┐
      │                  │
      │ timeout()       │ validation_failed()
      ↓                  ↓                ↓
    ┌──────────┐    ┌────────┐      ┌────────┐
    │ timeout  │    │ passed │      │ failed │
    └──────────┘    └────────┘      └────────┘
    (terminal)       (terminal)      (terminal)
```

**States:**

- **pending:** Gate waiting for dependencies
- **running:** Gate executing validation
- **passed:** Validation succeeded
- **failed:** Validation failed (blocking gate → abort task)
- **timeout:** Gate exceeded 5-minute timeout

**Transitions:**

| From    | To      | Trigger   | Conditions                  |
| ------- | ------- | --------- | --------------------------- |
| pending | running | start()   | All dependencies completed  |
| running | passed  | succeed() | Validation returned success |
| running | failed  | fail()    | Validation returned failure |
| running | timeout | timeout() | 5 minutes elapsed           |

---

## System Invariants

**Invariants** are constraints that must always hold true. Violations indicate
bugs.

### Task Invariants

1. **INV-T1: Dispatch Depth Limit**
   - `task.dispatchDepth <= 10`
   - Prevents infinite loops

2. **INV-T2: Assigned Agent Required for In-Progress Tasks**
   - `if task.status === 'in-progress' then task.assignedAgent !== undefined`

3. **INV-T3: Completion Timestamp Required for Completed Tasks**
   - `if task.status === 'completed' then task.completedAt !== undefined`

4. **INV-T4: Dispatch Chain Consistency**
   - `task.dispatchChain.length === task.dispatchDepth`

5. **INV-T5: Start Before Complete**
   - `if task.completedAt then task.startedAt < task.completedAt`

6. **INV-T6: Chief of Staff Always First**
   - `task.dispatchChain[0] === '00-chief-of-staff'`

7. **INV-T7: Quality Director Always Last (for completed tasks)**
   - `if task.status === 'completed' then task.dispatchChain[task.dispatchDepth - 1] === 'quality-director'`

### Routing Invariants

8. **INV-R1: Confidence Range**
   - `0 <= routingDecision.confidence <= 1`

9. **INV-R2: Chief of Staff Never Bypassed**
   - `'00-chief-of-staff' not in routingDecision.skipAgents`

10. **INV-R3: Quality Director Never Bypassed**
    - `'quality-director' not in routingDecision.skipAgents`

### Quality Gate Invariants

11. **INV-G1: All Gates Executed**
    - `if task.status === 'completed' then qualityGateResults.length === 10`

12. **INV-G2: Dependency Order Respected**
    - If gate G5 depends on G1-G4, then
      `G5.startTime > max(G1.endTime, G2.endTime, G3.endTime, G4.endTime)`

13. **INV-G3: Blocking Gate Failure Aborts Task**
    - `if gate.blocking && !gateResult.passed then task.status === 'failed'`

### Handoff Invariants

14. **INV-H1: Version Compatibility**
    - `if handoff.version === 2 then agent[to].capabilities.handoffV2 === true`

15. **INV-H2: Task Reference Validity**
    - `if handoff.version === 2 then taskExists(handoff.taskId)`

### Agent Invariants

16. **INV-A1: Single Task per Agent**
    - `if agent.status === 'working' then agent.currentTask !== undefined`
    - `if agent.status === 'idle' then agent.currentTask === undefined`

17. **INV-A2: Chief of Staff is Always Idle or Working (Never Error)**
    - `agent['00-chief-of-staff'].status !== 'error'` (must be handled
      gracefully)

### Telemetry Invariants

18. **INV-TM1: Event Timestamp Order**
    - Events for a task are monotonically increasing in time
    - `events[i].timestamp <= events[i+1].timestamp`

19. **INV-TM2: Task Created Before Other Events**
    - First event for a task must be `task.created`

### Cache Invariants

20. **INV-C1: Cache Size Limit**
    - `sum(cache.entries[*].size) <= 100_000_000` (100 MB)

21. **INV-C2: TTL Validity**
    - `if entry.expiresAt < now() then entry is evicted`

---

## Security Boundaries

### Trust Zones

```
┌──────────────────────────────────────────────────────────────┐
│ TRUSTED ZONE: Framework Core                                │
│ - routing-optimizer.ts, parallel-quality-gates.ts            │
│ - telemetry.ts, context-cache.ts                             │
│ - types.ts                                                   │
│                                                              │
│ Security: Full trust, can access all system resources       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ SEMI-TRUSTED ZONE: Core Agents                              │
│ - 00-chief-of-staff, solution-architect, tech-lead           │
│ - quality-director, security-engineer                        │
│                                                              │
│ Security: Can read .github/.system-state/, commit to main (limited) │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ UNTRUSTED ZONE: Specialist Agents                           │
│ - All other agents (frontend-engineer, docs, etc.)          │
│                                                              │
│ Security: Can only read, commit to feature branches          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ EXTERNAL: User Input                                         │
│ - Task descriptions, issue bodies, manual overrides          │
│                                                              │
│ Security: Untrusted, must validate all input                │
└──────────────────────────────────────────────────────────────┘
```

### Validation Requirements

1. **Task Description:** Sanitize user input, prevent code injection
2. **Routing Decisions:** Validate agent IDs exist, prevent bypassing
   Chief/Quality
3. **Handoff Deltas:** Validate structure, prevent arbitrary field modification
4. **Cache Keys:** Validate format, prevent path traversal attacks
5. **Telemetry Events:** Validate event types, sanitize metadata

---

## AMM-OS Extensions

### Multi-Tenancy Readiness

**Current:** Single tenant (<APPLICATION_NAME> project)

**Future:** Multi-project support

**Design:**

```typescript
interface Task {
  // Existing fields...
  tenantId: string; // Future: Organization or project ID
}

interface ContextCacheEntry {
  // Existing fields...
  tenantId: string; // Cache segregation per tenant
}
```

**Invariant:**

- `task.tenantId === currentTenant` (cannot cross tenant boundaries)

### Configuration Hierarchy

**Framework Config:**

```
.github/framework-config/
  routing-rules.yaml        # Routing bypass rules
  agent-tiers.yaml          # Core vs Specialist agents
  slo-thresholds.yaml       # Performance targets
  feature-flags.yaml        # Feature toggles
```

**Tenant Config (Future):**

```
.config/tenants/{tenantId}/
  routing-overrides.yaml    # Tenant-specific routing
  slo-overrides.yaml        # Tenant-specific SLOs
```

### Feature Flags Integration

**Feature Flags Table:**

| Flag                   | Phase | Default | Description                     |
| ---------------------- | ----- | ------- | ------------------------------- |
| smart_routing          | 1     | false   | Enable smart routing optimizer  |
| streaming_logger       | 1     | false   | Enable real-time streaming logs |
| parallel_quality_gates | 1     | false   | Enable parallel gate execution  |
| abort_capability       | 1     | false   | Enable task abort functionality |
| task_scheduler         | 2     | false   | Enable parallel task execution  |
| handoff_v2             | 2     | false   | Enable Handoff v2 protocol      |
| context_cache          | 2     | false   | Enable context caching          |
| express_lanes          | 2     | false   | Enable express lane routing     |
| telemetry_system       | 3     | false   | Enable telemetry capture        |
| agent_learning         | 3     | false   | Enable pattern-based learning   |
| agent_consolidation    | 3     | false   | Enable consolidated agents      |
| dynamic_loading        | 3     | false   | Enable on-demand agent loading  |

---

## References

- **GitHub Issue:** #25
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **ADRs:** `.github/DECISIONS/framework/ADR-FW001` through `ADR-FW007`
- **TypeScript Types:** `.github/framework/types.ts`

---

**Authored by:** Solution Architect  
**Reviewed by:** (Pending)  
**Approved by:** (Pending)
