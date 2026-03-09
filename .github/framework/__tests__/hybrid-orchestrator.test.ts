import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_HYBRID_CONFIG,
  HybridOrchestrator,
} from "../hybrid-orchestrator";
import type { HybridExecutionConfig } from "../types";

const baseRequest = {
  task: {
    id: "TASK-6",
    title: "Phase A",
    description: "Hybrid foundations",
    acceptanceCriteria: ["Context and graph contracts"],
  },
  graphNodes: [
    { id: "a", title: "A", agent: "solution-architect", dependsOn: [] },
    { id: "b", title: "B", agent: "tech-lead", dependsOn: ["a"] },
  ],
  l2Items: [{ source: "github://comment/1", content: "handoff context" }],
  l3Items: [
    {
      source: ".github/framework/ARCHITECTURE.md",
      content: "canonical architecture",
    },
  ],
};

describe("HybridOrchestrator", () => {
  it("falls back to sequential mode when hybrid is disabled", () => {
    const orchestrator = new HybridOrchestrator(DEFAULT_HYBRID_CONFIG);
    const result = orchestrator.execute(baseRequest);

    expect(result.mode).toBe("sequential");
    expect(result.fallbackReason).toContain("disabled");
    expect(result.context).toBeUndefined();
    expect(result.waves).toBeUndefined();
  });

  it("allows independent subsystem toggles", () => {
    const config: HybridExecutionConfig = {
      mode: "hybrid",
      flags: {
        hybridOrchestrationEnabled: true,
        parallelGraphEnabled: false,
        memoryHierarchyEnabled: true,
      },
      maxContextTokens: 2000,
      l1TokenBudget: 300,
      maxL2Comments: 2,
    };

    const orchestrator = new HybridOrchestrator(config);
    const result = orchestrator.execute(baseRequest);

    expect(orchestrator.isSubsystemEnabled("memoryHierarchyEnabled")).toBe(
      true,
    );
    expect(orchestrator.isSubsystemEnabled("parallelGraphEnabled")).toBe(false);
    expect(result.mode).toBe("hybrid");
    expect(result.context?.slices.length ?? 0).toBeGreaterThan(0);
    expect(result.waves).toBeUndefined();
  });

  it("throws when parallel graph is enabled and cycle exists", () => {
    const config: HybridExecutionConfig = {
      mode: "hybrid",
      flags: {
        hybridOrchestrationEnabled: true,
        parallelGraphEnabled: true,
        memoryHierarchyEnabled: false,
      },
      maxContextTokens: 2000,
      l1TokenBudget: 300,
      maxL2Comments: 2,
    };

    const orchestrator = new HybridOrchestrator(config);

    expect(() =>
      orchestrator.execute({
        ...baseRequest,
        graphNodes: [
          {
            id: "a",
            title: "A",
            agent: "solution-architect",
            dependsOn: ["b"],
          },
          { id: "b", title: "B", agent: "tech-lead", dependsOn: ["a"] },
        ],
      }),
    ).toThrow("Dependency graph validation failed");
  });

  it("returns deterministic schedule plan hash when parallel graph is enabled", () => {
    const config: HybridExecutionConfig = {
      mode: "hybrid",
      flags: {
        hybridOrchestrationEnabled: true,
        parallelGraphEnabled: true,
        memoryHierarchyEnabled: false,
      },
      maxContextTokens: 2000,
      l1TokenBudget: 300,
      maxL2Comments: 2,
    };

    const orchestrator = new HybridOrchestrator(config);
    const result = orchestrator.execute(baseRequest);

    expect(result.waves).toEqual([["a"], ["b"]]);
    expect(result.schedulePlanHash).toBeDefined();
    expect(result.schedulePlanHash?.length ?? 0).toBeGreaterThan(0);
  });
});
