/**
 * Smart Routing Optimizer
 *
 * Intelligently routes tasks to the optimal agent chain, bypassing unnecessary
 * handoffs for trivial tasks while maintaining quality.
 *
 * @module framework/routing-optimizer
 */

import type {
  Task,
  AgentId,
  RoutingDecision,
  RoutingRule,
  TaskType,
} from "./types";

// ============================================================================
// Routing Rules
// ============================================================================

const ROUTING_RULES: Record<TaskType, RoutingRule> = {
  Feature: {
    taskType: "Feature",
    scope: "Medium",
    defaultChain: [
      "product-owner",
      "solution-architect",
      "tech-lead",
      "frontend-engineer",
      "qa-test-engineer",
      "quality-director",
    ],
    bypasses: [
      {
        condition: "scope === Small && description includes component",
        skipTo: "frontend-engineer",
        rationale: "Simple component addition - skip architecture planning",
      },
    ],
  },
  Bug: {
    taskType: "Bug",
    scope: "Medium",
    defaultChain: [
      "qa-test-engineer",
      "tech-lead",
      "frontend-engineer",
      "qa-test-engineer",
      "quality-director",
    ],
    bypasses: [
      {
        condition: "scope === Small && type === lint",
        skipTo: "frontend-engineer",
        rationale: "Lint fix - direct to engineer",
      },
      {
        condition: "scope === Small && type === typecheck",
        skipTo: "frontend-engineer",
        rationale: "Type error fix - direct to engineer",
      },
    ],
  },
  Refactor: {
    taskType: "Refactor",
    scope: "Medium",
    defaultChain: [
      "tech-lead",
      "solution-architect",
      "frontend-engineer",
      "qa-test-engineer",
      "quality-director",
    ],
    bypasses: [
      {
        condition: "scope === Small",
        skipTo: "tech-lead",
        rationale: "Small refactor - skip architecture review",
      },
    ],
  },
  Docs: {
    taskType: "Docs",
    scope: "Small",
    defaultChain: ["documentation-engineer", "quality-director"],
    bypasses: [
      {
        condition: "scope === Small",
        skipTo: "documentation-engineer",
        rationale: "Docs updates always go direct to docs engineer",
      },
    ],
  },
  Security: {
    taskType: "Security",
    scope: "Large",
    defaultChain: [
      "security-engineer",
      "solution-architect",
      "tech-lead",
      "backend-engineer",
      "qa-test-engineer",
      "quality-director",
    ],
    bypasses: [
      {
        condition: "priority === P0",
        skipTo: "security-engineer",
        rationale: "Security P0 - immediate escalation",
      },
    ],
  },
  Performance: {
    taskType: "Performance",
    scope: "Medium",
    defaultChain: [
      "performance-engineer",
      "tech-lead",
      "frontend-engineer",
      "qa-test-engineer",
      "quality-director",
    ],
    bypasses: [],
  },
  Incident: {
    taskType: "Incident",
    scope: "Large",
    defaultChain: [
      "incident-commander",
      "sre-engineer",
      "tech-lead",
      "quality-director",
    ],
    bypasses: [
      {
        condition: "priority === P0",
        skipTo: "incident-commander",
        rationale: "P0 incident - immediate war room",
      },
    ],
  },
};

// ============================================================================
// Routing Optimizer
// ============================================================================

export class RoutingOptimizer {
  /**
   * Determine the optimal routing for a task
   */
  static determineRoute(task: Task): RoutingDecision {
    const rule = ROUTING_RULES[task.type];

    // Check for express lane conditions
    const expressLane = this.isExpressLane(task);
    if (expressLane) {
      return {
        targetAgent: this.getExpressLaneAgent(task),
        skipAgents: [],
        reason: "Express lane: trivial task bypasses full workflow",
        confidence: 0.95,
        expressLane: true,
      };
    }

    // Check for bypass conditions
    for (const bypass of rule.bypasses) {
      if (this.evaluateCondition(bypass.condition, task)) {
        return {
          targetAgent: bypass.skipTo,
          skipAgents: this.getSkippedAgents(rule.defaultChain, bypass.skipTo),
          reason: bypass.rationale,
          confidence: 0.85,
          expressLane: false,
        };
      }
    }

    // Default: full chain
    const firstAgent = rule.defaultChain[0];
    if (!firstAgent) {
      throw new Error(`Rule for ${task.type} has empty default chain`);
    }
    return {
      targetAgent: firstAgent,
      skipAgents: [],
      reason: "Standard workflow",
      confidence: 1.0,
      expressLane: false,
    };
  }

