# Framework Modernization: API Contracts

> **Version:** 1.0.0  
> **Status:** Design Phase  
> **Last Updated:** 2026-02-25  
> **GitHub Issue:** #25

---

## Overview

This document defines the public interfaces for all framework components. These contracts are **immutable** once implemented. Breaking changes require a new major version.

---

## Module: Routing Optimizer

**File:** `.github/framework/routing-optimizer.ts`

### Interface: `RoutingOptimizer`

#### Method: `determineRoute(task: Task): Promise<RoutingDecision>`

**Description:** Determines the optimal agent route for a given task.

**Parameters:**

- `task` (Task): The task to route

**Returns:** Promise<RoutingDecision>

**Throws:**

- `RoutingError`: If routing logic fails
- `ValidationError`: If task is malformed

**Example:**

```typescript
const task: Task = {
  id: 'task-001',
  type: 'Feature',
  scope: 'Small',
  priority: 'P1',
  title: 'Add search functionality',
  description: 'Implement product search with filters',
  acceptanceCriteria: ['Search works', 'Filters work'],
  createdAt: new Date(),
  status: 'pending',
  dispatchChain: [],
  dispatchDepth: 0,
}

const decision = await RoutingOptimizer.determineRoute(task)
// {
//   targetAgent: 'frontend-engineer',
//   skipAgents: ['product-owner', 'solution-architect'],
//   reason: 'Small feature - direct to engineer',
//   confidence: 0.9,
//   expressLane: true
// }
```

#### Method: `validateDecision(decision: RoutingDecision): boolean`

**Description:** Validates a routing decision against invariants.

**Parameters:**

- `decision` (RoutingDecision): The decision to validate

**Returns:** boolean (true if valid)

**Throws:**

- `InvariantViolationError`: If decision violates invariants (e.g., bypasses Chief of Staff)

**Invariants Checked:**

- INV-R2: Chief of Staff never bypassed
- INV-R3: Quality Director never bypassed
- INV-R1: Confidence in range [0, 1]

---

## Module: Task Scheduler

**File:** `.github/framework/task-scheduler.ts`

### Interface: `TaskScheduler`

#### Method: `schedule(tasks: Task[]): Promise<void>`

**Description:** Schedules multiple tasks for parallel execution (Phase 2).

**Parameters:**

- `tasks` (Task[]): Array of tasks to schedule

**Returns:** Promise<void>

**Throws:**

- `CapacityError`: If task queue is full (max 100 queued tasks)
- `ValidationError`: If any task is malformed

**Behavior:**

- Tasks are executed in priority order (P0 → P1 → P2 → P3)
- Max concurrent tasks: 4 (configurable)
- Queued tasks wait in FIFO order within priority level

**Example:**

```typescript
await TaskScheduler.schedule([task1, task2, task3])
// Tasks execute in parallel, respecting priority and concurrency limit
```

#### Method: `cancel(taskId: string): Promise<void>`

**Description:** Cancels a scheduled or in-progress task.

**Parameters:**

- `taskId` (string): ID of task to cancel

**Returns:** Promise<void>

**Throws:**

- `TaskNotFoundError`: If task doesn't exist
- `AlreadyCompletedError`: If task is already completed

**Behavior:**

- Sets task status to 'aborted'
- Notifies currently assigned agent (if any)
- Removes from queue if pending

**Example:**

```typescript
await TaskScheduler.cancel('task-001')
```

---

## Module: Parallel Quality Gates

**File:** `.github/framework/parallel-quality-gates.ts`

### Interface: `ParallelQualityGates`

#### Method: `runAll(taskId: string): Promise<QualityGateResults>`

**Description:** Executes all quality gates in parallel (respecting dependencies).

**Parameters:**

- `taskId` (string): Task being validated

**Returns:** Promise<QualityGateResults>

```typescript
interface QualityGateResults {
  taskId: string
  results: QualityGateResult[]
  passed: boolean // True if all blocking gates passed
  duration: number // Total execution time (milliseconds)
  parallelizationGain: number // Time saved vs sequential (milliseconds)
  aborted: boolean // True if blocked by failed blocking gate
}
```

**Throws:**

- `GateTimeoutError`: If any gate exceeds 5-minute timeout
- `DeadlockError`: If circular dependency detected

**Behavior:**

