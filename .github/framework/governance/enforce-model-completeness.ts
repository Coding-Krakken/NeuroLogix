import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface Args {
  mode: "advisory" | "enforce";
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

  const mode = (values.get("--mode") ?? "advisory").toLowerCase();
  if (mode !== "advisory" && mode !== "enforce") {
    throw new Error("Invalid --mode. Expected advisory|enforce.");
  }

  return { mode };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
  const root = resolve(scriptDir, "..", "..", "..");

  const requiredModels = [
    ".github/.system-state/model/system_state_model.yaml",
    ".github/.system-state/delivery/delivery_state_model.yaml",
    ".github/.system-state/security/threat_model.yaml",
    ".github/.system-state/resilience/failure_modes.yaml",
    ".github/.system-state/ops/slo_model.yaml",
  ];

  const missing = requiredModels.filter(
    (relativePath) => !existsSync(resolve(root, relativePath)),
  );

  if (missing.length === 0) {
    process.stdout.write("Model completeness passed.\n");
    return;
  }

  const message = [
    "Model completeness gaps detected:",
    ...missing.map((path) => `- ${path}`),
  ].join("\n");

  if (args.mode === "enforce") {
    throw new Error(message);
  }

  process.stdout.write(`${message}\n`);
  process.stdout.write(
    "Advisory mode active: model completeness check is non-blocking.\n",
  );
}

main();
