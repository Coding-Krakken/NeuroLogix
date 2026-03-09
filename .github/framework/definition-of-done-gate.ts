/**
 * Definition of Done Gate
 *
 * Blocks completion when required quality checks are incomplete.
 */

import type { DefinitionOfDoneInput, DefinitionOfDoneResult } from "./types";

export class DefinitionOfDoneGate {
  static evaluate(input: DefinitionOfDoneInput): DefinitionOfDoneResult {
    const failures: string[] = [];
    const warnings: string[] = [];

    if (!input.testsUpdated) {
      failures.push("Tests were not added or updated for the change");
    }

    if (!input.lintPassed) {
      failures.push("Lint checks are failing");
    }

    if (!input.typecheckPassed) {
      failures.push("Type checks are failing");
    }

    if (!input.docsUpdated) {
      failures.push("Documentation updates are missing");
    }

    if (!input.prIncludesHowToTest) {
      failures.push("PR description is missing reproducible How to test steps");
    }

    if (!input.prIncludesRiskNotes) {
      failures.push("PR description is missing risk notes and tradeoffs");
    }

    if (!input.acceptanceCriteriaSatisfied) {
      failures.push("Issue acceptance criteria are not satisfied");
    }

    if (input.securityReviewRequired && !input.securityReviewComplete) {
      failures.push("Security review is required but incomplete");
    }

    if (input.performanceReviewRequired && !input.performanceReviewComplete) {
      failures.push("Performance review is required but incomplete");
    }

    if (input.securityReviewRequired && input.securityReviewComplete) {
      warnings.push("Security review completed: include summary in PR body");
    }

    if (input.performanceReviewRequired && input.performanceReviewComplete) {
      warnings.push(
        "Performance review completed: include benchmark deltas in PR body",
      );
    }

    return {
      passed: failures.length === 0,
      failures,
      warnings,
    };
  }
}
