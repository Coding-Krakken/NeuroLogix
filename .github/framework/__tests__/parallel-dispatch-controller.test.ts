import { describe, expect, it } from "@jest/globals";
import { DependencyGraphBuilder } from "../dependency-graph";
import { ParallelDispatchController } from "../parallel-dispatch-controller";
import { WaveScheduler } from "../wave-scheduler";

describe("ParallelDispatchController concurrency + dependency semantics", () => {
  it("runs independent nodes in parallel and keeps dependent node in later wave", async () => {
    const builder = new DependencyGraphBuilder();
    const scheduler = new WaveScheduler();

    const graph = builder.build([
      {
        id: "A",
        title: "A",
        agent: "solution-architect",
        dependsOn: [],
        priority: "P2",
      },
      {
        id: "B",
        title: "B",
        agent: "backend-engineer",
        dependsOn: ["A"],
        priority: "P1",
      },
      {
        id: "C",
        title: "C",
        agent: "qa-test-engineer",
        dependsOn: ["A"],
        priority: "P0",
      },
      {
        id: "D",
        title: "D",
        agent: "tech-lead",
        dependsOn: ["B", "C"],
        priority: "P2",
      },
    ]);

    const plan = scheduler.createPlan(graph.nodes);
    const started: string[] = [];

    const controller = new ParallelDispatchController(async (node) => {
      started.push(node.nodeId);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5);
      });
    });

    const wave0 = await controller.executeWave(
      scheduler.toRuntimeWave(plan, 0),
      {
        taskId: "TASK-B1",
        runId: "RUN-B1",
        schedulePlanHash: plan.schedulePlanHash,
      },
    );

    const wave1 = await controller.executeWave(
      scheduler.toRuntimeWave(plan, 1),
      {
        taskId: "TASK-B1",
        runId: "RUN-B1",
        schedulePlanHash: plan.schedulePlanHash,
        nodeStatuses: wave0.nodeStatuses,
      },
      { maxParallelAgents: 2, perPriorityCaps: { P0: 1, P1: 1, P2: 1, P3: 1 } },
    );

    const wave2 = await controller.executeWave(
      scheduler.toRuntimeWave(plan, 2),
      {
        taskId: "TASK-B1",
        runId: "RUN-B1",
        schedulePlanHash: plan.schedulePlanHash,
        nodeStatuses: wave1.nodeStatuses,
      },
    );

    expect(started[0]).toBe("A");
    expect(
      started.slice(1, 3).sort((left, right) => left.localeCompare(right)),
    ).toEqual(["B", "C"]);
    expect(started.at(-1)).toBe("D");

    expect(wave0.nodeStatuses.A).toBe("completed");
    expect(wave1.nodeStatuses.B).toBe("completed");
    expect(wave1.nodeStatuses.C).toBe("completed");
    expect(wave2.nodeStatuses.D).toBe("completed");
  });

  it("enforces global and per-priority caps deterministically", async () => {
    const builder = new DependencyGraphBuilder();
    const scheduler = new WaveScheduler();

    const graph = builder.build([
      {
        id: "A",
        title: "A",
        agent: "solution-architect",
        dependsOn: [],
        priority: "P0",
      },
      {
        id: "B",
        title: "B",
        agent: "backend-engineer",
        dependsOn: [],
        priority: "P1",
      },
      {
        id: "C",
        title: "C",
        agent: "qa-test-engineer",
        dependsOn: [],
        priority: "P2",
      },
      {
        id: "D",
        title: "D",
        agent: "tech-lead",
        dependsOn: [],
        priority: "P2",
      },
    ]);

    let running = 0;
    let runningP2 = 0;
    let maxRunning = 0;
    let maxRunningP2 = 0;

    const controller = new ParallelDispatchController(async (node) => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);

      if (node.priority === "P2") {
        runningP2 += 1;
        maxRunningP2 = Math.max(maxRunningP2, runningP2);
      }

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 5);
      });

      running -= 1;
      if (node.priority === "P2") {
        runningP2 -= 1;
      }
    });

    const plan = scheduler.createPlan(graph.nodes);
    const result = await controller.executeWave(
      scheduler.toRuntimeWave(plan, 0),
      {
        taskId: "TASK-B2",
        runId: "RUN-B2",
        schedulePlanHash: plan.schedulePlanHash,
      },
      {
        maxParallelAgents: 2,
        perPriorityCaps: { P0: 1, P1: 1, P2: 1, P3: 1 },
      },
    );

    expect(maxRunning).toBeLessThanOrEqual(2);
    expect(maxRunningP2).toBeLessThanOrEqual(1);
    expect(result.dispatchSequence).toEqual([
      { nodeId: "A", attempt: 1 },
      { nodeId: "B", attempt: 1 },
      { nodeId: "C", attempt: 1 },
      { nodeId: "D", attempt: 1 },
    ]);
  });
});
