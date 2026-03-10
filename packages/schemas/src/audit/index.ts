/**
 * @fileoverview Canonical audit schemas for NeuroLogix ICS compliance
 *
 * IEC 62443 / ISO 27001 — Every control action, recipe execution, and policy
 * decision must be logged immutably. These schemas are the authoritative
 * data contracts for all audit log entries across the platform.
 *
 * Model ref: system_state_model.yaml — Audit invariants INV-AUDIT-001–004
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Audit Outcome
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_OUTCOME = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PARTIAL: 'partial',
} as const;

export type AuditOutcome = (typeof AUDIT_OUTCOME)[keyof typeof AUDIT_OUTCOME];
export const AuditOutcomeSchema = z.enum(['success', 'failure', 'partial']);

// ─────────────────────────────────────────────────────────────────────────────
// Audit Severity
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  SECURITY: 'security',
} as const;

export type AuditSeverity = (typeof AUDIT_SEVERITY)[keyof typeof AUDIT_SEVERITY];
export const AuditSeveritySchema = z.enum(['info', 'warning', 'critical', 'security']);

// ─────────────────────────────────────────────────────────────────────────────
// Audit Actions (structured vocabulary)
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_ACTION = {
  // Site lifecycle
  SITE_REGISTER: 'site.register',
  SITE_STATUS_TRANSITION: 'site.status_transition',
  SITE_CONFIG_UPDATED: 'site.config_updated',
  SITE_TOPOLOGY_UPDATED: 'site.topology_updated',
  // Feature flags
  FEATURE_FLAG_UPSERT: 'feature_flag.upsert',
  FEATURE_FLAG_SITE_OVERRIDE: 'feature_flag.site_override',
  // Recipe
  RECIPE_REGISTERED: 'recipe.registered',
  RECIPE_EXECUTION_STARTED: 'recipe.execution_started',
  RECIPE_EXECUTION_COMPLETED: 'recipe.execution_completed',
  RECIPE_EXECUTION_FAILED: 'recipe.execution_failed',
  RECIPE_EXECUTION_CANCELLED: 'recipe.execution_cancelled',
  RECIPE_ROLLBACK_STARTED: 'recipe.rollback_started',
  RECIPE_ROLLBACK_COMPLETED: 'recipe.rollback_completed',
  // Policy
  POLICY_DECISION: 'policy.decision',
  POLICY_OVERRIDE: 'policy.override',
  // Control
  CONTROL_COMMAND_DISPATCHED: 'control.command_dispatched',
  CONTROL_COMMAND_REJECTED: 'control.command_rejected',
  CONTROL_SAFETY_INTERLOCK: 'control.safety_interlock',
  // Auth
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_TOKEN_REFRESH: 'auth.token_refresh',
  AUTH_ACCESS_DENIED: 'auth.access_denied',
  // Capability
  CAPABILITY_REGISTERED: 'capability.registered',
  CAPABILITY_DEREGISTERED: 'capability.deregistered',
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Entry (canonical immutable record)
// ─────────────────────────────────────────────────────────────────────────────

export const AuditLogEntrySchema = z.object({
  /** Unique audit record identifier — immutable once written */
  id: z.string().uuid().optional(), // Optional for fire-and-forget emit; required in storage
  /** ISO 8601 UTC timestamp */
  timestamp: z.string().datetime(),
  /** Log level; always 'audit' to distinguish from operational logs */
  level: z.literal('audit'),
  /** Structured action vocabulary — AUDIT_ACTION constants */
  action: z.string().min(1),
  /** Resource type (site, recipe, capability, control, auth, policy) */
  resource: z.string().min(1),
  /** Primary resource identifier */
  resourceId: z.string().optional(),
  /** Outcome of the action */
  outcome: AuditOutcomeSchema,
  /** Severity classification — defaults to info */
  severity: AuditSeveritySchema.default('info'),
  /** Operator/service actor performing the action */
  actorId: z.string().optional(),
  /** Site context — siteId for multi-tenant queries */
  siteId: z.string().optional(),
  /** Distributed trace correlation identifier */
  traceId: z.string().optional(),
  /** Action-specific details — arbitrary structured data */
  details: z.record(z.unknown()).optional(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight emit helper type (input to the audit logger)
// ─────────────────────────────────────────────────────────────────────────────

export const AuditEventInputSchema = AuditLogEntrySchema.omit({
  id: true,
  level: true,
  timestamp: true,
  severity: true,
}).extend({
  severity: AuditSeveritySchema.optional(),
});

export type AuditEventInput = z.infer<typeof AuditEventInputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Audit Query (for log retrieval/filtering)
// ─────────────────────────────────────────────────────────────────────────────

export const AuditQuerySchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  outcome: AuditOutcomeSchema.optional(),
  severity: AuditSeveritySchema.optional(),
  actorId: z.string().optional(),
  siteId: z.string().optional(),
  traceId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});

export type AuditQuery = z.infer<typeof AuditQuerySchema>;