  /**
   * Check if task qualifies for express lane
   */ private static isExpressLane(task: Task): boolean {
    // Lint fixes
    if (
      task.type === "Bug" &&
      task.scope === "Small" &&
      /lint|eslint|prettier|format/i.test(task.description)
    ) {
      return true;
    }

    // Docs updates (non-architecture)
    if (
      task.type === "Docs" &&
      task.scope === "Small" &&
      !/architecture|adr|system-design/i.test(task.description)
    ) {
      return true;
    }

    // Simple typo fixes
    if (
      task.description.toLowerCase().includes("typo") ||
      task.description.toLowerCase().includes("spelling")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get the express lane agent for a task
   */
  private static getExpressLaneAgent(task: Task): AgentId {
    if (task.type === "Docs") {
      return "documentation-engineer";
    }
    if (/frontend|ui|component|react|next/i.test(task.description)) {
      return "frontend-engineer";
    }
    if (/backend|api|server|route/i.test(task.description)) {
      return "backend-engineer";
    }
    if (/infra|ci|cd|deploy|vercel/i.test(task.description)) {
      return "platform-engineer";
    }
    return "tech-lead"; // Fallback
  }

  /**
   * Evaluate a routing condition
   */
  private static evaluateCondition(condition: string, task: Task): boolean {
    // Simple condition parser (can be enhanced with AST parser)
    try {
      // Create safe evaluation context
      const context = {
        scope: task.scope,
        priority: task.priority,
        type: task.type,
        description: task.description,
      };

      // Replace condition variables with context values
      let evalStr = condition;
      for (const [key, value] of Object.entries(context)) {
        const regex = new RegExp(`\\b${key}\\b`, "g");
        const safeValue = typeof value === "string" ? `"${value}"` : value;
        evalStr = evalStr.replace(regex, String(safeValue));
      }

      // Evaluate (WARNING: In production, use a proper parser/validator)
      // eslint-disable-next-line no-eval
      const evaluationResult: unknown = eval(evalStr);
      return typeof evaluationResult === "boolean" ? evaluationResult : false;
    } catch {
      return false;
    }
  }

  /**
   * Get list of agents that were skipped
   */
  private static getSkippedAgents(
    defaultChain: AgentId[],
    targetAgent: AgentId,
  ): AgentId[] {
    const targetIndex = defaultChain.indexOf(targetAgent);
    if (targetIndex === -1) return [];
    return defaultChain.slice(0, targetIndex);
  }

  /**
   * Calculate estimated time savings from routing optimization
   */
  static estimateTimeSavings(decision: RoutingDecision): number {
    const AVERAGE_HANDOFF_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
    const EXPRESS_LANE_SAVINGS = 15 * 60 * 1000; // 15 minutes

    if (decision.expressLane) {
      return EXPRESS_LANE_SAVINGS;
    }

    return decision.skipAgents.length * AVERAGE_HANDOFF_TIME;
  }

  /**
   * Get routing statistics
   */
  static getRoutingStats(tasks: Task[]): {
    expressLaneUsage: number;
    bypassRate: number;
    averageTimeSavings: number;
  } {
    let expressLaneCount = 0;
    let bypassCount = 0;
    let totalSavings = 0;

    for (const task of tasks) {
      const decision = this.determineRoute(task);
      if (decision.expressLane) {
        expressLaneCount++;
      }
      if (decision.skipAgents.length > 0) {
        bypassCount++;
      }
      totalSavings += this.estimateTimeSavings(decision);
    }

    return {
      expressLaneUsage: tasks.length > 0 ? expressLaneCount / tasks.length : 0,
      bypassRate: tasks.length > 0 ? bypassCount / tasks.length : 0,
      averageTimeSavings: tasks.length > 0 ? totalSavings / tasks.length : 0,
    };
  }
}
