/**
 * Tests for GitHub Handoff Provider
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GitHubHandoffProvider } from "../github-handoff-provider";
import type { WorkItemContext, HandoffCommentData } from "../types";

describe("GitHubHandoffProvider", () => {
  let provider: GitHubHandoffProvider;
  let mockContext: WorkItemContext;
  let mockHandoffData: HandoffCommentData;

  beforeEach(() => {
    // Set templates directory for tests (relative to framework root)
    const templatesDir = "../comment_templates";
    // Use dry-run mode for tests
    provider = new GitHubHandoffProvider(
      { dryRun: true, templatesDir },
      "pr_preferred",
    );

    mockContext = {
      repo: "owner/repo",
      issueNumber: 42,
      prNumber: 123,
      branchName: "feature/42-test-feature",
      agent: "frontend-engineer" as any,
      nextAgent: "backend-engineer" as any,
    };

    mockHandoffData = {
      agent: "frontend-engineer" as any,
      workItem: {
        issueNumber: 42,
        prNumber: 123,
      },
      status: "Done",
      scopeCompleted: [
        "Implemented UI components",
        "Added unit tests",
        "Updated documentation",
      ],
      keyDecisions: [
        {
          title: "Used React Query for state management",
          rationale: "Better caching and synchronization",
          alternatives: "Redux or Zustand",
        },
      ],
      changesSummary: {
        filesChanged: 5,
        linesAdded: 250,
        linesRemoved: 50,
        notableFiles: [
          {
            path: "src/components/NewComponent.tsx",
            description: "Main component",
          },
          { path: "src/hooks/useData.ts", description: "Data fetching hook" },
        ],
        commits: [
          { hash: "abc123", message: "feat: add new component" },
          { hash: "def456", message: "test: add component tests" },
        ],
      },
      verification: {
        commandsRun: ["npm test", "npm run lint", "npm run typecheck"],
        expectedOutcome: ["All tests pass", "No lint errors", "No type errors"],
        actualOutcome: ["✓ 15 tests passed", "✓ No issues", "✓ No errors"],
        status: "Passed",
      },
      risks: [
        "New dependency added (React Query)",
        "Breaking change in API interface",
      ],
      followUps: ["Update integration tests", "Add E2E tests"],
      nextAgent: "backend-engineer" as any,
      nextActions: [
        "Review frontend changes",
        "Implement matching API endpoints",
        "Update API documentation",
        "Run integration tests",
      ],
      links: {
        ciRunUrl: "https://github.com/owner/repo/actions/runs/123",
      },
    };
  });

  describe("postHandoff", () => {
    it("should post handoff comment in dry-run mode", async () => {
      const result = await provider.postHandoff(mockContext, mockHandoffData);

      expect(result.commentUrl).toBeDefined();
      expect(result.commentUrl).toContain("issuecomment");
      expect(result.commentId).toBe(9999999); // Dry-run ID
    });

    it("should prefer PR over Issue when PR exists", async () => {
      const result = await provider.postHandoff(mockContext, mockHandoffData);

      expect(result.commentUrl).toContain("/pull/123");
    });

    it("should fall back to Issue when no PR", async () => {
      const contextNoPR = { ...mockContext, prNumber: undefined };
      const result = await provider.postHandoff(contextNoPR, mockHandoffData);

      expect(result.commentUrl).toContain("/issues/42");
    });

    it("should update handoff data with comment URL", async () => {
      await provider.postHandoff(mockContext, mockHandoffData);

      expect(mockHandoffData.links.commentUrl).toBeDefined();
      expect(mockHandoffData.links.commentUrl).toContain("issuecomment");
    });
  });

  describe("readComments", () => {
    it("should return mock comments in dry-run mode", async () => {
      const comments = await provider.readComments(mockContext, 10);

      expect(comments).toHaveLength(2);
      expect(comments[0]).toContain("[DRY RUN]");
    });
  });

  describe("readIssue", () => {
    it("should return mock issue data in dry-run mode", async () => {
      const issue = await provider.readIssue(42);

      expect(issue.title).toContain("[DRY RUN]");
      expect(issue.body).toContain("[DRY RUN]");
    });
  });

  describe("readPR", () => {
    it("should return mock PR data in dry-run mode", async () => {
      const pr = await provider.readPR(123);

      expect(pr.title).toContain("[DRY RUN]");
      expect(pr.body).toContain("[DRY RUN]");
      expect(pr.state).toBe("OPEN");
    });
  });

  describe("getCIRunUrl", () => {
    it("should return mock CI URL in dry-run mode", async () => {
      const url = await provider.getCIRunUrl(123);

      expect(url).toContain("github.com");
      expect(url).toContain("actions/runs");
    });
  });

  describe("comment target resolution", () => {
    it("should use PR when commentTarget is pr_preferred and PR exists", async () => {
      const providerPRPreferred = new GitHubHandoffProvider(
        { dryRun: true, templatesDir: "../comment_templates" },
        "pr_preferred",
      );
      const result = await providerPRPreferred.postHandoff(
        mockContext,
        mockHandoffData,
      );

      expect(result.commentUrl).toContain("/pull/");
    });

    it("should use Issue when commentTarget is issue_only", async () => {
      const providerIssueOnly = new GitHubHandoffProvider(
        { dryRun: true, templatesDir: "../comment_templates" },
        "issue_only",
      );
      const result = await providerIssueOnly.postHandoff(
        mockContext,
        mockHandoffData,
      );

      expect(result.commentUrl).toContain("/issues/");
    });

    it("should throw when commentTarget is pr_only but no PR exists", async () => {
      const providerPROnly = new GitHubHandoffProvider(
        { dryRun: true, templatesDir: "../comment_templates" },
        "pr_only",
      );
      const contextNoPR = { ...mockContext, prNumber: undefined };

      await expect(
        providerPROnly.postHandoff(contextNoPR, mockHandoffData),
      ).rejects.toThrow("PR number required");
    });
  });
});