- Builds dependency graph (DAG)
- Executes gates in batches (independent gates run concurrently)
- Aborts remaining gates if blocking gate fails

**Example:**

```typescript
const results = await ParallelQualityGates.runAll('task-001')
// {
//   taskId: 'task-001',
//   results: [
//     { gate: 'G1', passed: true, duration: 30000 },
//     { gate: 'G2', passed: true, duration: 15000 },
//     ...
//   ],
//   passed: true,
//   duration: 180000,
//   parallelizationGain: 90000
// }
```

#### Method: `runGate(gate: QualityGateId, taskId: string): Promise<QualityGateResult>`

**Description:** Executes a single quality gate (for testing/retry).

**Parameters:**

- `gate` (QualityGateId): Gate ID (G1-G10)
- `taskId` (string): Task being validated

**Returns:** Promise<QualityGateResult>

**Throws:**

- `GateTimeoutError`: If gate exceeds 5-minute timeout
- `DependencyNotMetError`: If gate dependencies haven't passed

**Example:**

```typescript
const result = await ParallelQualityGates.runGate('G1', 'task-001')
// { gate: 'G1', passed: true, duration: 30000, errors: [] }
```

---

## Module: Telemetry

**File:** `.github/framework/telemetry.ts`

### Interface: `Telemetry`

#### Method: `track(event: TelemetryEvent): Promise<void>`

**Description:** Records a telemetry event.

**Parameters:**

- `event` (TelemetryEvent): Event to record

**Returns:** Promise<void>

**Throws:**

- `BufferFullError`: If event buffer is full (>1000 events, unlikely)

**Behavior:**

- Events buffered in memory
- Flushed to disk every 30 seconds
- Non-blocking (async writes)

**Example:**

```typescript
await Telemetry.track({
  id: 'evt-001',
  timestamp: new Date(),
  eventType: 'task.created',
  taskId: 'task-001',
  severity: 'info',
  metadata: {
    type: 'Feature',
    scope: 'Small',
  },
})
```

#### Method: `query(filter: TelemetryFilter): Promise<TelemetryEvent[]>`

**Description:** Queries telemetry events (for analysis).

**Parameters:**

- `filter` (TelemetryFilter): Query filter

```typescript
interface TelemetryFilter {
  taskId?: string
  eventType?: TelemetryEventType
  startTime?: Date
  endTime?: Date
  severity?: string
  limit?: number // Default: 1000
}
```

**Returns:** Promise<TelemetryEvent[]>

**Throws:**

- `QueryTooLargeError`: If result set exceeds 10,000 events

**Example:**

```typescript
const events = await Telemetry.query({
  taskId: 'task-001',
  eventType: 'routing.decision',
})
// [{ id: 'evt-002', eventType: 'routing.decision', ... }]
```

#### Method: `getMetrics(): Promise<Metrics>`

**Description:** Returns real-time framework metrics.

**Returns:** Promise<Metrics>

```typescript
interface Metrics {
  tasks: {
    created: number
    completed: number
    failed: number
    aborted: number
    inProgress: number
  }
  duration: {
    p50: number
    p95: number
    p99: number
  }
  routing: {
    expressLaneRate: number
    bypassRate: number
    fallbackRate: number
  }
  gates: {
    parallelizationGain: number
    failureRate: number
  }
}
```

**Example:**

```typescript
const metrics = await Telemetry.getMetrics()
// { tasks: { created: 100, completed: 95, ... }, ... }
```

---

## Module: Context Cache

**File:** `.github/framework/context-cache.ts`

### Interface: `ContextCache`

#### Method: `get(key: string): Promise<string | null>`

**Description:** Retrieves cached context.

**Parameters:**

- `key` (string): Cache key (e.g., 'repo:structure:v1')

**Returns:** Promise<string | null> (null if not found or expired)

**Example:**

```typescript
const repoStructure = await ContextCache.get('repo:structure:v1')
if (!repoStructure) {
  // Cache miss - load from disk
  const structure = await loadRepoStructure()
  await ContextCache.set('repo:structure:v1', structure, { ttl: 3600 })
}
```

#### Method: `set(key: string, value: string, options?: CacheOptions): Promise<void>`

**Description:** Stores context in cache.

**Parameters:**

- `key` (string): Cache key
- `value` (string): Content to cache
- `options` (CacheOptions): Optional configuration

