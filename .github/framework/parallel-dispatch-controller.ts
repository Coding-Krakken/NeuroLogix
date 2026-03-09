import type {
  DispatchAttemptRecord,
  DispatchConcurrencyLimits,
  DispatchLifecycleEvent,
  DispatchNodeStatus,
  DispatchPolicy,
  DispatchRunSummary,
  DispatchWaveResult,
  Priority,
  ScheduleWave,
  ScheduledNode,
} from "./types";
import { WaveScheduler } from "./wave-scheduler";

const DEFAULT_LIMITS: DispatchConcurrencyLimits = {
  maxParallelAgents: 4,
  perPriorityCaps: { P0: 4, P1: 3, P2: 2, P3: 1 },
};

const DEFAULT_POLICY: DispatchPolicy = {
  attemptTimeoutMs: 120_000,
  maxRetries: 2,
  backoffMs: 2_000,
  backoffMultiplier: 2,
  failFastFutureWaves: true,
};

interface QueueEntry {
  node: ScheduledNode;
  attempt: number;
}

export class ParallelDispatchController {
  private sequence = 0;

  constructor(
    private readonly executeNode: (
      node: ScheduledNode,
      attempt: number,
    ) => Promise<void>,
    private readonly now: () => number = (): number => Date.now(),
    private readonly sleep: (delayMs: number) => Promise<void> = async (
      delayMs: number,
    ): Promise<void> =>
      new Promise<void>((resolve): void => {
        setTimeout(resolve, delayMs);
      }),
  ) {}

