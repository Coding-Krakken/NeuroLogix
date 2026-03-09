import { describe, expect, it } from "@jest/globals";

import { normalizeLifecycle } from "../src/normalize-lifecycle";
import { runFrameworkAudit } from "../src/run-framework-audit";

describe("framework API behavior", () => {
  describe("normalizeLifecycle", () => {
    it("normalizes aliases and separators", () => {
      expect(normalizeLifecycle(" smoke-validated ")).toBe("smoke_validated");
      expect(normalizeLifecycle("publish blocked")).toBe("publish_blocked");
      expect(normalizeLifecycle("PUBLISHED")).toBe("published");
    });

    it("throws for unsupported lifecycle values", () => {
      expect(() => normalizeLifecycle("invalid-state")).toThrow(
        "Unsupported lifecycle state",
      );
    });
  });

  describe("runFrameworkAudit", () => {
    it("uses defaults when options are omitted", async () => {
      await expect(runFrameworkAudit()).resolves.toEqual({
        taskId: "framework-audit",
        lifecycle: "candidate",
        completed: true,
      });
    });

    it("returns normalized lifecycle and provided task id", async () => {
      await expect(
        runFrameworkAudit({
          taskId: "issue-16-smoke",
          lifecycle: "smoke validated",
        }),
      ).resolves.toEqual({
        taskId: "issue-16-smoke",
        lifecycle: "smoke_validated",
        completed: true,
      });
    });

    it("rejects unsupported lifecycle values", async () => {
      expect(() =>
        runFrameworkAudit({ taskId: "issue-16-invalid", lifecycle: "unknown" }),
      ).toThrow("Unsupported lifecycle state");
    });
  });
});
