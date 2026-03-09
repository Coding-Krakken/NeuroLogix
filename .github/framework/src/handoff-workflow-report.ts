import {
  analyzeHandoffWorkflow,
  type HandoffWorkflowEvent,
  type HandoffWorkflowReport,
  type WorkflowLogEntry,
} from "./handoff-workflow-tracker.js";

const toEventLabel = (event: HandoffWorkflowEvent): string => {
  if (event.kind === "dispatch") {
    const target = event.targetAgent ?? "unknown";
    const exit =
      event.exitCode !== undefined ? ` exit=${String(event.exitCode)}` : "";
    return `dispatch -> ${target}${exit}`;
  }

  if (event.kind === "completion") {
    return "completion";
  }

  return "observation";
};

export const parseWorkflowLogText = (text: string): WorkflowLogEntry[] => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => ({ text: block }));
};

export const buildHandoffWorkflowReportFromText = (
  text: string,
): HandoffWorkflowReport => analyzeHandoffWorkflow(parseWorkflowLogText(text));

export const formatHandoffWorkflowReport = (
  report: HandoffWorkflowReport,
): string => {
  if (report.issues.length === 0) {
    return "No issue-linked workflow events found.";
  }

  const lines: string[] = [
    `Tracked issues: ${String(report.issues.length)}`,
    "",
  ];

  report.issues.forEach((issue, issueIndex) => {
    lines.push(
      `Issue #${String(issue.issueNumber)} | dispatches=${String(issue.dispatches)} | completions=${String(issue.completions)} | failedDispatches=${String(issue.failedDispatches)}`,
    );

    issue.events.forEach((event) => {
      lines.push(`- [${String(event.index)}] ${toEventLabel(event)}`);
      if (event.handoffArtifact) {
        lines.push(`  artifact: ${event.handoffArtifact}`);
      }
      if (event.handoffUrl) {
        lines.push(`  handoffUrl: ${event.handoffUrl}`);
      }
      if (event.nextTargetAgent) {
        lines.push(`  nextTarget: ${event.nextTargetAgent}`);
      }
    });

    if (issue.gaps.length === 0) {
      lines.push("Gaps: none");
    } else {
      lines.push("Gaps:");
      issue.gaps.forEach((gap) => {
        lines.push(`- ${gap}`);
      });
    }

    if (issueIndex < report.issues.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
};