  async executeWave(
    wave: ScheduleWave,
    state: {
      taskId: string;
      runId?: string;
      schedulePlanHash: string;
      nodeStatuses?: Record<string, DispatchNodeStatus>;
    },
    limits: Partial<DispatchConcurrencyLimits> = {},
    policy: Partial<DispatchPolicy> = {},
  ): Promise<DispatchWaveResult> {
    const effectiveLimits = this.resolveLimits(limits);
    const effectivePolicy = this.resolvePolicy(policy);

    const statusByNodeId: Record<string, DispatchNodeStatus> = {
      ...(state.nodeStatuses ?? {}),
    };

    for (const node of wave.nodes) {
      if (!statusByNodeId[node.nodeId]) {
        statusByNodeId[node.nodeId] = "queued";
      }
    }

    const runningByPriority: Record<Priority, number> = {
      P0: 0,
      P1: 0,
      P2: 0,
      P3: 0,
    };
    const running = new Map<string, Promise<void>>();
    const queue: QueueEntry[] = [...wave.nodes].map((node) => ({
      node,
      attempt: 1,
    }));
    const summary: DispatchRunSummary = {
      started: 0,
      succeeded: 0,
      failed: 0,
      timedOut: 0,
      retried: 0,
    };
    const dispatchSequence: Array<{ nodeId: string; attempt: number }> = [];
    const attemptTimeline: DispatchAttemptRecord[] = [];
    const events: DispatchLifecycleEvent[] = [];

    let hasTerminalFailure = false;

    while (queue.length > 0 || running.size > 0) {
      const candidateIndex = this.findDispatchableIndex(
        queue,
        statusByNodeId,
        runningByPriority,
        effectiveLimits,
      );

      if (candidateIndex >= 0) {
        const entry = queue.splice(candidateIndex, 1)[0];
        if (!entry) {
          continue;
        }

        const { node, attempt } = entry;
        statusByNodeId[node.nodeId] = "running";
        summary.started += 1;
        dispatchSequence.push({ nodeId: node.nodeId, attempt });

        events.push({
          event: "hybrid.dispatch.start",
          seq: this.nextSeq(),
          timestamp: new Date(),
          taskId: state.taskId,
          nodeId: node.nodeId,
          waveIndex: node.waveIndex,
          attempt,
          agentId: node.agentId,
          priority: node.priority,
          schedulePlanHash: state.schedulePlanHash,
        });

        runningByPriority[node.priority] += 1;
        const runningKey = `${node.nodeId}#${attempt}`;
        const startedAt = this.now();

        const runPromise = this.runAttempt(node, attempt, effectivePolicy)
          .then(async (result) => {
            running.delete(runningKey);
            runningByPriority[node.priority] -= 1;

            const durationMs = Math.max(0, this.now() - startedAt);
            attemptTimeline.push({
              nodeId: node.nodeId,
              waveIndex: node.waveIndex,
              attempt,
              status: result.status,
            });

            if (result.status === "success") {
              summary.succeeded += 1;
              statusByNodeId[node.nodeId] = "completed";
              events.push({
                event: "hybrid.dispatch.success",
                seq: this.nextSeq(),
                timestamp: new Date(),
                taskId: state.taskId,
                nodeId: node.nodeId,
                waveIndex: node.waveIndex,
                attempt,
                agentId: node.agentId,
                priority: node.priority,
                schedulePlanHash: state.schedulePlanHash,
                durationMs,
              });
              return;
            }

            if (result.status === "timeout") {
              summary.timedOut += 1;
              events.push({
                event: "hybrid.dispatch.timeout",
                seq: this.nextSeq(),
                timestamp: new Date(),
                taskId: state.taskId,
                nodeId: node.nodeId,
                waveIndex: node.waveIndex,
                attempt,
                agentId: node.agentId,
                priority: node.priority,
                schedulePlanHash: state.schedulePlanHash,
                durationMs,
                errorMessage: result.message,
              });
            } else {
              summary.failed += 1;
              events.push({
                event: "hybrid.dispatch.failure",
                seq: this.nextSeq(),
                timestamp: new Date(),
                taskId: state.taskId,
                nodeId: node.nodeId,
                waveIndex: node.waveIndex,
                attempt,
                agentId: node.agentId,
                priority: node.priority,
                schedulePlanHash: state.schedulePlanHash,
                durationMs,
                errorMessage: result.message,
              });
            }

            if (attempt <= effectivePolicy.maxRetries) {
              summary.retried += 1;
              statusByNodeId[node.nodeId] = "queued";
              const delayBeforeMs =
                effectivePolicy.backoffMs *
                effectivePolicy.backoffMultiplier ** (attempt - 1);
              await this.sleep(delayBeforeMs);
              queue.push({ node, attempt: attempt + 1 });
              queue.sort((left, right) =>
                this.compareQueueEntries(left, right),
              );
              return;
            }

            statusByNodeId[node.nodeId] =
              result.status === "timeout" ? "timed_out" : "failed";
            hasTerminalFailure = true;
          })
          .catch((error: unknown) => {
            running.delete(runningKey);
            runningByPriority[node.priority] -= 1;
            summary.failed += 1;
            statusByNodeId[node.nodeId] = "failed";
            hasTerminalFailure = true;
            attemptTimeline.push({
              nodeId: node.nodeId,
              waveIndex: node.waveIndex,
              attempt,
              status: "failure",
            });
            events.push({
              event: "hybrid.dispatch.failure",
              seq: this.nextSeq(),
              timestamp: new Date(),
              taskId: state.taskId,
              nodeId: node.nodeId,
              waveIndex: node.waveIndex,
              attempt,
              agentId: node.agentId,
              priority: node.priority,
              schedulePlanHash: state.schedulePlanHash,
              durationMs: Math.max(0, this.now() - startedAt),
              errorMessage:
                error instanceof Error ? error.message : String(error),
            });
          });

        running.set(runningKey, runPromise);
        this.assertConcurrency(runningByPriority, effectiveLimits);
        continue;
      }

      if (running.size === 0 && queue.length > 0) {
        const blocked = queue.shift();
        if (blocked) {
          statusByNodeId[blocked.node.nodeId] = "blocked";
          hasTerminalFailure = true;
        }
        continue;
      }

      await Promise.race(Array.from(running.values()));
    }

    return {
      nodeStatuses: statusByNodeId,
      dispatchSequence,
      attemptTimeline,
      events,
      summary,
      hasTerminalFailure,
    };
  }

