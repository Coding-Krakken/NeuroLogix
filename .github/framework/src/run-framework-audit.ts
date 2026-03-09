import { WorkflowTelemetry } from "../workflow-telemetry.js";
import { normalizeLifecycle } from "./normalize-lifecycle.js";

export interface FrameworkAuditOptions {
  taskId?: string;
  lifecycle?: string;
}

export interface FrameworkAuditResult {
  taskId: string;
  lifecycle: string;
  completed: boolean;
}

export const runFrameworkAudit = (
  options: FrameworkAuditOptions = {},
): Promise<FrameworkAuditResult> => {
  const taskId = options.taskId ?? "framework-audit";
  const lifecycle = normalizeLifecycle(options.lifecycle ?? "candidate");

  const telemetry = new WorkflowTelemetry();
  telemetry.markTaskStart(taskId);
  telemetry.markTaskCompleted(taskId);

  return Promise.resolve({
    taskId,
    lifecycle,
    completed: true,
  });
};
