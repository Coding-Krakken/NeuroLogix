import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface Args {
  mode: "advisory" | "enforce";
}

interface CheckResult {
  failures: string[];
  warnings: string[];
}

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token?.startsWith("--") && next && !next.startsWith("--")) {
      values.set(token, next);
    }
  }

  const mode = (values.get("--mode") ?? "enforce").toLowerCase();
  if (mode !== "advisory" && mode !== "enforce") {
    throw new Error("Invalid --mode. Expected advisory|enforce.");
  }

  return { mode };
}

function fail(message: string, result: CheckResult): void {
  result.failures.push(message);
}

function warn(message: string, result: CheckResult): void {
  result.warnings.push(message);
}

function assertRequiredSectionsInPrTemplate(
  prTemplateBody: string,
  result: CheckResult,
): void {
  const requiredSections = [
    "linked issues",
    "work item metadata",
    "risk assessment",
    "testing evidence",
    "observability impact",
    "security & privacy checklist",
    "backward compatibility & migrations",
    "rollout and rollback plan",
    "documentation and release",
    "acceptance criteria validation",
  ];

  const lower = prTemplateBody.toLowerCase();
  for (const section of requiredSections) {
    const heading = `## ${section}`;
    if (!lower.includes(heading)) {
      fail(`PR template is missing required section: ${section}`, result);
    }
  }
}

function assertIssueTemplatesDeterministicOnly(
  issueTemplateDir: string,
  result: CheckResult,
): void {
  const names = readdirSync(issueTemplateDir);
  const nonDeterministic = names.filter((name) => {
    if (name === "config.yml") {
      return false;
    }
    return !name.startsWith("deterministic-");
  });

  if (nonDeterministic.length > 0) {
    fail(
      `Non-deterministic issue templates found: ${nonDeterministic.join(", ")}`,
      result,
    );
  }

  if (!names.includes("deterministic-feature.yml")) {
    fail("Missing deterministic-feature.yml", result);
  }
  if (!names.includes("deterministic-bug.yml")) {
    fail("Missing deterministic-bug.yml", result);
  }
}

function assertCodeownersConsistency(
  codeownersBody: string,
  result: CheckResult,
): void {
  const lines = codeownersBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const duplicates = lines.filter(
    (line, index) => lines.indexOf(line) !== index,
  );
  if (duplicates.length > 0) {
    fail(
      `Duplicate CODEOWNERS entries found: ${duplicates.join(", ")}`,
      result,
    );
  }

  const canonicalPrTemplateMentions = lines.filter((line) =>
    line.startsWith(".github/pull_request_template.md"),
  );
  if (canonicalPrTemplateMentions.length !== 1) {
    fail(
      "CODEOWNERS must contain exactly one canonical .github/pull_request_template.md entry.",
      result,
    );
  }

  if (lines.some((line) => line.includes("PR_TEMPLATE.md"))) {
    warn("Legacy PR_TEMPLATE.md reference detected in CODEOWNERS.", result);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
  const root = resolve(scriptDir, "..", "..", "..");
  const result: CheckResult = { failures: [], warnings: [] };

  const prTemplatePath = resolve(root, ".github", "pull_request_template.md");
  const issueTemplateDir = resolve(root, ".github", "ISSUE_TEMPLATE");
  const codeownersPath = resolve(root, ".github", "CODEOWNERS");

  if (!existsSync(prTemplatePath)) {
    fail(
      "Missing canonical PR template: .github/pull_request_template.md",
      result,
    );
  }
  if (!existsSync(issueTemplateDir)) {
    fail("Missing issue template directory: .github/ISSUE_TEMPLATE", result);
  }
  if (!existsSync(codeownersPath)) {
    fail("Missing CODEOWNERS file: .github/CODEOWNERS", result);
  }

  if (existsSync(prTemplatePath)) {
    const body = readFileSync(prTemplatePath, "utf-8");
    assertRequiredSectionsInPrTemplate(body, result);
  }
  if (existsSync(issueTemplateDir)) {
    assertIssueTemplatesDeterministicOnly(issueTemplateDir, result);
  }
  if (existsSync(codeownersPath)) {
    const body = readFileSync(codeownersPath, "utf-8");
    assertCodeownersConsistency(body, result);
  }

  if (result.warnings.length > 0) {
    process.stdout.write(
      `Policy conformance warnings:\n- ${result.warnings.join("\n- ")}\n`,
    );
  }

  if (result.failures.length > 0) {
    const message = `Policy conformance failures:\n- ${result.failures.join("\n- ")}`;
    if (args.mode === "enforce") {
      throw new Error(message);
    }
    process.stdout.write(`${message}\n`);
    process.stdout.write(
      "Advisory mode active: failures reported but not blocking.\n",
    );
    return;
  }

  process.stdout.write("Policy conformance passed.\n");
}

main();
