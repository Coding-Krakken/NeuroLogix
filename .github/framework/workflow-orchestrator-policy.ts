/**
 * Workflow Orchestrator Policy
 *
 * Enforces Microsoft-grade GitHub discipline:
 * - No work without an issue
 * - Branch per issue
 * - Commit checkpoints on time/file thresholds
 * - PR opened when branch diverges meaningfully
 * - Review context read before coding
 */

import type {
  WorkflowEnforcementConfig,
  WorkflowPolicyDecision,
  WorkflowSnapshot,
} from "./types";

export const DEFAULT_WORKFLOW_ENFORCEMENT_CONFIG: WorkflowEnforcementConfig = {
  commitCheckpointMinutes: 20,
  commitCheckpointFilesChanged: 5,
  openPrWhenFilesChanged: 8,
  openPrWhenCommitsAhead: 4,
  tinyHotfixMaxFiles: 2,
};

export class WorkflowOrchestratorPolicy {
  private readonly config: WorkflowEnforcementConfig;

  constructor(config: Partial<WorkflowEnforcementConfig> = {}) {
    this.config = { ...DEFAULT_WORKFLOW_ENFORCEMENT_CONFIG, ...config };
  }

  evaluate(snapshot: WorkflowSnapshot): WorkflowPolicyDecision {
    const reasons: string[] = [];
    const requiredActions: string[] = [];
    const suggestions: string[] = [];

    const isTinyHotfix = this.isTinyHotfix(snapshot);

    if (!snapshot.issueNumber && !isTinyHotfix) {
      reasons.push("No GitHub issue is attached to this task");
      requiredActions.push(
        "Create or link a GitHub issue before continuing implementation",
      );
    }

    if (
      snapshot.issueNumber &&
      !this.branchMatchesIssue(snapshot.branchName, snapshot.issueNumber)
    ) {
      reasons.push(
        "Current branch does not follow issue branch naming convention",
      );
      requiredActions.push(
        `Create/switch to branch: feature/${snapshot.issueNumber}-short-slug or bugfix/${snapshot.issueNumber}-short-slug`,
      );
    }

    if (
      !snapshot.acceptanceCriteriaReviewed ||
      !snapshot.existingPrContextReviewed
    ) {
      reasons.push("Review-before-coding preflight is incomplete");
      requiredActions.push(
        "Review issue acceptance criteria and existing PR context before coding",
      );
    }

    if (
      snapshot.minutesSinceLastCommit >= this.config.commitCheckpointMinutes
    ) {
      requiredActions.push(
        `Create commit checkpoint now (last commit ${snapshot.minutesSinceLastCommit} minutes ago)`,
      );
    }

    if (snapshot.changedFiles >= this.config.commitCheckpointFilesChanged) {
      requiredActions.push(
        `Create commit checkpoint now (${snapshot.changedFiles} changed files exceeds threshold of ${this.config.commitCheckpointFilesChanged})`,
      );
    }

    if (
      !snapshot.openPullRequest &&
      (snapshot.changedFiles >= this.config.openPrWhenFilesChanged ||
        snapshot.commitsAheadOfMain >= this.config.openPrWhenCommitsAhead)
    ) {
      requiredActions.push(
        "Open pull request now; branch has diverged beyond PR threshold",
      );
    }

    if (!snapshot.testsUpdated) {
      suggestions.push("Add or update tests for behavior changes");
    }

    if (!snapshot.docsUpdated) {
      suggestions.push("Update documentation for workflow or behavior changes");
    }

    if (!snapshot.lintPassed || !snapshot.typecheckPassed) {
      suggestions.push("Run lint and typecheck before next commit checkpoint");
    }

    const blocked = reasons.length > 0;

    return {
      blocked,
      reasons,
      requiredActions: this.unique(requiredActions),
      suggestions: this.unique(suggestions),
      allowHotfixException: isTinyHotfix,
    };
  }

  private isTinyHotfix(snapshot: WorkflowSnapshot): boolean {
    const branch = snapshot.branchName ?? "";
    const isHotfixBranch = /^hotfix\//.test(branch);

    if (!isHotfixBranch) {
      return false;
    }

    return snapshot.changedFiles <= this.config.tinyHotfixMaxFiles;
  }

  private branchMatchesIssue(
    branchName: string | undefined,
    issueNumber: number,
  ): boolean {
    if (!branchName) {
      return false;
    }

    const branchPattern = new RegExp(
      `^(feature|bugfix|fix|chore|docs|hotfix)/${issueNumber}-[a-z0-9-]+$`,
    );
    return branchPattern.test(branchName);
  }

  private unique(values: string[]): string[] {
    return [...new Set(values)];
  }
}
