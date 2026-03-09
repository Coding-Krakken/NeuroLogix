/**
 * Context Hierarchy (Phase A)
 *
 * Produces budget-aware L1/L2/L3 context slices with token estimates.
 *
 * @module framework/context-hierarchy
 */

import type {
  ContextHierarchyResult,
  ContextSlice,
  HybridExecutionConfig,
  Task,
} from "./types";

export interface ContextSource {
  source: string;
  content: string;
}

export interface ContextHierarchyInput {
  task: Pick<Task, "id" | "title" | "description" | "acceptanceCriteria">;
  l2Items: ContextSource[];
  l3Items: ContextSource[];
}

export interface ContextHierarchyDependencies {
  estimateTokens?: (input: string) => number;
}

const DEFAULT_TOKEN_ESTIMATOR = (input: string): number => {
  const normalized = input.trim();
  if (normalized.length === 0) {
    return 0;
  }
  return Math.ceil(normalized.length / 4);
};

const SECRET_OR_PII_PATTERNS: RegExp[] = [
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[^\s'"]+/gi,
  /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g,
];

export class ContextHierarchy {
  private readonly estimateTokens: (input: string) => number;

  constructor(
    private readonly config: HybridExecutionConfig,
    deps: ContextHierarchyDependencies = {},
  ) {
    this.estimateTokens = deps.estimateTokens ?? DEFAULT_TOKEN_ESTIMATOR;
  }

  compose(input: ContextHierarchyInput): ContextHierarchyResult {
    const slices: ContextSlice[] = [];

    if (!this.config.flags.memoryHierarchyEnabled) {
      return {
        slices,
        totalEstimatedTokens: 0,
        truncated: false,
      };
    }

    const l1Content = [
      `Task: ${input.task.title}`,
      `Task ID: ${input.task.id}`,
      `Description: ${input.task.description}`,
      `Acceptance Criteria: ${input.task.acceptanceCriteria.join(" | ")}`,
    ].join("\n");

    slices.push(this.createSlice("L1", "task-core", l1Content));

    for (const item of input.l2Items.slice(0, this.config.maxL2Comments)) {
      slices.push(this.createSlice("L2", item.source, item.content));
    }

    for (const item of input.l3Items) {
      slices.push(this.createSlice("L3", item.source, item.content));
    }

    return this.applyBudget(slices);
  }

  private createSlice(
    tier: ContextSlice["tier"],
    source: string,
    content: string,
  ): ContextSlice {
    const sanitized = this.sanitize(content);
    return {
      tier,
      source,
      content: sanitized,
      estimatedTokens: this.estimateTokens(sanitized),
    };
  }

  private sanitize(content: string): string {
    return SECRET_OR_PII_PATTERNS.reduce((current, pattern) => {
      return current.replace(pattern, "[REDACTED]");
    }, content);
  }

  private applyBudget(slices: ContextSlice[]): ContextHierarchyResult {
    const sorted = [...slices];
    const kept: ContextSlice[] = [];
    let used = 0;
    let truncated = false;

    for (const slice of sorted) {
      const nextTotal = used + slice.estimatedTokens;
      if (nextTotal <= this.config.maxContextTokens) {
        kept.push(slice);
        used = nextTotal;
        continue;
      }

      if (slice.tier === "L1" && this.config.l1TokenBudget > 0) {
        const capped = this.capL1Slice(slice);
        const cappedTotal = used + capped.estimatedTokens;
        if (cappedTotal <= this.config.maxContextTokens) {
          kept.push(capped);
          used = cappedTotal;
          truncated = true;
          continue;
        }
      }

      truncated = true;
      break;
    }

    return {
      slices: kept,
      totalEstimatedTokens: used,
      truncated,
    };
  }

  private capL1Slice(slice: ContextSlice): ContextSlice {
    const maxChars = this.config.l1TokenBudget * 4;
    if (slice.content.length <= maxChars) {
      return slice;
    }

    const content = `${slice.content.slice(0, Math.max(0, maxChars - 3))}...`;
    return {
      ...slice,
      content,
      estimatedTokens: this.estimateTokens(content),
    };
  }
}
