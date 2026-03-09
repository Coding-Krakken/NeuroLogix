/**
 * Hybrid Orchestrator (Phase A)
 *
 * Contract-level foundation for memory hierarchy and parallel graph orchestration.
 *
 * @module framework/hybrid-orchestrator
 */

import {
  ContextHierarchy,
  type ContextHierarchyInput,
  type ContextSource,
} from "./context-hierarchy";
import {
  DependencyGraphBuilder,
  type DependencyGraphNodeInput,
} from "./dependency-graph";
import { WaveScheduler } from "./wave-scheduler";
import type {
  ContextHierarchyResult,
  HybridExecutionConfig,
  HybridFeatureFlags,
  HybridMode,
  SchedulePlan,
  Task,
} from "./types";

export interface HybridExecutionRequest {
  task: Pick<Task, "id" | "title" | "description" | "acceptanceCriteria">;
  graphNodes: DependencyGraphNodeInput[];
  l2Items: ContextSource[];
  l3Items: ContextSource[];
}

export interface HybridExecutionResult {
  mode: HybridMode;
  effectiveFlags: HybridFeatureFlags;
  context?: ContextHierarchyResult;
  waves?: string[][];
  schedulePlan?: SchedulePlan;
  schedulePlanHash?: string;
  fallbackReason?: string;
}

export const DEFAULT_HYBRID_CONFIG: HybridExecutionConfig = {
  mode: "sequential",
  flags: {
    hybridOrchestrationEnabled: false,
    parallelGraphEnabled: false,
    memoryHierarchyEnabled: false,
  },
  maxContextTokens: 20_000,
  l1TokenBudget: 5_000,
  maxL2Comments: 10,
};

export class HybridOrchestrator {
  private readonly graphBuilder = new DependencyGraphBuilder();
  private readonly waveScheduler = new WaveScheduler();
  private readonly contextHierarchy: ContextHierarchy;

  constructor(
    private readonly config: HybridExecutionConfig = DEFAULT_HYBRID_CONFIG,
  ) {
    this.contextHierarchy = new ContextHierarchy(config);
  }

  isSubsystemEnabled(subsystem: keyof HybridFeatureFlags): boolean {
    return this.config.flags[subsystem];
  }

  execute(request: HybridExecutionRequest): HybridExecutionResult {
    const flags = this.config.flags;

    if (
      !flags.hybridOrchestrationEnabled ||
      this.config.mode === "sequential"
    ) {
      return {
        mode: "sequential",
        effectiveFlags: flags,
        fallbackReason: "Hybrid orchestration disabled by config flag or mode",
      };
    }

    const result: HybridExecutionResult = {
      mode: "hybrid",
      effectiveFlags: flags,
    };

    if (flags.memoryHierarchyEnabled) {
      const contextInput: ContextHierarchyInput = {
        task: request.task,
        l2Items: request.l2Items,
        l3Items: request.l3Items,
      };
      result.context = this.contextHierarchy.compose(contextInput);
    }

    if (flags.parallelGraphEnabled) {
      const plan = this.graphBuilder.build(request.graphNodes);
      if (!plan.validation.valid) {
        const path = plan.validation.cyclePath?.join(" -> ") ?? "unknown";
        throw new Error(`Dependency graph validation failed: ${path}`);
      }
      const schedule = this.waveScheduler.createPlan(plan.nodes);
      result.waves = schedule.waves.map((wave) => [...wave.nodeIds]);
      result.schedulePlan = schedule;
      result.schedulePlanHash = schedule.schedulePlanHash;
    }

    return result;
  }
}
