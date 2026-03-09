import { describe, expect, it } from "@jest/globals";

import { analyzeHandoffWorkflow } from "../src/handoff-workflow-tracker";

describe("analyzeHandoffWorkflow", () => {
  it("builds issue timelines from dispatch commands and confirmation comments", () => {
    const report = analyzeHandoffWorkflow([
      {
        text: 'code chat -m solution-architect --add-file "c:/repo" --add-file ".github/.handoffs/solution-architect/handoff-20260301-issue16-universal-framework-adoption-requirements.md" "Execute task. GitHub Issue #16."',
      },
      {
        text: "### Dispatch Confirmation\n- Handoff comment posted: https://github.com/Coding-Krakken/.subzero/issues/16#issuecomment-3979432630\n- Dispatch artifact: `.github/.handoffs/solution-architect/handoff-20260301-issue16-universal-framework-adoption-requirements.md`\n- Dispatch command executed to `solution-architect` via `code chat -m solution-architect --add-file <repo> --add-file <handoff>` (exit code `0`).\nNext routing target after product requirements refinement: `solution-architect`.",
      },
      {
        text: "Product Owner Task 1 complete for Issue #16.",
      },
      {
        text: 'code chat -m solution-architect --add-file "c:/repo" --add-file ".github/.handoffs/solution-architect/handoff-20260301-issue16-universal-framework-adoption-requirements.md" "[Issue#16] [Task 2] [To: solution-architect]\\nHandoff URL: https://github.com/Coding-Krakken/.subzero/issues/16#issuecomment-3979432630\\nExecute the task in the handoff file."',
      },
    ]);

    expect(report.issues).toHaveLength(1);

    const issue16 = report.issues[0];
    expect(issue16.issueNumber).toBe(16);
    expect(issue16.dispatches).toBe(3);
    expect(issue16.completions).toBe(1);
    expect(issue16.failedDispatches).toBe(0);
    expect(issue16.gaps).toHaveLength(0);
    expect(
      issue16.events.some(
        (event) =>
          event.kind === "dispatch" &&
          event.targetAgent === "solution-architect" &&
          event.handoffArtifact?.includes(
            ".github/.handoffs/solution-architect/",
          ),
      ),
    ).toBe(true);
  });

  it("detects non-zero exit code and missing follow-on dispatch", () => {
    const report = analyzeHandoffWorkflow([
      {
        text: "### Dispatch Confirmation\n- Dispatch artifact: `.github/.handoffs/tech-lead/handoff-20260301-issue16-task11-remediation-governance-completion.md`\n- Dispatch command executed to `tech-lead` via `code chat -m tech-lead --add-file <repo> --add-file <handoff>` (exit code `1`).\nNext routing target after remediation completion: `quality-director`.\nIssue #16",
      },
    ]);

    const issue16 = report.issues[0];
    expect(issue16.failedDispatches).toBe(1);
    expect(issue16.gaps).toEqual(
      expect.arrayContaining([
        "Dispatch to tech-lead failed with exit code 1.",
        "Next routing target quality-director was declared but no matching dispatch was found.",
      ]),
    );
  });

  it("groups multiple issues independently", () => {
    const report = analyzeHandoffWorkflow([
      {
        text: 'code chat -m tech-lead --add-file "c:/repo" --add-file ".github/.handoffs/tech-lead/handoff-20260301-063200-issue15-observability-architecture.md" "Execute. Issue #15"',
      },
      {
        text: 'code chat -m product-owner --add-file "c:/repo" --add-file ".github/.handoffs/product-owner/handoff-20260301-issue16-task1.md" "Execute. Issue #16"',
      },
    ]);

    expect(report.issues.map((issue) => issue.issueNumber)).toEqual([15, 16]);
    expect(report.issues[0].dispatches).toBe(1);
    expect(report.issues[1].dispatches).toBe(1);
  });
});