  private resolveLimits(
    limits: Partial<DispatchConcurrencyLimits>,
  ): DispatchConcurrencyLimits {
    const caps = limits.perPriorityCaps ?? DEFAULT_LIMITS.perPriorityCaps;

    return {
      maxParallelAgents:
        limits.maxParallelAgents ?? DEFAULT_LIMITS.maxParallelAgents,
      perPriorityCaps: {
        P0: caps.P0,
        P1: caps.P1,
        P2: caps.P2,
        P3: caps.P3,
      },
    };
  }

  private resolvePolicy(policy: Partial<DispatchPolicy>): DispatchPolicy {
    return {
      attemptTimeoutMs:
        policy.attemptTimeoutMs ?? DEFAULT_POLICY.attemptTimeoutMs,
      maxRetries: policy.maxRetries ?? DEFAULT_POLICY.maxRetries,
      backoffMs: policy.backoffMs ?? DEFAULT_POLICY.backoffMs,
      backoffMultiplier:
        policy.backoffMultiplier ?? DEFAULT_POLICY.backoffMultiplier,
      failFastFutureWaves:
        policy.failFastFutureWaves ?? DEFAULT_POLICY.failFastFutureWaves,
    };
  }

  private compareQueueEntries(left: QueueEntry, right: QueueEntry): number {
    const byPriority = left.node.priorityRank - right.node.priorityRank;
    if (byPriority !== 0) {
      return byPriority;
    }

    return left.node.nodeId.localeCompare(right.node.nodeId);
  }

  private findDispatchableIndex(
    queue: QueueEntry[],
    statuses: Record<string, DispatchNodeStatus>,
    runningByPriority: Record<Priority, number>,
    limits: DispatchConcurrencyLimits,
  ): number {
    const runningTotal =
      runningByPriority.P0 +
      runningByPriority.P1 +
      runningByPriority.P2 +
      runningByPriority.P3;
    if (runningTotal >= limits.maxParallelAgents) {
      return -1;
    }

    for (let index = 0; index < queue.length; index += 1) {
      const entry = queue[index];
      if (!entry) {
        continue;
      }

      if (!WaveScheduler.isNodeReady(entry.node, statuses)) {
        continue;
      }

      if (
        runningByPriority[entry.node.priority] >=
        limits.perPriorityCaps[entry.node.priority]
      ) {
        continue;
      }

      return index;
    }

    return -1;
  }

  private async runAttempt(
    node: ScheduledNode,
    attempt: number,
    policy: DispatchPolicy,
  ): Promise<{ status: "success" | "failure" | "timeout"; message?: string }> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<{ status: "timeout" }>((resolve) => {
      timeoutHandle = setTimeout(() => {
        resolve({ status: "timeout" });
      }, policy.attemptTimeoutMs);
    });

    const executionPromise = this.executeNode(node, attempt)
      .then(() => ({ status: "success" as const }))
      .catch((error: unknown) => ({
        status: "failure" as const,
        message: error instanceof Error ? error.message : String(error),
      }));

    const result = await Promise.race([executionPromise, timeoutPromise]);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    if (result.status === "timeout") {
      return {
        status: "timeout",
        message: `Attempt exceeded timeout (${policy.attemptTimeoutMs}ms)`,
      };
    }

    return result;
  }

  private assertConcurrency(
    runningByPriority: Record<Priority, number>,
    limits: DispatchConcurrencyLimits,
  ): void {
    const runningTotal =
      runningByPriority.P0 +
      runningByPriority.P1 +
      runningByPriority.P2 +
      runningByPriority.P3;
    if (runningTotal > limits.maxParallelAgents) {
      throw new Error(
        "Concurrency invariant violated: runningTotal exceeded maxParallelAgents",
      );
    }

    if (runningByPriority.P0 > limits.perPriorityCaps.P0) {
      throw new Error("Concurrency invariant violated for P0");
    }

    if (runningByPriority.P1 > limits.perPriorityCaps.P1) {
      throw new Error("Concurrency invariant violated for P1");
    }

    if (runningByPriority.P2 > limits.perPriorityCaps.P2) {
      throw new Error("Concurrency invariant violated for P2");
    }

    if (runningByPriority.P3 > limits.perPriorityCaps.P3) {
      throw new Error("Concurrency invariant violated for P3");
    }
  }

  private nextSeq(): number {
    this.sequence += 1;
    return this.sequence;
  }
}
