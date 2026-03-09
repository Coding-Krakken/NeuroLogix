import { describe, expect, it } from "@jest/globals";
import { DependencyGraphBuilder } from "../dependency-graph";
import { ParallelDispatchController } from "../parallel-dispatch-controller";
import { WaveScheduler } from "../wave-scheduler";

describe("ParallelDispatchController timeout/retry policy", () => {
  it("retries with deterministic backoff and succeeds on final attempt", async () => {
    const builder = new DependencyGraphBuilder();
    const scheduler = new WaveScheduler();

    const graph = builder.build([
      {
        id: "A",
        title: "A",
        agent: "backend-engineer",
        dependsOn: [],
        priority: "P1",
      },
    ]);

    const delays: number[] = [];
    let attempts = 0;

    const controller = new ParallelDispatchController(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("failed attempt");
        }
      },
      () => Date.now(),
      async (milliseconds) => {
        delays.push(milliseconds);
      },
    );

    const plan = scheduler.createPlan(graph.nodes);
    const result = await controller.executeWave(
      scheduler.toRuntimeWave(plan, 0),
      {
        taskId: "TASK-B3-RETRY",
        runId: "RUN-B3-RETRY",
        schedulePlanHash: plan.schedulePlanHash,
      },
      undefined,
      {
        maxRetries: 2,
        backoffMs: 2000,
        backoffMultiplier: 2,
        attemptTimeoutMs: 100,
      },
    );

    expect(attempts).toBe(3);
    expect(delays).toEqual([2000, 4000]);
    expect(result.summary.retried).toBe(2);
    expect(result.summary.succeeded).toBe(1);
    expect(result.attemptTimeline.map((entry) => entry.status)).toEqual([
      "failure",
      "failure",
      "success",
    ]);
    expect(result.nodeStatuses.A).toBe("completed");
  });

  it("times out and fails after retry budget is exhausted", async () => {
    const builder = new DependencyGraphBuilder();
    const scheduler = new WaveScheduler();

    const graph = builder.build([
      {
        id: "A",
        title: "A",
        agent: "backend-engineer",
        dependsOn: [],
        priority: "P1",
      },
    ]);

    const delays: number[] = [];

    const controller = new ParallelDispatchController(
      async () =>
        new Promise<void>(() => {
          // Intentionally unresolved to trigger timeout.
        }),
      () => Date.now(),
      async (milliseconds) => {
        delays.push(milliseconds);
      },
    );

    const plan = scheduler.createPlan(graph.nodes);
    const result = await controller.executeWave(
      scheduler.toRuntimeWave(plan, 0),
      {
        taskId: "TASK-B3-TIMEOUT",
        runId: "RUN-B3-TIMEOUT",
        schedulePlanHash: plan.schedulePlanHash,
      },
      undefined,
      {
        maxRetries: 1,
        backoffMs: 5,
        backoffMultiplier: 2,
        attemptTimeoutMs: 1,
      },
    );

    expect(delays).toEqual([5]);
    expect(result.summary.timedOut).toBe(2);
    expect(result.summary.retried).toBe(1);
    expect(result.nodeStatuses.A).toBe("timed_out");
    expect(result.hasTerminalFailure).toBe(true);
  });
});
