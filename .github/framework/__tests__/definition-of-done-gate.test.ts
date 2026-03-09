import { describe, it, expect } from "@jest/globals";
import { DefinitionOfDoneGate } from "../definition-of-done-gate";

describe("DefinitionOfDoneGate", () => {
  it("passes when all required fields are satisfied", () => {
    const result = DefinitionOfDoneGate.evaluate({
      testsUpdated: true,
      lintPassed: true,
      typecheckPassed: true,
      docsUpdated: true,
      prIncludesHowToTest: true,
      prIncludesRiskNotes: true,
      acceptanceCriteriaSatisfied: true,
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("fails with multiple unmet requirements", () => {
    const result = DefinitionOfDoneGate.evaluate({
      testsUpdated: false,
      lintPassed: true,
      typecheckPassed: false,
      docsUpdated: false,
      prIncludesHowToTest: false,
      prIncludesRiskNotes: false,
      acceptanceCriteriaSatisfied: false,
      securityReviewRequired: true,
      securityReviewComplete: false,
    });

    expect(result.passed).toBe(false);
    expect(result.failures.length).toBeGreaterThanOrEqual(6);
  });
});
