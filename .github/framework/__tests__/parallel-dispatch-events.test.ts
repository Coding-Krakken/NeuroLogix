import { describe, expect, it } from "@jest/globals";
import { DependencyGraphBuilder } from "../dependency-graph";
import { ParallelDispatchController } from "../parallel-dispatch-controller";
import { WaveScheduler } from "../wave-scheduler";
import { WorkflowTelemetry } from "../workflow-telemetry";

describe("ParallelDispatchController dispatch lifecycle events", () => {
  it("emits required metadata and deterministic sequence ordering", async () => {
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
    ]);

    const plan = scheduler.createPlan(graph.nodes);

    const execute = async (
      node: ReturnType<typeof scheduler.toRuntimeWave>["nodes"][number],
    ): Promise<void> => {
      if (node.nodeId === "B") {
        throw new Error("boom");
      }
    };

    const run = async (): Promise<string> => {
      const telemetry = new WorkflowTelemetry();
      const controller = new ParallelDispatchController(execute);
      const result = await controller.executeWave(
        scheduler.toRuntimeWave(plan, 0),
        {
          taskId: "TASK-B4",
          runId: "RUN-B4",
          schedulePlanHash: plan.schedulePlanHash,
        },
        {
          maxParallelAgents: 1,
          perPriorityCaps: { P0: 1, P1: 1, P2: 1, P3: 1 },
        },
        {
          maxRetries: 0,
        },
      );

      for (const event of result.events) {
        telemetry.trackHybridDispatchEvent("TASK-B4", event);
      }
      telemetry.trackHybridDispatchSummary("TASK-B4", result.summary);

      const seq = result.events.map((event) => event.seq);
      expect(seq).toEqual([...seq].sort((left, right) => left - right));

      for (const event of result.events) {
        expect(event.taskId).toBe("TASK-B4");
        expect(event.schedulePlanHash).toBe(plan.schedulePlanHash);
        expect(event.agentId).toBeDefined();
        expect(event.priority).toBeDefined();
      }

      const starts = result.events.filter(
        (event) => event.event === "hybrid.dispatch.start",
      );
      const terminals = result.events.filter(
        (event) => event.event !== "hybrid.dispatch.start",
      );
      expect(starts.length).toBe(terminals.length);

      expect(telemetry.getHybridDispatchEvents("TASK-B4").length).toBe(
        result.events.length,
      );
      expect(telemetry.getHybridDispatchSummary("TASK-B4").failed).toBe(1);

      return JSON.stringify({
        waves: plan.waves.map((wave) => wave.nodeIds),
        dispatchSequence: result.dispatchSequence,
        attemptTimeline: result.attemptTimeline,
        eventEnvelope: result.events.map((event) => ({
          seq: event.seq,
          event: event.event,
          nodeId: event.nodeId,
          waveIndex: event.waveIndex,
          attempt: event.attempt,
        })),
      });
    };

    const first = await run();
    const second = await run();

    expect(second).toBe(first);
  });
});
