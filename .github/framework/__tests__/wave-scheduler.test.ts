import { describe, expect, it } from "@jest/globals";
import { DependencyGraphBuilder } from "../dependency-graph";
import { WaveScheduler } from "../wave-scheduler";

const builder = new DependencyGraphBuilder();
const scheduler = new WaveScheduler();

describe("WaveScheduler", () => {
  it("builds deterministic waves and plan hash for a mixed-priority diamond DAG", () => {
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
        priority: "P3",
      },
    ]);

    expect(graph.validation.valid).toBe(true);
    const plan = scheduler.createPlan(graph.nodes);

    expect(plan.waves.map((wave) => wave.nodeIds)).toEqual([
      ["A"],
      ["C", "B"],
      ["D"],
    ]);
    expect(
      plan.nodes
        .filter((node) => node.waveIndex === 1)
        .map((node) => `${node.nodeId}:${node.waveIndex}`),
    ).toEqual(["C:1", "B:1"]);
    expect(plan.schedulePlanHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces byte-identical plan and hash across replay runs", () => {
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
        priority: "P3",
      },
    ]);

    const baseline = scheduler.createPlan(graph.nodes);
    const baselineMaterial = JSON.stringify(baseline);

    for (let index = 0; index < 100; index += 1) {
      const replay = scheduler.createPlan(graph.nodes);
      const replayMaterial = JSON.stringify(replay);
      expect(replayMaterial).toBe(baselineMaterial);
    }
  });
});
