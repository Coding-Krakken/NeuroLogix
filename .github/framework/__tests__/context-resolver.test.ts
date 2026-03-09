/**
 * Tests for Context Resolver
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ContextResolver } from "../context-resolver";

describe("ContextResolver", () => {
  let resolver: ContextResolver;

  beforeEach(() => {
    resolver = new ContextResolver();

    // Clear environment variables
    delete process.env.SUBZERO_REPO;
    delete process.env.SUBZERO_ISSUE;
    delete process.env.SUBZERO_PR;
    delete process.env.SUBZERO_AGENT;
    delete process.env.SUBZERO_NEXT_AGENT;
    delete process.env.SUBZERO_BRANCH;
    delete process.env.SUBZERO_RUN_ID;
    delete process.env.SUBZERO_TASK_ID;
  });

  describe("resolve with explicit config", () => {
    it("should use explicit config values", async () => {
      const context = await resolver.resolve({
        repo: "owner/repo",
        issueNumber: 42,
        prNumber: 123,
        branchName: "feature/42-test",
        agent: "frontend-engineer" as any,
        nextAgent: "backend-engineer" as any,
      });

      expect(context.repo).toBe("owner/repo");
      expect(context.issueNumber).toBe(42);
      expect(context.prNumber).toBe(123);
      expect(context.branchName).toBe("feature/42-test");
      expect(context.agent).toBe("frontend-engineer");
      expect(context.nextAgent).toBe("backend-engineer");
    });

    it("should default agent to chief-of-staff when not provided", async () => {
      const context = await resolver.resolve({
        repo: "owner/repo",
        issueNumber: 42,
        branchName: "feature/42-test",
      });

      expect(context.agent).toBe("00-chief-of-staff");
    });
  });

  describe("resolve with environment variables", () => {
    it("should read from environment variables", async () => {
      process.env.SUBZERO_REPO = "env/repo";
      process.env.SUBZERO_ISSUE = "99";
      process.env.SUBZERO_PR = "200";
      process.env.SUBZERO_BRANCH = "feature/99-env-test";
      process.env.SUBZERO_AGENT = "qa-test-engineer";
      process.env.SUBZERO_NEXT_AGENT = "security-engineer";

      const context = await resolver.resolve();

      expect(context.repo).toBe("env/repo");
      expect(context.issueNumber).toBe(99);
      expect(context.prNumber).toBe(200);
      expect(context.branchName).toBe("feature/99-env-test");
      expect(context.agent).toBe("qa-test-engineer");
      expect(context.nextAgent).toBe("security-engineer");
    });

    it("should prioritize explicit config over environment", async () => {
      process.env["SUBZERO_REPO"] = "env/repo";
      process.env["SUBZERO_ISSUE"] = "99";

      const context = await resolver.resolve({
        repo: "config/repo",
        issueNumber: 42,
        branchName: "feature/42-test",
      });

      expect(context.repo).toBe("config/repo");
      expect(context.issueNumber).toBe(42);
    });
  });

  describe("error handling", () => {
    it("should throw when repo cannot be resolved", async () => {
      jest
        .spyOn(resolver as any, "detectRepo")
        .mockResolvedValueOnce(undefined as never);

      await expect(
        resolver.resolve({
          issueNumber: 42,
          branchName: "feature/42-test",
        }),
      ).rejects.toThrow("Failed to resolve repository");
    });

    it("should throw when issue number cannot be resolved", async () => {
      jest
        .spyOn(resolver as any, "detectIssueFromBranch")
        .mockResolvedValueOnce(undefined as never);

      await expect(
        resolver.resolve({
          repo: "owner/repo",
          branchName: "main", // No issue number in branch name
        }),
      ).rejects.toThrow("Failed to resolve issue number");
    });

    it("should throw when branch name cannot be resolved", async () => {
      const branchResolver = new ContextResolver();
      jest
        .spyOn(branchResolver as any, "detectBranch")
        .mockResolvedValue(undefined as never);

      await expect(
        branchResolver.resolve({
          repo: "owner/repo",
          issueNumber: 42,
        }),
      ).rejects.toThrow("Failed to resolve branch name");
    });
  });

  describe("branch name pattern detection", () => {
    it("should extract issue number from feature branch", async () => {
      const mockResolver = new ContextResolver();
      jest
        .spyOn(mockResolver as any, "detectBranch")
        .mockResolvedValue("feature/42-my-feature" as never);
      jest
        .spyOn(mockResolver as any, "detectRepo")
        .mockResolvedValue("owner/repo" as never);

      const context = await mockResolver.resolve();

      expect(context.issueNumber).toBe(42);
    });

    it("should extract issue number from bugfix branch", async () => {
      const mockResolver = new ContextResolver();
      jest
        .spyOn(mockResolver as any, "detectBranch")
        .mockResolvedValue("bugfix/123-fix-bug" as never);
      jest
        .spyOn(mockResolver as any, "detectRepo")
        .mockResolvedValue("owner/repo" as never);

      const context = await mockResolver.resolve();

      expect(context.issueNumber).toBe(123);
    });

    it("should extract issue number from hotfix branch", async () => {
      const mockResolver = new ContextResolver();
      jest
        .spyOn(mockResolver as any, "detectBranch")
        .mockResolvedValue("hotfix/999-critical" as never);
      jest
        .spyOn(mockResolver as any, "detectRepo")
        .mockResolvedValue("owner/repo" as never);

      const context = await mockResolver.resolve();

      expect(context.issueNumber).toBe(999);
    });

    it("should return undefined for non-standard branch names", async () => {
      const mockResolver = new ContextResolver();
      jest
        .spyOn(mockResolver as any, "detectBranch")
        .mockResolvedValue("main" as never);
      jest
        .spyOn(mockResolver as any, "detectRepo")
        .mockResolvedValue("owner/repo" as never);

      await expect(mockResolver.resolve()).rejects.toThrow(
        "Failed to resolve issue number",
      );
    });
  });
});
