import { describe, expect, it } from "@jest/globals";
import { ContextHierarchy } from "../context-hierarchy";
import type { HybridExecutionConfig } from "../types";

const createConfig = (
  memoryHierarchyEnabled: boolean,
): HybridExecutionConfig => ({
  mode: "hybrid",
  flags: {
    hybridOrchestrationEnabled: true,
    parallelGraphEnabled: false,
    memoryHierarchyEnabled,
  },
  maxContextTokens: 1_000,
  l1TokenBudget: 300,
  maxL2Comments: 2,
});

describe("ContextHierarchy", () => {
  it("returns L1/L2/L3 slices with token estimates when enabled", () => {
    const hierarchy = new ContextHierarchy(createConfig(true), {
      estimateTokens: (input) => Math.ceil(input.length / 5),
    });

    const result = hierarchy.compose({
      task: {
        id: "TASK-1",
        title: "Implement hybrid contracts",
        description: "Create Phase A foundational contracts",
        acceptanceCriteria: [
          "Acyclic graph validation",
          "Context slices + token estimates",
        ],
      },
      l2Items: [
        { source: "github://comment/1", content: "Recent handoff summary" },
        { source: "github://comment/2", content: "Second handoff summary" },
      ],
      l3Items: [
        {
          source: ".github/.system-state/model/system_state_model.yaml",
          content: "Canonical model",
        },
      ],
    });

    expect(result.truncated).toBe(false);
    expect(result.totalEstimatedTokens).toBeGreaterThan(0);
    expect(result.slices.map((slice) => slice.tier)).toEqual([
      "L1",
      "L2",
      "L2",
      "L3",
    ]);
    expect(result.slices.every((slice) => slice.estimatedTokens > 0)).toBe(
      true,
    );
  });

  it("returns empty slices when memory hierarchy flag is disabled", () => {
    const hierarchy = new ContextHierarchy(createConfig(false));

    const result = hierarchy.compose({
      task: {
        id: "TASK-2",
        title: "No memory hierarchy",
        description: "Sequential fallback path",
        acceptanceCriteria: ["No context composition"],
      },
      l2Items: [{ source: "github://comment/1", content: "ignored" }],
      l3Items: [{ source: "README.md", content: "ignored" }],
    });

    expect(result.slices).toEqual([]);
    expect(result.totalEstimatedTokens).toBe(0);
    expect(result.truncated).toBe(false);
  });
});
