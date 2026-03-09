import { WorkflowTelemetry } from "../workflow-telemetry.js";

export { runFrameworkAudit } from "./run-framework-audit.js";
export type {
  FrameworkAuditOptions,
  FrameworkAuditResult,
} from "./run-framework-audit.js";
export { normalizeLifecycle } from "./normalize-lifecycle.js";
export { analyzeHandoffWorkflow } from "./handoff-workflow-tracker.js";

export const workflowTelemetry = (): WorkflowTelemetry =>
  new WorkflowTelemetry();
