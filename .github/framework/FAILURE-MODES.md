# Framework Modernization: Failure Modes & Resilience

> **Version:** 1.0.0  
> **Status:** Design Phase  
> **Last Updated:** 2026-02-25  
> **GitHub Issue:** #25

---

## Overview

This document identifies all critical failure modes for the framework
modernization and defines recovery strategies, circuit breakers, and retry
policies.

**Goal:** 99.9% uptime, graceful degradation, <5 minute recovery time

---

## Failure Mode Catalog

### FM-001: Routing Optimizer Failure

**Component:** `routing-optimizer.ts`

**Failure Scenario:** Routing optimizer throws exception during
`determineRoute()`

**Symptoms:**

- Error in logs: `RoutingError: determineroute failed`
- Task stuck in `pending` state
- Chief of Staff cannot dispatch task

**Impact:**

- **Severity:** High
- **Scope:** Single task blocked
- **Blast Radius:** All new tasks blocked until resolved

**Root Causes:**

- Bug in routing logic
- Malformed task input
- Invalid routing rules
- Circular dependency in rules

**Detection:**

- Exception caught in Chief of Staff
- Alert: `framework.routing.error` telemetry event
- Slack notification to #framework-alerts

**Recovery Strategy:**

1. **Immediate Fallback (Automatic):**

   ```typescript
   try {
     const decision = await RoutingOptimizer.determineRoute(task);
   } catch (error) {
     // Fallback to default routing chain
     const decision = {
       targetAgent: 'product-owner',
       skipAgents: [],
       reason: 'Routing optimizer failed - using default chain',
       confidence: 1.0,
       expressLane: false,
     };
   }
   ```

2. **Manual Investigation:**
   - Check routing rules for errors
   - Validate task input
   - Review stack trace

3. **Fix & Redeploy:**
   - Patch routing optimizer
   - Deploy fix
   - Retry failed task

**Prevention:**

- 100% test coverage for routing optimizer
- Schema validation for routing rules
- Dead lock detection at startup

**SLO Impact:** Minimal (automatic fallback to default routing)

---

### FM-002: Quality Gate Timeout

**Component:** `parallel-quality-gates.ts`

**Failure Scenario:** Quality gate exceeds 5-minute timeout

**Symptoms:**

- Gate in `running` state for >5 minutes
- No progress updates
- Task stuck in QA phase

**Impact:**

- **Severity:** Medium
- **Scope:** Single task
- **Blast Radius:** Gates after this one in dependency chain

**Root Causes:**

- Hung process (infinite loop in test)
- Network timeout (external API call in test)
- Resource exhaustion (out of memory)

**Detection:**

- Gate timeout after 5 minutes
- Alert: `gate.timeout` telemetry event
- Slack notification to #quality-alerts

**Recovery Strategy:**

1. **Automatic Timeout (5 minutes):**

   ```typescript
   const timeout = new Promise((_, reject) =>
     setTimeout(() => reject(new Error(`Gate ${gate.id} timeout`)), 300000)
   );
   const result = await Promise.race([gate.validator(), timeout]);
   ```

2. **Kill Hung Process:**

   ```typescript
   if (gateProcess.pid) {
     process.kill(gateProcess.pid, 'SIGKILL');
   }
   ```

3. **Mark Gate as Failed:**

   ```typescript
   return {
     gate: gate.id,
     passed: false,
     duration: 300000,
     errors: ['Gate timeout after 5 minutes'],
   };
   ```

4. **Abort Remaining Gates:**
   - If blocking gate, abort task
   - If non-blocking gate, continue

**Prevention:**

- Set timeouts on all external calls (npm commands, API requests)
- Process isolation (separate process per gate)
- Resource limits (max CPU, max memory)

**SLO Impact:** Medium (task fails, requires retry)

---

### FM-003: Parallel Quality Gate Deadlock

**Component:** `parallel-quality-gates.ts`

**Failure Scenario:** Circular dependency in quality gate dependencies

**Symptoms:**

- All gates in `pending` state
- No gates executing
- Task stuck indefinitely

**Impact:**

- **Severity:** Critical
- **Scope:** Single task
- **Blast Radius:** All tasks (framework hangs)

**Root Causes:**

- Invalid dependency graph (G1 depends on G2, G2 depends on G1)
- Bug in dependency resolution

**Detection:**

- No gates start after 1 minute
- Alert: `gate.deadlock` telemetry event
- Emergency alert to PagerDuty

**Recovery Strategy:**

