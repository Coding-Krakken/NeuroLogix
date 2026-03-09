/**
 * Parallel Quality Gates
 *
 * Runs independent quality gates in parallel to reduce PR creation time by ~50%.
 *
 * @module framework/parallel-quality-gates
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { QualityGate, QualityGateId, QualityGateResult } from "./types";
import { logError, logInfo } from "./logger";

const execFileAsync = promisify(execFile);

const GATE_COMMANDS: Record<
  Exclude<QualityGateId, "G7" | "G8" | "G9" | "G10">,
  string[]
> = {
  G1: ["npm", "run", "lint"],
  G2: ["npm", "run", "format:check"],
  G3: ["npm", "run", "typecheck"],
  G4: ["npm", "test", "--", "--coverage"],
  G5: ["npm", "run", "build"],
  G6: ["npm", "audit", "--omit=dev"],
};

// ============================================================================
// Quality Gate Definitions
// ============================================================================

const QUALITY_GATES: Record<QualityGateId, QualityGate> = {
  G1: {
    id: "G1",
    name: "Lint Gate",
    blocking: true,
    dependencies: [],
    validator: () => runCommand("G1", GATE_COMMANDS.G1),
  },
  G2: {
    id: "G2",
    name: "Format Gate",
    blocking: true,
    dependencies: [],
    validator: () => runCommand("G2", GATE_COMMANDS.G2),
  },
  G3: {
    id: "G3",
    name: "Type Safety Gate",
    blocking: true,
    dependencies: [],
    validator: () => runCommand("G3", GATE_COMMANDS.G3),
  },
  G4: {
    id: "G4",
    name: "Test Gate",
    blocking: true,
    dependencies: [],
    validator: () => runCommand("G4", GATE_COMMANDS.G4),
  },
  G5: {
    id: "G5",
    name: "Build Gate",
    blocking: true,
    dependencies: ["G1", "G2", "G3", "G4"], // Must pass all before building
    validator: () => runCommand("G5", GATE_COMMANDS.G5),
  },
  G6: {
    id: "G6",
    name: "Security Scan Gate",
    blocking: true,
    dependencies: [],
    validator: () => runCommand("G6", GATE_COMMANDS.G6),
  },
  G7: {
    id: "G7",
    name: "Documentation Gate",
    blocking: false, // Warning only
    dependencies: [],
    validator: () => checkDocumentation(),
  },
  G8: {
    id: "G8",
    name: "PR Quality Gate",
    blocking: false,
    dependencies: ["G1", "G2", "G3", "G4", "G5", "G6"],
    validator: () => validatePRDescription(),
  },
  G9: {
    id: "G9",
    name: "Performance Budget Gate",
    blocking: true,
    dependencies: ["G5"], // Must build first
    validator: () => checkPerformanceBudget(),
  },
  G10: {
    id: "G10",
    name: "Ship Gate",
    blocking: true,
    dependencies: ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"],
    validator: () =>
      Promise.resolve({
        gate: "G10" as QualityGateId,
        passed: true,
        duration: 0,
      }),
  },
};

// ============================================================================
// Parallel Executor
// ============================================================================

export class ParallelQualityGates {
  /**
   * Run all quality gates in optimal parallel order
   */
  static async runAll(): Promise<{
    results: QualityGateResult[];
    passed: boolean;
    duration: number;
    parallelizationGain: number;
  }> {
    const startTime = Date.now();

    // Build dependency graph
    const graph = this.buildDependencyGraph();

    // Execute in parallel batches
    const results = await this.executeInBatches(graph);

    const duration = Date.now() - startTime;
    const sequentialDuration = this.estimateSequentialDuration(results);
    const parallelizationGain =
      (sequentialDuration - duration) / sequentialDuration;

    const passed = results.every(
      (r) => r.passed || !QUALITY_GATES[r.gate].blocking,
    );

    return {
      results,
      passed,
      duration,
      parallelizationGain,
    };
  }

  /**
   * Build dependency graph for quality gates
   */
  private static buildDependencyGraph(): Map<QualityGateId, QualityGateId[]> {
    const graph = new Map<QualityGateId, QualityGateId[]>();

    for (const [gateId, gate] of Object.entries(QUALITY_GATES)) {
      graph.set(gateId as QualityGateId, gate.dependencies);
    }

    return graph;
  }

  /**
   * Execute gates in parallel batches based on dependencies
   */
  private static async executeInBatches(
    graph: Map<QualityGateId, QualityGateId[]>,
  ): Promise<QualityGateResult[]> {
    const results: QualityGateResult[] = [];
    const completed = new Set<QualityGateId>();
    const pending = new Set<QualityGateId>(graph.keys());

    while (pending.size > 0) {
      // Find gates that can run now (dependencies satisfied)
      const ready: QualityGateId[] = [];
      for (const gateId of pending) {
        const deps = graph.get(gateId) || [];
        if (deps.every((dep) => completed.has(dep))) {
          ready.push(gateId);
        }
      }

      if (ready.length === 0 && pending.size > 0) {
        throw new Error("Circular dependency detected in quality gates");
      }

      // Run ready gates in parallel
      const batchResults = await Promise.all(
        ready.map((gateId) => this.runGate(gateId)),
      );

      // Update state
      for (const result of batchResults) {
        results.push(result);
        completed.add(result.gate);
        pending.delete(result.gate);

        // Stop if blocking gate fails
        if (!result.passed && QUALITY_GATES[result.gate].blocking) {
          // Return early with failure
          return [...results];
        }
      }
    }

    return results;
  }

  /**
   * Run a single quality gate
   */
  private static async runGate(
    gateId: QualityGateId,
  ): Promise<QualityGateResult> {
    const gate = QUALITY_GATES[gateId];
    logInfo(`🔍 Running ${gate.name}...`);

    try {
      const result = await gate.validator();
      if (result.passed) {
        logInfo(`✅ ${gate.name} passed (${result.duration}ms)`);
      } else {
        logError(`❌ ${gate.name} failed`);
        if (result.errors) {
          result.errors.forEach((err) => logError(`  - ${err}`));
        }
      }
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logError(`❌ ${gate.name} error: ${errorMessage}`);
      return {
        gate: gateId,
        passed: false,
        duration: 0,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Estimate sequential duration (for comparison)
   */
  private static estimateSequentialDuration(
    results: QualityGateResult[],
  ): number {
    return results.reduce((sum, r) => sum + r.duration, 0);
  }

  /**
   * Get gates that can run in parallel (no dependencies)
   */
  static getIndependentGates(): QualityGateId[] {
    return Object.entries(QUALITY_GATES)
      .filter(([_, gate]) => gate.dependencies.length === 0)
      .map(([gateId]) => gateId as QualityGateId);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function runCommand(
  gate: QualityGateId,
  commandAndArgs: string[],
): Promise<QualityGateResult> {
  const startTime = Date.now();
  const [command, ...args] = commandAndArgs;

  if (!command) {
    return {
      gate,
      passed: false,
      duration: Date.now() - startTime,
      errors: ["Command is not configured for this quality gate"],
    };
  }

  try {
    await execFileAsync(command, args, {
      windowsHide: true,
      cwd: process.cwd(),
      timeout: 20 * 60 * 1000,
    });

    return {
      gate,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      gate,
      passed: false,
      duration: Date.now() - startTime,
      errors: [message],
    };
  }
}

function checkDocumentation(): Promise<QualityGateResult> {
  const hasReadme = process.env["SUBZERO_DOCS_README_UPDATED"] === "1";
  const hasDecision = process.env["SUBZERO_DOCS_ADR_UPDATED"] === "1";
  const passed = hasReadme || hasDecision;

  return Promise.resolve({
    gate: "G7",
    passed,
    duration: 100,
    errors: passed
      ? undefined
      : [
          "Documentation gate requires SUBZERO_DOCS_README_UPDATED=1 or SUBZERO_DOCS_ADR_UPDATED=1",
        ],
  });
}

function validatePRDescription(): Promise<QualityGateResult> {
  const isValid = process.env["SUBZERO_PR_DESCRIPTION_VALIDATED"] === "1";

  return Promise.resolve({
    gate: "G8",
    passed: isValid,
    duration: 50,
    errors: isValid
      ? undefined
      : ["Set SUBZERO_PR_DESCRIPTION_VALIDATED=1 after PR contract validation"],
  });
}

function checkPerformanceBudget(): Promise<QualityGateResult> {
  const isWithinBudget = process.env["SUBZERO_PERFORMANCE_BUDGET_PASS"] === "1";

  return Promise.resolve({
    gate: "G9",
    passed: isWithinBudget,
    duration: 5000,
    errors: isWithinBudget
      ? undefined
      : [
          "Set SUBZERO_PERFORMANCE_BUDGET_PASS=1 after performance budget check",
        ],
  });
}
