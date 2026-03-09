import { describe, it, expect } from '@jest/globals';
import { WorkflowOrchestratorPolicy } from '../workflow-orchestrator-policy';
import type { WorkflowSnapshot } from '../types';

describe('WorkflowOrchestratorPolicy', () => {
  const policy = new WorkflowOrchestratorPolicy({
    commitCheckpointMinutes: 15,
    commitCheckpointFilesChanged: 4,
    openPrWhenFilesChanged: 7,
    openPrWhenCommitsAhead: 3,
  });

  function createSnapshot(overrides: Partial<WorkflowSnapshot> = {}): WorkflowSnapshot {
    return {
      taskId: 'T-1',
      taskTitle: 'Enforce workflow',
      branchName: 'feature/12-enforce-workflow',
      issueNumber: 12,
      changedFiles: 2,
      commitsAheadOfMain: 1,
      minutesSinceLastCommit: 5,
      acceptanceCriteriaReviewed: true,
      existingPrContextReviewed: true,
      docsUpdated: true,
      testsUpdated: true,
      lintPassed: true,
      typecheckPassed: true,
      ...overrides,
    };
  }

  it('blocks tasks without a linked issue', () => {
    const missingIssue = policy.evaluate(
      createSnapshot({
        issueNumber: undefined,
        branchName: 'feature/no-issue-branch',
      })
    );

    expect(missingIssue.blocked).toBe(true);
    expect(
      missingIssue.requiredActions.some(item => /Create or link a GitHub issue/.test(item))
    ).toBe(true);
  });

  it('requires commit checkpoint after threshold breach', () => {
    const needsCommit = policy.evaluate(
      createSnapshot({
        minutesSinceLastCommit: 35,
        changedFiles: 6,
      })
    );

    expect(needsCommit.requiredActions.some(item => /commit checkpoint/i.test(item))).toBe(true);
  });

  it('requires PR opening when branch divergence exceeds limits', () => {
    const needsPr = policy.evaluate(
      createSnapshot({
        openPullRequest: undefined,
        commitsAheadOfMain: 5,
      })
    );

    expect(needsPr.requiredActions).toContain(
      'Open pull request now; branch has diverged beyond PR threshold'
    );
  });
});