1. **Detect Deadlock:**

   ```typescript
   function detectCycle(graph: QualityGate[]): boolean {
     // Topological sort - if fails, cycle exists
     try {
       topologicalSort(graph);
       return false; // No cycle
     } catch (error) {
       return true; // Cycle detected
     }
   }
   ```

2. **Prevent Startup if Deadlock Exists:**

   ```typescript
   // At framework startup
   if (detectCycle(QUALITY_GATES)) {
     throw new DeadlockError('Circular dependency in quality gates');
   }
   ```

3. **Manual Intervention:**
   - Fix quality gate dependencies
   - Restart framework

**Prevention:**

- Validate dependency graph at startup
- Unit tests for topological sort
- No circular dependencies allowed (enforced)

**SLO Impact:** Critical (framework unusable until fixed)

---

### FM-004: Telemetry System Failure

**Component:** `telemetry.ts`

**Failure Scenario:** Telemetry storage unavailable (disk full, permission
denied)

**Symptoms:**

- Telemetry writes fail
- Error in logs: `TelemetryError: write failed`
- Events buffered in memory

**Impact:**

- **Severity:** Low (non-blocking)
- **Scope:** Observability degraded
- **Blast Radius:** No impact on task execution

**Root Causes:**

- Disk full
- Permission denied
- File system corruption

**Detection:**

- Exception on write
- Alert: `telemetry.write.error` event (ironic)
- Slack notification to #framework-alerts

**Recovery Strategy:**

1. **Non-Blocking (Continue Task Execution):**

   ```typescript
   try {
     await fs.appendFile('telemetry.jsonl', event);
   } catch (error) {
     console.warn('Telemetry write failed, buffering in memory');
     // Continue execution - telemetry is not critical
   }
   ```

2. **Buffer in Memory:**

   ```typescript
   const buffer: TelemetryEvent[] = [];
   const MAX_BUFFER_SIZE = 1000;

   function bufferEvent(event: TelemetryEvent) {
     if (buffer.length < MAX_BUFFER_SIZE) {
       buffer.push(event);
     } else {
       buffer.shift(); // Drop oldest event
       buffer.push(event);
     }
   }
   ```

3. **Retry Writes (Every 30 seconds):**

   ```typescript
   setInterval(async () => {
     if (buffer.length > 0) {
       try {
         await flushBuffer(buffer);
         buffer.length = 0; // Clear buffer on success
       } catch (error) {
         // Retry next interval
       }
     }
   }, 30000);
   ```

4. **Drop Oldest Events if Buffer Full:**
   - FIFO eviction when buffer exceeds 1,000 events

**Prevention:**

- Monitor disk space (alert at 80%)
- File permission checks at startup
- Circuit breaker after 3 consecutive failures

**SLO Impact:** None (telemetry is non-blocking)

---

### FM-005: Context Cache Corruption

**Component:** `context-cache.ts`

**Failure Scenario:** Cached context is stale or corrupted

**Symptoms:**

- Agents receive outdated context
- Decisions based on old data
- Inconsistent behavior

**Impact:**

- **Severity:** Medium
- **Scope:** All agents using cached context
- **Blast Radius:** Incorrect decisions, quality degradation

**Root Causes:**

