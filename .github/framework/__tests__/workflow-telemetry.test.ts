import { describe, it, expect } from "@jest/globals";
import { WorkflowTelemetry } from "../workflow-telemetry";

describe("WorkflowTelemetry", () => {
  it("tracks lifecycle metadata into final summary", () => {
    const telemetry = new WorkflowTelemetry();
    const taskId = "T-telemetry-1";

    telemetry.markTaskStart(taskId);
    telemetry.trackIssueCreated(
      taskId,
      42,
      "https://github.com/Coding-Krakken/.subzero/issues/42",
    );
    telemetry.trackBranchCreated(taskId, "feature/42-github-workflow");
    telemetry.trackCommit(
      taskId,
      "abc1234",
      "feat(framework): add orchestration policy (#42)",
    );
    telemetry.trackCommit(
      taskId,
      "def5678",
      "test(framework): add policy tests (#42)",
    );
    telemetry.trackPrOpened(
      taskId,
      100,
      "https://github.com/Coding-Krakken/.subzero/pull/100",
    );
    telemetry.trackReviewIteration(taskId);
    telemetry.markTaskCompleted(taskId);

    const summary = telemetry.buildFinalSummary(taskId);

    expect(summary.issueNumber).toBe(42);
    expect(summary.branchName).toBe("feature/42-github-workflow");
    expect(summary.pullRequestNumber).toBe(100);
    expect(summary.commits).toHaveLength(2);
    expect(summary.metrics.commitsPerTask).toBe(2);
    expect(summary.metrics.reviewIterations).toBe(1);
  });
});
