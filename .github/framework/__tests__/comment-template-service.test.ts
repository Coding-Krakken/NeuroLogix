/**
 * Tests for Comment Template Service
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { CommentTemplateService } from "../comment-template-service";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("CommentTemplateService", () => {
  let tempDir: string;
  let service: CommentTemplateService;

  beforeEach(async () => {
    // Create temporary directory for test templates
    tempDir = await mkdtemp(join(tmpdir(), "comment-template-test-"));
    service = new CommentTemplateService(tempDir);

    // Create a simple test template
    await writeFile(
      join(tempDir, "test.md"),
      `# Test Template

Agent: {{AGENT_NAME}}
Issue: #{{ISSUE_NUMBER}}
Status: {{STATUS}}

{{#if PR_NUMBER}}
PR: #{{PR_NUMBER}}
{{/if}}

Actions:
- {{ACTION_1}}
- {{ACTION_2}}`,
    );
  });

  afterEach(async () => {
    // Cleanup temp directory
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("render", () => {
    it("should render template with variables", async () => {
      const result = await service.render("test", {
        AGENT_NAME: "frontend-engineer",
        ISSUE_NUMBER: 42,
        STATUS: "Done",
        ACTION_1: "First action",
        ACTION_2: "Second action",
      });

      expect(result).toContain("Agent: frontend-engineer");
      expect(result).toContain("Issue: #42");
      expect(result).toContain("Status: Done");
      expect(result).toContain("- First action");
      expect(result).toContain("- Second action");
    });

    it("should handle conditional blocks when variable is truthy", async () => {
      const result = await service.render("test", {
        AGENT_NAME: "backend-engineer",
        ISSUE_NUMBER: 123,
        STATUS: "Partial",
        PR_NUMBER: 456,
        ACTION_1: "Action 1",
        ACTION_2: "Action 2",
      });

      expect(result).toContain("PR: #456");
    });

    it("should omit conditional blocks when variable is falsy", async () => {
      const result = await service.render("test", {
        AGENT_NAME: "backend-engineer",
        ISSUE_NUMBER: 123,
        STATUS: "Partial",
        ACTION_1: "Action 1",
        ACTION_2: "Action 2",
      });

      expect(result).not.toContain("PR:");
    });

    it("should throw error for missing template", async () => {
      await expect(service.render("nonexistent", {})).rejects.toThrow(
        'Failed to load template "nonexistent"',
      );
    });

    it("should cache loaded templates", async () => {
      // First load
      await service.render("test", {
        AGENT_NAME: "test",
        ISSUE_NUMBER: 1,
        STATUS: "Done",
        ACTION_1: "A",
        ACTION_2: "B",
      });

      // Second load should use cache
      await service.render("test", {
        AGENT_NAME: "test",
        ISSUE_NUMBER: 2,
        STATUS: "Done",
        ACTION_1: "A",
        ACTION_2: "B",
      });

      // Template should be cached (no additional file I/O)
      expect(service["templateCache"].has("test")).toBe(true);
    });
  });

  describe("validate", () => {
    it("should validate required fields for handoff template", () => {
      const result = service.validate("handoff", {
        AGENT_NAME: "frontend-engineer",
        ISSUE_NUMBER: 42,
        STATUS: "Done",
        TIMESTAMP: "2026-02-26T12:00:00Z",
        NEXT_AGENT_ID: "backend-engineer",
      });

      expect(result.valid).toBe(true);
      expect(result.missingRequired).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const result = service.validate("handoff", {
        AGENT_NAME: "frontend-engineer",
        // Missing ISSUE_NUMBER, STATUS, TIMESTAMP, NEXT_AGENT_ID
      });

      expect(result.valid).toBe(false);
      expect(result.missingRequired).toContain("ISSUE_NUMBER");
      expect(result.missingRequired).toContain("STATUS");
      expect(result.missingRequired).toContain("TIMESTAMP");
      expect(result.missingRequired).toContain("NEXT_AGENT_ID");
    });

    it("should handle empty string as missing", () => {
      const result = service.validate("handoff", {
        AGENT_NAME: "",
        ISSUE_NUMBER: 42,
        STATUS: "Done",
        TIMESTAMP: "2026-02-26T12:00:00Z",
        NEXT_AGENT_ID: "backend-engineer",
      });

      expect(result.valid).toBe(false);
      expect(result.missingRequired).toContain("AGENT_NAME");
    });
  });

  describe("clearCache", () => {
    it("should clear template cache", async () => {
      // Load template
      await service.render("test", {
        AGENT_NAME: "test",
        ISSUE_NUMBER: 1,
        STATUS: "Done",
        ACTION_1: "A",
        ACTION_2: "B",
      });
      expect(service["templateCache"].has("test")).toBe(true);

      // Clear cache
      service.clearCache();
      expect(service["templateCache"].has("test")).toBe(false);
    });
  });
});
