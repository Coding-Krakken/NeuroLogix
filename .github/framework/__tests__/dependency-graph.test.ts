import { describe, expect, it } from "@jest/globals";
import { DependencyGraphBuilder } from "../dependency-graph";

describe("DependencyGraphBuilder", () => {
  const builder = new DependencyGraphBuilder();

  it("builds deterministic waves for an acyclic graph", () => {
    const plan = builder.build([
      { id: "b", title: "B", agent: "backend-engineer", dependsOn: ["a"] },
      { id: "a", title: "A", agent: "solution-architect", dependsOn: [] },
      { id: "c", title: "C", agent: "qa-test-engineer", dependsOn: ["a"] },
    ]);

    expect(plan.validation.valid).toBe(true);
    expect(plan.waves).toEqual([["a"], ["b", "c"]]);
  });

  it("reports cycle path for cyclic graph input", () => {
    const plan = builder.build([
      { id: "a", title: "A", agent: "solution-architect", dependsOn: ["c"] },
      { id: "b", title: "B", agent: "backend-engineer", dependsOn: ["a"] },
      { id: "c", title: "C", agent: "qa-test-engineer", dependsOn: ["b"] },
    ]);

    expect(plan.validation.valid).toBe(false);
    expect(plan.validation.cyclePath).toBeDefined();
    expect(plan.validation.cyclePath?.length ?? 0).toBeGreaterThan(0);
    expect(plan.validation.cyclePath?.[0]).toBe(
      plan.validation.cyclePath?.at(-1),
    );
  });
});
