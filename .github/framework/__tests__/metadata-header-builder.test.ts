import { describe, it, expect } from "@jest/globals";
import { MetadataHeaderBuilder } from "../metadata-header-builder";

describe("MetadataHeaderBuilder", () => {
  it("should prioritize issue number for work item", () => {
    const header = MetadataHeaderBuilder.build({
      issueNumber: 24,
      prNumber: 105,
      chainTaskNumber: 3,
      targetAgent: "qa-test-engineer" as any,
    });

    expect(header).toBe("[Issue#24] [Task 3] [To: qa-test-engineer]");
  });

  it("should use PR number when issue is not available", () => {
    const header = MetadataHeaderBuilder.build({
      prNumber: 105,
      chainTaskNumber: 2,
      targetAgent: "security-engineer" as any,
    });

    expect(header).toBe("[PR#105] [Task 2] [To: security-engineer]");
  });

  it("should keep two-word task label", () => {
    const header = MetadataHeaderBuilder.build({
      taskLabel: "API Enhancement",
      chainTaskNumber: 2,
      targetAgent: "tech-lead" as any,
    });

    expect(header).toBe("[API Enhancement] [Task 2] [To: tech-lead]");
  });

  it("should auto-shorten long task labels to Task <id>", () => {
    const header = MetadataHeaderBuilder.build({
      taskLabel: "Implement pagination for warehouse API",
      taskId: "7",
      chainTaskNumber: 2,
      targetAgent: "tech-lead" as any,
    });

    expect(header).toBe("[Ref 7] [Task 2] [To: tech-lead]");
  });

  it("should default chain task number to Task 1", () => {
    const header = MetadataHeaderBuilder.build({
      taskLabel: "API Enhancement",
      targetAgent: "backend-engineer" as any,
    });

    expect(header).toBe("[API Enhancement] [Task 1] [To: backend-engineer]");
  });

  it("should default to Ref 1 when no work item identifier is provided", () => {
    const header = MetadataHeaderBuilder.build({
      targetAgent: "backend-engineer" as any,
    });

    expect(header).toBe("[Ref 1] [Task 1] [To: backend-engineer]");
  });
});
