import { describe, expect, it } from "@jest/globals";

import {
  buildHandoffWorkflowReportFromText,
  formatHandoffWorkflowReport,
  parseWorkflowLogText,
} from "../src/handoff-workflow-report";

describe("handoff workflow report helpers", () => {
  it("parses multiline logs into entry blocks", () => {
    const entries = parseWorkflowLogText(
      [
        'code chat -m solution-architect --add-file c:/repo --add-file .github/.handoffs/solution-architect/handoff-20260301-issue16.md "Issue #16"',
        "",
        "### Dispatch Confirmation",
        "- Handoff comment posted: https://github.com/Coding-Krakken/.subzero/issues/16#issuecomment-3979432630",
        "- Dispatch artifact: `.github/.handoffs/solution-architect/handoff-20260301-issue16.md`",
      ].join("\n"),
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]?.text).toContain("code chat -m solution-architect");
    expect(entries[1]?.text).toContain("Dispatch Confirmation");
  });

  it("builds and formats per-issue timeline output", () => {
    const report = buildHandoffWorkflowReportFromText(
      [
        'code chat -m tech-lead --add-file c:/repo --add-file .github/.handoffs/tech-lead/handoff-20260301-issue15.md "Issue #15"',
        "",
        "Tech Lead execution complete for handoff (Issue #15).",
      ].join("\n"),
    );

    const output = formatHandoffWorkflowReport(report);

    expect(report.issues).toHaveLength(1);
    expect(report.issues[0]?.issueNumber).toBe(15);
    expect(output).toContain("Issue #15");
    expect(output).toContain("dispatches=1");
    expect(output).toContain("Gaps:");
  });

  it("returns friendly empty message when no issue data exists", () => {
    const report = buildHandoffWorkflowReportFromText(
      "No dispatch or issue references in this content.",
    );

    expect(formatHandoffWorkflowReport(report)).toBe(
      "No issue-linked workflow events found.",
    );
  });
});