- File watcher failure (didn't invalidate on change)
- Race condition (read during write)
- TTL expired but not evicted

**Detection:**

- Manual: Agent reports working with old data
- Automated: Cache age monitoring (alert if entry >2 hours old)

**Recovery Strategy:**

1. **File Watching (Auto-Invalidation):**

   ```typescript
   watch(
     '.github/.system-state/',
     { recursive: true },
     (eventType, filename) => {
       if (eventType === 'change') {
         ContextCache.invalidateByTag('model');
       }
     }
   );
   ```

2. **TTL Enforcement:**

   ```typescript
   async get(key: string): Promise<string | null> {
     const entry = this.cache.get(key)
     if (!entry) return null

     if (Date.now() > entry.expiresAt) {
       this.cache.delete(key) // Evict expired entry
       return null
     }

     return entry.value
   }
   ```

3. **Manual Cache Clear:**

   ```bash
   npm run framework:cache:clear
   ```

4. **Validation (Future Enhancement):**
   ```typescript
   // Compare cached content with disk content
   const cached = await ContextCache.get('repo:structure:v1');
   const actual = await loadRepoStructure();
   if (cached !== actual) {
     console.warn('Cache mismatch detected, invalidating');
     await ContextCache.invalidate('repo:structure:v1');
   }
   ```

**Prevention:**

- File watcher health checks (alert if watcher dies)
- Aggressive TTL (1 hour max)
- Periodic cache validation (daily)

**SLO Impact:** Medium (incorrect decisions, but recoverable)

---

### FM-006: Agent Failure (Unhandled Exception)

**Component:** Any agent

**Failure Scenario:** Agent throws unhandled exception, exits early

**Symptoms:**

- Agent process exits with non-zero code
- Task stuck in `in-progress` state
- Handoff not created

**Impact:**

- **Severity:** Medium
- **Scope:** Single task
- **Blast Radius:** Task fails, requires retry

**Root Causes:**

- Bug in agent code
- Unexpected input
- External dependency failure (API timeout, etc.)

**Detection:**

- Agent process exit code ≠ 0
- Alert: `agent.failed` telemetry event
- Slack notification to #agent-errors

**Recovery Strategy:**

1. **Catch Exceptions (Agent Wrapper):**

   ```typescript
   try {
     await agent.execute(task);
   } catch (error) {
     console.error(`Agent ${agent.id} failed: ${error.message}`);
     await Telemetry.track({
       eventType: 'agent.failed',
       taskId: task.id,
       agentId: agent.id,
       metadata: { error: error.message, stack: error.stack },
     });

     // Mark task as failed
     task.status = 'failed';
   }
   ```

2. **Notify Quality Director:**
   - Quality Director reviews failed task
   - Determines if retry needed

3. **Retry Logic (Optional):**

   ```typescript
   const MAX_RETRIES = 2;
   let retries = 0;

   while (retries < MAX_RETRIES) {
     try {
       await agent.execute(task);
       break; // Success
     } catch (error) {
       retries++;
       if (retries >= MAX_RETRIES) {
         task.status = 'failed';
       }
     }
   }
   ```

**Prevention:**

- Comprehensive error handling in agents
- Input validation before processing
- Timeout on external calls

**SLO Impact:** Medium (task fails but retryable)

---

### FM-007: Handoff v2 Protocol Failure

**Component:** `handoff-manager.ts`

**Failure Scenario:** Handoff v2 serialization/deserialization fails

**Symptoms:**

- Handoff file malformed
- Recipient agent cannot parse handoff
- Task stuck

**Impact:**

- **Severity:** Medium
- **Scope:** Single task
- **Blast Radius:** Task fails, requires retry

**Root Causes:**

- Bug in serialization logic
- Delta computation error
- Context reference invalid

**Detection:**

- JSON parse error
- Schema validation failure
- Alert: `handoff.corruption` telemetry event

**Recovery Strategy:**

1. **Fallback to Handoff v1:**

   ```typescript
   try {
     const handoffV2 = await createHandoffV2(from, to, taskId, delta);
     await deliverHandoff(handoffV2);
   } catch (error) {
     console.warn('HandoffV2 failed, falling back to V1');
     const handoffV1 = await createHandoffV1(from, to, task);
     await deliverHandoff(handoffV1);
   }
   ```

2. **Validate Handoff Before Delivery:**

   ```typescript
   function validateHandoff(handoff: Handoff): void {
     if (handoff.version === 2) {
       if (!handoff.taskId) throw new ValidationError('taskId required');
       if (!handoff.delta) throw new ValidationError('delta required');
     }
   }
   ```

3. **Retry with V1:**
   - If V2 fails, always retry with V1 (guaranteed to work)

**Prevention:**

- Schema validation on all handoffs
- Unit tests for serialization/deserialization
- Feature flag to disable V2 if issues persist

**SLO Impact:** Low (automatic fallback to V1)

---

### FM-008: Learning System Poisoning

**Component:** `learning-engine.ts`

**Failure Scenario:** Malicious tasks poison pattern database

**Symptoms:**

- Routing success rate decreases
- Low-confidence patterns suggested
- Incorrect routes taken

**Impact:**

- **Severity:** Low
- **Scope:** Future tasks
- **Blast Radius:** Routing degradation over time

**Root Causes:**

- Many failed tasks with specific pattern
- Attacker submits fake tasks
- Bug in learning logic

**Detection:**

- Success rate drop >10% (monitored)
- Alert: `learning.degradation` telemetry event
- Manual: Chief of Staff notices poor routing

**Recovery Strategy:**

1. **Confidence Threshold:**

   ```typescript
   if (pattern.confidence < 0.8) {
     console.warn(`Low-confidence pattern ignored: ${pattern.signature}`);
     // Fall back to rule-based routing
   }
   ```

2. **Sample Count Requirement:**

   ```typescript
   if (pattern.sampleCount < 5) {
     console.warn(`Insufficient samples for pattern: ${pattern.signature}`);
     // Don't use pattern yet
   }
   ```

3. **Manual Pattern Pruning:**

   ```bash
   npm run framework:learning:prune
   # Removes all patterns with confidence <0.5
   ```

4. **Rollback Pattern Database:**
   ```bash
   npm run framework:learning:rollback --date 2026-02-20
   # Restore patterns from specific date
   ```

**Prevention:**

- Min sample count (5 tasks) before trusting pattern
- Confidence decay (patterns older than 30 days decay)
- Manual review of suggested rule updates

**SLO Impact:** Low (routing fallback to rules)

---

### FM-009: Task Scheduler Queue Overflow

**Component:** `task-scheduler.ts`

**Failure Scenario:** More than 100 tasks queued (max queue size)

**Symptoms:**

- New tasks rejected
- Error: `CapacityError: Task queue full`
- Tasks not scheduled

**Impact:**

- **Severity:** Medium
- **Scope:** New tasks
- **Blast Radius:** All new tasks rejected until queue drains

**Root Causes:**

- Burst of task submissions
- Slow task execution (agents stuck)
- Resource exhaustion

**Detection:**

- Queue size monitoring
- Alert at 80 tasks queued
- Emergency alert at 100 tasks

**Recovery Strategy:**

1. **Backpressure (Reject New Tasks):**

   ```typescript
   if (queue.length >= MAX_QUEUE_SIZE) {
     throw new CapacityError('Task queue full, try again later');
   }
   ```

2. **Priority Eviction (Drop Low-Priority Tasks):**

   ```typescript
   if (queue.length >= MAX_QUEUE_SIZE && task.priority === 'P3') {
     const p3Tasks = queue.filter(t => t.priority === 'P3');
     if (p3Tasks.length > 0) {
       const dropped = p3Tasks.shift();
       console.warn(`Dropping low-priority task: ${dropped.id}`);
     }
   }
   ```

3. **Scale Concurrency:**
   ```typescript
   if (queue.length > 50) {
     // Increase max concurrent tasks from 4 to 8
     MAX_CONCURRENT_TASKS = 8;
   }
   ```

**Prevention:**

- Rate limiting (max 10 tasks/minute)
- Monitor queue size (alert at 80%)
- Auto-scaling (increase concurrency if queue fills)

**SLO Impact:** Medium (new tasks delayed)

---

### FM-010: File System Full

**Component:** Telemetry, Handoffs, Context Cache

**Failure Scenario:** Disk space exhausted

**Symptoms:**

- Writes fail (telemetry, handoffs)
- Error: `ENOSPC: no space left on device`
- Framework degraded

**Impact:**

- **Severity:** High
- **Scope:** All writes
- **Blast Radius:** Framework partially functional (reads OK, writes fail)

**Root Causes:**

- Telemetry retention not enforced
- Large handoff files accumulating
- Cache not evicting

**Detection:**

- Disk space monitoring (alert at 80%)
- Emergency alert at 95%
- Write failures

**Recovery Strategy:**

1. **Emergency Cleanup:**

   ```bash
   # Delete old telemetry files
   find .telemetry/ -type f -mtime +7 -delete

    # Delete old local handoff export snapshots (if present)
    find .telemetry/handoff-comments/ -type f -mtime +7 -delete
   ```

2. **Aggressive Eviction:**

   ```typescript
   // Context cache
   if (diskUsage > 0.9) {
     ContextCache.invalidateAll(); // Clear entire cache
   }
   ```

3. **Disable Non-Essential Writes:**

   ```typescript
   if (diskUsage > 0.95) {
     TELEMETRY_ENABLED = false; // Stop telemetry writes
   }
   ```

4. **Alert Engineering:**
   - PagerDuty alert
   - Manual intervention required

**Prevention:**

- Automated cleanup (daily cron job)
- Retention policies enforced (30 days max)
- Disk space monitoring

**SLO Impact:** High (framework degraded, manual intervention required)

---

## Circuit Breakers

### CB-001: Telemetry Write Circuit Breaker

**Threshold:** 3 consecutive write failures

**Behavior:**

- Open circuit (stop writes)
- Retry after 5 minutes
- Close circuit if write succeeds

**Implementation:**

```typescript
class TelemetryCircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' = 'closed';
  private lastAttempt: Date | null = null;

  async write(event: TelemetryEvent): Promise<void> {
    if (this.state === 'open') {
      // Check if 5 minutes have passed
      if (Date.now() - this.lastAttempt!.getTime() > 300000) {
        this.state = 'closed'; // Retry
        this.failures = 0;
      } else {
        throw new Error('Circuit breaker open');
      }
    }

    try {
      await fs.appendFile('telemetry.jsonl', JSON.stringify(event) + '\n');
      this.failures = 0; // Reset on success
    } catch (error) {
      this.failures++;
      this.lastAttempt = new Date();

      if (this.failures >= 3) {
        this.state = 'open';
        console.warn('Telemetry circuit breaker opened');
      }

      throw error;
    }
  }
}
```

---

### CB-002: Context Cache File Watcher Circuit Breaker

**Threshold:** File watcher crashes 3 times

**Behavior:**

- Stop file watching
- Fall back to TTL-only cache expiration
- Alert engineering

**Implementation:**

```typescript
class FileWatcherCircuitBreaker {
  private crashes = 0;

  startWatcher() {
    try {
      const watcher = watch(
        '.github/.system-state/',
        { recursive: true },
        this.handleChange
      );

      watcher.on('error', error => {
        this.crashes++;
        if (this.crashes >= 3) {
          console.error('File watcher circuit breaker opened');
          watcher.close();
          // Fall back to TTL-only expiration
        } else {
          // Restart watcher
          this.startWatcher();
        }
      });
    } catch (error) {
      console.error('File watcher failed to start');
    }
  }
}
```

---

## Retry Policies

### RP-001: Agent Execution Retry

**Retries:** 2  
**Backoff:** None (immediate retry)  
**Conditions:** Agent exits with error **Example:**

```typescript
const MAX_RETRIES = 2;
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    await agent.execute(task);
    break; // Success
  } catch (error) {
    if (attempt === MAX_RETRIES - 1) {
      task.status = 'failed'; // Give up
    }
  }
}
```

---

### RP-002: Telemetry Write Retry

**Retries:** Infinite  
**Backoff:** 30 seconds  
**Conditions:** Write failure (disk unavailable, permission denied)

**Example:**

```typescript
setInterval(async () => {
  if (buffer.length > 0) {
    try {
      await flushBuffer(buffer);
      buffer.length = 0; // Success
    } catch (error) {
      // Retry next interval (30 seconds)
    }
  }
}, 30000);
```

---

### RP-003: Quality Gate Retry

**Retries:** 1  
**Backoff:** 1 minute  
**Conditions:** Gate timeout or transient failure

**Example:**

```typescript
try {
  result = await runGate(gate);
} catch (error) {
  if (error.message.includes('timeout')) {
    console.warn('Gate timeout, retrying in 1 minute');
    await sleep(60000);
    result = await runGate(gate); // Retry once
  }
}
```

---

## Recovery Time Objectives (RTO)

| Failure Mode                  | Detection Time | Recovery Time | Total RTO |
| ----------------------------- | -------------- | ------------- | --------- |
| FM-001: Routing Optimizer     | <1 sec         | <1 sec        | <2 sec    |
| FM-002: Quality Gate Timeout  | 5 min          | <1 min        | 6 min     |
| FM-003: Quality Gate Deadlock | <1 sec         | Manual        | Variable  |
| FM-004: Telemetry Failure     | <1 sec         | Non-blocking  | 0 sec     |
| FM-005: Cache Corruption      | Manual         | <1 min        | Variable  |
| FM-006: Agent Failure         | <1 sec         | <5 sec        | <6 sec    |
| FM-007: Handoff v2 Failure    | <1 sec         | <1 sec        | <2 sec    |
| FM-008: Learning Poisoning    | Manual         | Manual        | Variable  |
| FM-009: Queue Overflow        | <1 sec         | Auto-scale    | <5 min    |
| FM-010: Disk Full             | <1 min         | Manual        | Variable  |

**Goal:** All automatic recoveries <5 minutes

---

## Testing Resilience

### Chaos Engineering

**Tests:**

1. **Kill Agent Mid-Execution:** `kill -9 <agent-pid>` → Validate task marked as
   failed
2. **Fill Disk:** `dd if=/dev/zero of=/tmp/bigfile` → Validate telemetry circuit
   breaker opens
3. **Corrupt Handoff File:** Modify handoff JSON → Validate fallback to V1
4. **Circular Dependency:** Add G1 depends on G10, G10 depends on G1 → Validate
   deadlock detection
5. **Poison Learning System:** Submit 100 fake tasks → Validate confidence
   threshold prevents bad routing

**Frequency:** Monthly

---

## References

- **GitHub Issue:** #25
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Security:** [SECURITY.md](SECURITY.md)
- **ADRs:** `.github/DECISIONS/framework/`

---

**Authored by:** Solution Architect  
**Reviewed by:** (Pending - SRE Engineer)  
**Approved by:** (Pending)