```typescript
interface CacheOptions {
  ttl?: number // Time-to-live in seconds (default: 3600)
  tags?: string[] // For bulk invalidation
}
```

**Returns:** Promise<void>

**Throws:**

- `CacheSizeExceededError`: If cache size would exceed 100 MB

**Example:**

```typescript
await ContextCache.set('repo:structure:v1', repoStructure, {
  ttl: 3600,
  tags: ['repo'],
})
```

#### Method: `invalidate(key: string): Promise<void>`

**Description:** Removes a specific cache entry.

**Parameters:**

- `key` (string): Cache key to invalidate

**Returns:** Promise<void>

**Example:**

```typescript
await ContextCache.invalidate('repo:structure:v1')
```

#### Method: `invalidateByTag(tag: string): Promise<void>`

**Description:** Removes all cache entries with a specific tag.

**Parameters:**

- `tag` (string): Tag to match

**Returns:** Promise<void>

**Example:**

```typescript
// Invalidate all model-related cache entries
await ContextCache.invalidateByTag('model')
```

#### Method: `stats(): Promise<CacheStats>`

**Description:** Returns cache statistics.

**Returns:** Promise<CacheStats>

```typescript
interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number // Total bytes cached
  entries: number // Number of cached items
}
```

**Example:**

```typescript
const stats = await ContextCache.stats()
// { hits: 1000, misses: 200, hitRate: 0.83, size: 50000000, entries: 50 }
```

---

## Module: Agent Learning

**File:** `.github/framework/learning-engine.ts`

### Interface: `AgentLearning`

#### Method: `learnFromTask(task: Task, outcome: TaskOutcome): Promise<void>`

**Description:** Updates pattern database based on task outcome.

**Parameters:**

- `task` (Task): Completed task
- `outcome` (TaskOutcome): Task result

```typescript
interface TaskOutcome {
  success: boolean
  route: AgentId[] // Agent chain used
  duration: number // Total task duration (milliseconds)
}
```

**Returns:** Promise<void>

**Example:**

```typescript
await AgentLearning.learnFromTask(task, {
  success: true,
  route: ['00-chief-of-staff', 'frontend-engineer', 'quality-director'],
  duration: 900000, // 15 minutes
})
```

#### Method: `getPattern(signature: string): Promise<TaskPattern | null>`

**Description:** Retrieves a learned pattern.

**Parameters:**

- `signature` (string): Task signature (hash of type, scope, keywords)

**Returns:** Promise<TaskPattern | null>

**Example:**

```typescript
const pattern = await AgentLearning.getPattern('Feature:Small:search')
// {
//   signature: 'Feature:Small:search',
//   route: ['00-chief-of-staff', 'frontend-engineer', 'quality-director'],
//   successRate: 0.95,
//   sampleCount: 20,
//   confidence: 0.95
// }
```

#### Method: `suggestRuleUpdates(): Promise<RuleSuggestion[]>`

**Description:** Generates suggested routing rule updates based on learned patterns.

**Returns:** Promise<RuleSuggestion[]>

```typescript
interface RuleSuggestion {
  pattern: TaskPattern
  suggestedRule: string // Human-readable rule description
  confidence: number
  rationale: string
}
```

**Example:**

```typescript
const suggestions = await AgentLearning.suggestRuleUpdates()
// [
//   {
//     pattern: { signature: 'Feature:Small:security', ... },
//     suggestedRule: 'Route small security features to Security Engineer first',
//     confidence: 0.92,
//     rationale: '12 tasks, 92% success rate when routed to Security Engineer'
//   }
// ]
```

---

## Module: Handoff Manager

**File:** `.github/framework/handoff-manager.ts`

### Interface: `HandoffManager`

#### Method: `createHandoff(from: AgentId, to: AgentId, taskId: string, delta?: HandoffDelta): Promise<Handoff>`

**Description:** Creates a handoff (v1 or v2 based on agent capabilities).

**Parameters:**

- `from` (AgentId): Sender agent
- `to` (AgentId): Recipient agent
- `taskId` (string): Task ID
- `delta` (HandoffDelta): Changes to communicate (v2 only)

```typescript
interface HandoffDelta {
  added?: string[]
  removed?: string[]
  modified?: Record<string, unknown>
}
```

**Returns:** Promise<Handoff> (Handoff v1 or v2)

