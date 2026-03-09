import { describe, it, expect } from "@jest/globals";
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const frameworkRoot = existsSync(
  resolve(process.cwd(), ".github", "framework", "package.json"),
)
  ? resolve(process.cwd(), ".github", "framework")
  : process.cwd();

interface RouterOutput {
  result: "pass" | "fail";
  invalidMetadata?: string[];
  classification: {
    severity: string;
    priority: string;
    type: string;
    risk: string;
  };
}

function runRouter(kind: "issue" | "pr", body: string): RouterOutput {
  const tempDir = mkdtempSync(join(tmpdir(), "router-test-"));
  const eventPath = join(tempDir, "event.json");
  const outputPath = join(tempDir, "output.json");

  const payload =
    kind === "pr"
      ? { pull_request: { body, labels: [] } }
      : { issue: { body, labels: [] } };

  writeFileSync(eventPath, JSON.stringify(payload));

  const command = [
    "node --loader ts-node/esm governance/deterministic-router.ts",
    `--kind ${kind}`,
    "--mode report",
    `--event-path "${eventPath}"`,
    `--output-path "${outputPath}"`,
  ].join(" ");

  execSync(command, { cwd: frameworkRoot, stdio: "pipe" });

  const raw = readFileSync(outputPath, "utf-8");
  rmSync(tempDir, { recursive: true, force: true });
  return JSON.parse(raw) as RouterOutput;
}

describe("deterministic router metadata parsing", () => {
  it("parses PR bullet-list metadata from deterministic template", () => {
    const body = [
      "## Linked Issues",
      "Closes #11",
      "",
      "## Work Item Metadata",
      "- Work Item Type: feature",
      "- Severity: S1",
      "- Priority: P1",
      "- Risk: high",
      "- Blast Radius: customer-visible",
      "- Component Area: backend",
      "- Deployment Surface: prod",
      "- Rollout Method: canary",
      "- Data Sensitivity: confidential",
      "",
      "## Risk Assessment",
      "ok",
      "## Testing Evidence",
      "ok",
      "## Observability Impact",
      "ok",
      "## Security & Privacy Checklist",
      "ok",
      "## Backward Compatibility & Migrations",
      "ok",
      "## Rollout and Rollback Plan",
      "ok",
      "## Documentation and Release",
      "ok",
      "## Acceptance Criteria Validation",
      "ok",
    ].join("\n");

    const output = runRouter("pr", body);
    expect(output.classification.severity).toBe("S1");
    expect(output.classification.priority).toBe("P1");
    expect(output.classification.type).toBe("feature");
  });

  it("parses issue-form heading metadata", () => {
    const body = [
      "### Work Item Type",
      "bug",
      "",
      "### Severity",
      "S0",
      "",
      "### Priority",
      "P0",
      "",
      "### Problem Statement",
      "Checkout is unavailable in production",
    ].join("\n");

    const output = runRouter("issue", body);
    expect(output.classification.severity).toBe("S0");
    expect(output.classification.priority).toBe("P0");
    expect(output.classification.type).toBe("bug");
  });

  it("parses quoted and multiline PR metadata values", () => {
    const body = [
      "## Linked Issues",
      "Closes #11",
      "",
      "## Work Item Metadata",
      '- Work Item Type: "feature"',
      "- Severity:",
      '  "S1"',
      "- Priority: 'P0'",
      "- Risk:",
      "  high",
      "- Blast Radius: customer-visible",
      "- Component Area: backend",
      "- Deployment Surface: prod",
      "- Rollout Method: canary",
      "- Data Sensitivity: confidential",
      "",
      "## Risk Assessment",
      "ok",
      "## Testing Evidence",
      "ok",
      "## Observability Impact",
      "ok",
      "## Security & Privacy Checklist",
      "ok",
      "## Backward Compatibility & Migrations",
      "ok",
      "## Rollout and Rollback Plan",
      "ok",
      "## Documentation and Release",
      "ok",
      "## Acceptance Criteria Validation",
      "ok",
    ].join("\n");

    const output = runRouter("pr", body);
    expect(output.classification.type).toBe("feature");
    expect(output.classification.severity).toBe("S1");
    expect(output.classification.priority).toBe("P0");
    expect(output.classification.risk).toBe("high");
  });

  it("normalizes human-friendly severity/priority values", () => {
    const body = [
      "## Linked Issues",
      "Closes #11",
      "",
      "## Work Item Metadata",
      "- Work Item Type: feature",
      "- Severity: S1 (High)",
      "- Priority: P0 (Emergency)",
      "- Risk: high",
      "- Blast Radius: customer-visible",
      "- Component Area: backend",
      "- Deployment Surface: prod",
      "- Rollout Method: canary",
      "- Data Sensitivity: confidential",
      "",
      "## Risk Assessment",
      "ok",
      "## Testing Evidence",
      "ok",
      "## Observability Impact",
      "ok",
      "## Security & Privacy Checklist",
      "ok",
      "## Backward Compatibility & Migrations",
      "ok",
      "## Rollout and Rollback Plan",
      "ok",
      "## Documentation and Release",
      "ok",
      "## Acceptance Criteria Validation",
      "ok",
    ].join("\n");

    const output = runRouter("pr", body);
    expect(output.classification.severity).toBe("S1");
    expect(output.classification.priority).toBe("P0");
    expect(output.result).toBe("pass");
  });

  it("flags invalid enum metadata values", () => {
    const body = [
      "## Linked Issues",
      "Closes #11",
      "",
      "## Work Item Metadata",
      "- Work Item Type: feature",
      "- Severity: S1",
      "- Priority: P1",
      "- Risk: urgent",
      "- Blast Radius: planet",
      "- Component Area: backend",
      "- Deployment Surface: prod",
      "- Rollout Method: canary",
      "- Data Sensitivity: confidential",
      "",
      "## Risk Assessment",
      "ok",
      "## Testing Evidence",
      "ok",
      "## Observability Impact",
      "ok",
      "## Security & Privacy Checklist",
      "ok",
      "## Backward Compatibility & Migrations",
      "ok",
      "## Rollout and Rollback Plan",
      "ok",
      "## Documentation and Release",
      "ok",
      "## Acceptance Criteria Validation",
      "ok",
    ].join("\n");

    const output = runRouter("pr", body);
    expect(output.result).toBe("fail");
    expect(output.invalidMetadata).toEqual(
      expect.arrayContaining(["risk", "blastRadius"]),
    );
  });

  it("parses quoted issue heading metadata values", () => {
    const body = [
      "### Work Item Type",
      '"bug"',
      "",
      "### Severity",
      "'S0'",
      "",
      "### Priority",
      '"P1"',
      "",
      "### Problem Statement",
      "Checkout is unavailable in production",
    ].join("\n");

    const output = runRouter("issue", body);
    expect(output.classification.type).toBe("bug");
    expect(output.classification.severity).toBe("S0");
    expect(output.classification.priority).toBe("P1");
  });
});
