import { normalizeLifecycle, runFrameworkAudit, workflowTelemetry } from "@subzero/framework";

const normalized = normalizeLifecycle("smoke validated");
const audit = await runFrameworkAudit({ taskId: "issue-16-smoke", lifecycle: "candidate" });
const telemetry = workflowTelemetry();

if (normalized !== "smoke_validated") {
  throw new Error(`Unexpected normalized value: ${normalized}`);
}

if (!audit.completed || audit.taskId !== "issue-16-smoke") {
  throw new Error("Audit result validation failed");
}

if (typeof telemetry.buildFinalSummary !== "function") {
  throw new Error("Telemetry contract invalid");
}

console.log("SMOKE_CONSUMER_STATUS=passed");
console.log(JSON.stringify({ normalized, auditTask: audit.taskId, completed: audit.completed }));