**Behavior:**

- Checks agent capabilities
- If both agents support v2, creates HandoffV2 (delta-based)
- Otherwise, creates HandoffV1 (full context)

**Example:**

```typescript
const handoff = await HandoffManager.createHandoff('solution-architect', 'tech-lead', 'task-001', {
  added: ['ADR-001 created', 'API contract defined'],
  modified: { acceptanceCriteria: ['Updated criteria'] },
})
// Returns HandoffV2 if both agents support v2
```

#### Method: `deliverHandoff(handoff: Handoff): Promise<void>`

**Description:** Delivers handoff to recipient agent.

**Parameters:**

- `handoff` (Handoff): Handoff to deliver

**Returns:** Promise<void>

**Throws:**

- `AgentNotFoundError`: If recipient agent doesn't exist
- `AgentBusyError`: If recipient agent is already working

**Behavior:**

- Writes handoff to disk (if ephemeral = false)
- Notifies recipient agent
- Updates task dispatch chain

**Example:**

```typescript
await HandoffManager.deliverHandoff(handoff)
```

---

## Error Schemas

All framework errors extend `FrameworkError`:

```typescript
class FrameworkError extends Error {
  code: string // Error code (e.g., 'ROUTING_FAILED')
  details?: Record<string, unknown> // Additional context
}
```

### Error Codes

| Code                  | Description                           |
| --------------------- | ------------------------------------- |
| `ROUTING_FAILED`      | Routing optimizer failed              |
| `INVARIANT_VIOLATION` | System invariant violated             |
| `GATE_TIMEOUT`        | Quality gate exceeded timeout         |
| `DEADLOCK_DETECTED`   | Circular dependency in quality gates  |
| `TASK_NOT_FOUND`      | Task ID doesn't exist                 |
| `AGENT_NOT_FOUND`     | Agent ID doesn't exist                |
| `CACHE_SIZE_EXCEEDED` | Cache size limit exceeded             |
| `BUFFER_FULL`         | Telemetry buffer full                 |
| `QUERY_TOO_LARGE`     | Telemetry query result too large      |
| `CAPACITY_ERROR`      | Task queue full                       |
| `ALREADY_COMPLETED`   | Task already completed                |
| `DEPENDENCY_NOT_MET`  | Quality gate dependency not met       |
| `AGENT_BUSY`          | Agent already working on another task |

---

## Versioning Strategy

**Semantic Versioning (SemVer):**

- **Major (v1.0.0 → v2.0.0):** Breaking changes to API contracts
- **Minor (v1.0.0 → v1.1.0):** New features (backward compatible)
- **Patch (v1.0.0 → v1.0.1):** Bug fixes (backward compatible)

**Breaking Changes Require:**

1. Deprecation notice in v1.x
2. Migration guide
3. 6-month transition period
4. Automated migration tooling (if possible)

**Example Migration:**

```typescript
// v1 (deprecated)
await RoutingOptimizer.routeTask(task) // Old method name

// v2 (current)
await RoutingOptimizer.determineRoute(task) // New method name
```

---

## Testing Contracts

All public methods must have:

1. **Unit tests:** 100% coverage of method logic
2. **Integration tests:** Test with real agents, tasks, quality gates
3. **Contract tests:** Validate request/response schemas
4. **Error tests:** Validate all documented error codes are thrown correctly

**Example Test:**

```typescript
describe('RoutingOptimizer.determineRoute', () => {
  it('should route small bug to frontend-engineer', async () => {
    const task = createTask({ type: 'Bug', scope: 'Small' })
    const decision = await RoutingOptimizer.determineRoute(task)

    expect(decision.targetAgent).toBe('frontend-engineer')
    expect(decision.expressLane).toBe(true)
  })

  it('should throw RoutingError if task is malformed', async () => {
    const invalidTask = { id: 'task-001' } as Task
    await expect(RoutingOptimizer.determineRoute(invalidTask)).rejects.toThrow('ROUTING_FAILED')
  })
})
```

---

## References

- **GitHub Issue:** #25
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Domain Model:** [DOMAIN-MODEL.md](DOMAIN-MODEL.md)
- **TypeScript Types:** `.github/framework/types.ts`

---

**Authored by:** Solution Architect  
**Reviewed by:** (Pending)  
**Approved by:** (Pending)
