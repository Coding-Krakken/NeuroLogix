/**
 * Workflow Telemetry
 *
 * Captures GitHub workflow metrics and emits traceable task summaries.
 */

import type {
  DispatchLifecycleEvent,
  DispatchRunSummary,
  HybridDispatchEventType,
  WorkflowTaskSummary,
} from "./types";

type WorkflowEventType =
  | "issue.created"
  | "branch.created"
  | "commit.created"
  | "pr.opened"
  | "review.requested"
  | "review.iteration"
  | "task.completed"
  | HybridDispatchEventType;

interface WorkflowEvent {
  type: WorkflowEventType;
  taskId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface TaskTimeline {
  taskId: string;
  issueNumber?: number;
  issueUrl?: string;
  branchName?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  commits: Array<{ hash: string; message: string }>;
  firstCommitAt?: Date;
  prOpenedAt?: Date;
  reviewIterations: number;
  startedAt: Date;
  completedAt?: Date;
}

export class WorkflowTelemetry {
  private readonly events: WorkflowEvent[] = [];
  private readonly timelines = new Map<string, TaskTimeline>();
  private readonly hybridDispatchEvents = new Map<
    string,
    DispatchLifecycleEvent[]
  >();
  private readonly hybridDispatchSummary = new Map<
    string,
    DispatchRunSummary
  >();

  markTaskStart(taskId: string): void {
    if (!this.timelines.has(taskId)) {
      this.timelines.set(taskId, {
        taskId,
        commits: [],
        reviewIterations: 0,
        startedAt: new Date(),
      });
    }
  }

  trackIssueCreated(
    taskId: string,
    issueNumber: number,
    issueUrl: string,
  ): void {
    this.ensureTimeline(taskId);
    const timeline = this.timelines.get(taskId);
    if (timeline) {
      timeline.issueNumber = issueNumber;
      timeline.issueUrl = issueUrl;
    }
    this.pushEvent("issue.created", taskId, { issueNumber, issueUrl });
  }

  trackBranchCreated(taskId: string, branchName: string): void {
    this.ensureTimeline(taskId);
    const timeline = this.timelines.get(taskId);
    if (timeline) {
      timeline.branchName = branchName;
    }
    this.pushEvent("branch.created", taskId, { branchName });
  }

  trackCommit(taskId: string, hash: string, message: string): void {
    this.ensureTimeline(taskId);
    const timeline = this.timelines.get(taskId);
    if (timeline) {
      timeline.commits.push({ hash, message });
      if (!timeline.firstCommitAt) {
        timeline.firstCommitAt = new Date();
      }
    }
    this.pushEvent("commit.created", taskId, { hash, message });
  }

  trackPrOpened(
    taskId: string,
    pullRequestNumber: number,
    pullRequestUrl: string,
  ): void {
    this.ensureTimeline(taskId);
    const timeline = this.timelines.get(taskId);
    if (timeline) {
      timeline.pullRequestNumber = pullRequestNumber;
      timeline.pullRequestUrl = pullRequestUrl;
      timeline.prOpenedAt = new Date();
    }
    this.pushEvent("pr.opened", taskId, { pullRequestNumber, pullRequestUrl });
  }

  trackReviewIteration(taskId: string): void {
    this.ensureTimeline(taskId);
    const timeline = this.timelines.get(taskId);
    if (timeline) {
      timeline.reviewIterations += 1;
    }
    this.pushEvent("review.iteration", taskId);
  }

  markTaskCompleted(taskId: string): void {
    this.ensureTimeline(taskId);
    const timeline = this.timelines.get(taskId);
    if (timeline) {
      timeline.completedAt = new Date();
    }
    this.pushEvent("task.completed", taskId);
  }

  trackHybridDispatchEvent(
    taskId: string,
    event: DispatchLifecycleEvent,
  ): void {
    const events = this.hybridDispatchEvents.get(taskId) ?? [];
    events.push({ ...event, timestamp: event.timestamp ?? new Date() });
    this.hybridDispatchEvents.set(taskId, events);

    this.pushEvent(event.event, taskId, {
      nodeId: event.nodeId,
      waveIndex: event.waveIndex,
      attempt: event.attempt,
      agentId: event.agentId,
      priority: event.priority,
      schedulePlanHash: event.schedulePlanHash,
      durationMs: "durationMs" in event ? event.durationMs : undefined,
      seq: event.seq,
    });
  }

  trackHybridDispatchSummary(
    taskId: string,
    summary: DispatchRunSummary,
  ): void {
    this.hybridDispatchSummary.set(taskId, { ...summary });
  }

  getHybridDispatchEvents(taskId: string): DispatchLifecycleEvent[] {
    return [...(this.hybridDispatchEvents.get(taskId) ?? [])];
  }

  getHybridDispatchSummary(taskId: string): DispatchRunSummary {
    return (
      this.hybridDispatchSummary.get(taskId) ?? {
        started: 0,
        succeeded: 0,
        failed: 0,
        timedOut: 0,
        retried: 0,
      }
    );
  }

  getMetrics(taskId: string): {
    issuesCreated: number;
    prsOpened: number;
    commitsPerTask: number;
    timeToFirstCommitMinutes?: number;
    timeToPrMinutes?: number;
    reviewIterations: number;
  } {
    const timeline = this.timelines.get(taskId);
    if (!timeline) {
      return {
        issuesCreated: 0,
        prsOpened: 0,
        commitsPerTask: 0,
        reviewIterations: 0,
      };
    }

    return {
      issuesCreated: timeline.issueNumber ? 1 : 0,
      prsOpened: timeline.pullRequestNumber ? 1 : 0,
      commitsPerTask: timeline.commits.length,
      timeToFirstCommitMinutes: timeline.firstCommitAt
        ? Math.max(
            0,
            Math.round(
              (timeline.firstCommitAt.getTime() -
                timeline.startedAt.getTime()) /
                60000,
            ),
          )
        : undefined,
      timeToPrMinutes: timeline.prOpenedAt
        ? Math.max(
            0,
            Math.round(
              (timeline.prOpenedAt.getTime() - timeline.startedAt.getTime()) /
                60000,
            ),
          )
        : undefined,
      reviewIterations: timeline.reviewIterations,
    };
  }

  buildFinalSummary(taskId: string): WorkflowTaskSummary {
    const timeline = this.timelines.get(taskId);
    if (!timeline) {
      return {
        taskId,
        commits: [],
        metrics: {
          reviewIterations: 0,
          commitsPerTask: 0,
        },
      };
    }

    const metrics = this.getMetrics(taskId);

    return {
      taskId: timeline.taskId,
      issueNumber: timeline.issueNumber,
      issueUrl: timeline.issueUrl,
      branchName: timeline.branchName,
      pullRequestNumber: timeline.pullRequestNumber,
      pullRequestUrl: timeline.pullRequestUrl,
      commits: [...timeline.commits],
      metrics: {
        timeToFirstCommitMinutes: metrics.timeToFirstCommitMinutes,
        timeToPrMinutes: metrics.timeToPrMinutes,
        reviewIterations: metrics.reviewIterations,
        commitsPerTask: metrics.commitsPerTask,
      },
    };
  }

  private ensureTimeline(taskId: string): void {
    if (!this.timelines.has(taskId)) {
      this.markTaskStart(taskId);
    }
  }

  private pushEvent(
    type: WorkflowEventType,
    taskId: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.events.push({ type, taskId, timestamp: new Date(), metadata });
  }
}
