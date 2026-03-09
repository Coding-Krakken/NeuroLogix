import { describe, expect, it } from "@jest/globals";

describe("public API surface contract", () => {
  it("exports only canonical allowed symbols", async () => {
    const api = await import("../src/index");
    const exportedKeys = Object.keys(api).sort();

    expect(exportedKeys).toEqual([
      "analyzeHandoffWorkflow",
      "normalizeLifecycle",
      "runFrameworkAudit",
      "workflowTelemetry",
    ]);
  });

  it("returns a telemetry instance from workflowTelemetry", async () => {
    const api = await import("../src/index");
    const telemetry = api.workflowTelemetry();

    expect(typeof telemetry.buildFinalSummary).toBe("function");
    expect(typeof telemetry.markTaskStart).toBe("function");
  });

  it("exposes callable audit and lifecycle helpers from index", async () => {
    const api = await import("../src/index");

    await expect(
      api.runFrameworkAudit({ taskId: "api-contract" }),
    ).resolves.toEqual(
      expect.objectContaining({
        taskId: "api-contract",
        lifecycle: "candidate",
        completed: true,
      }),
    );

    expect(api.normalizeLifecycle("smoke validated")).toBe("smoke_validated");

    const report = api.analyzeHandoffWorkflow([
      {
        text: 'code chat -m tech-lead --add-file "c:/repo" --add-file ".github/.handoffs/tech-lead/handoff-20260301-issue16.md" "Issue #16"',
      },
    ]);
    expect(report.issues[0]?.issueNumber).toBe(16);
  });
});
