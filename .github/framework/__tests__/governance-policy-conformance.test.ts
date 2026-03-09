import { describe, expect, it } from "@jest/globals";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const frameworkRoot = existsSync(
  resolve(process.cwd(), ".github", "framework", "package.json"),
)
  ? resolve(process.cwd(), ".github", "framework")
  : process.cwd();

describe("governance policy conformance", () => {
  it("passes policy conformance checks", () => {
    const output = execSync(
      "node --loader ts-node/esm governance/enforce-policy-conformance.ts --mode enforce",
      {
        cwd: frameworkRoot,
        encoding: "utf-8",
      },
    );

    expect(output).toContain("Policy conformance passed.");
  });

  it("runs model completeness gate in advisory mode", () => {
    const output = execSync(
      "node --loader ts-node/esm governance/enforce-model-completeness.ts --mode advisory",
      {
        cwd: frameworkRoot,
        encoding: "utf-8",
      },
    );

    expect(output).toContain("Model completeness");
  });
});
