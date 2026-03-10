/**
 * @fileoverview Canonical recipe schemas for NeuroLogix ICS automation
 *
 * Recipes are the core automation primitive: ordered, validated, safety-checked
 * sequences of control commands that the AI can compose and the system can
 * execute deterministically. All control flows through validated recipes.
 *
 * Model ref: system_state_model.yaml
 * Safety ref: IEC 62443 — AI never bypasses PLC interlocks
 * Constraint: No PLC command without a validated recipe (SAFETY-FIRST)
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Enumerations
// ─────────────────────────────────────────────────────────────────────────────

export const RECIPE_EXECUTION_STATUS = {
  PENDING: 'pending',
  VALIDATING: 'validating',
  APPROVED: 'approved',
  EXECUTING: 'executing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ROLLING_BACK: 'rolling_back',
  ROLLED_BACK: 'rolled_back',
} as const;

export type RecipeExecutionStatus =
  (typeof RECIPE_EXECUTION_STATUS)[keyof typeof RECIPE_EXECUTION_STATUS];

export const RecipeExecutionStatusSchema = z.enum([
  'pending',
  'validating',
  'approved',
  'executing',
  'paused',
  'completed',
  'failed',
  'cancelled',
  'rolling_back',
  'rolled_back',
]);

export const STEP_EXECUTION_STATUS = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  RETRYING: 'retrying',
} as const;

export type StepExecutionStatus =
  (typeof STEP_EXECUTION_STATUS)[keyof typeof STEP_EXECUTION_STATUS];
export const StepExecutionStatusSchema = z.enum([
  'pending',
  'executing',
  'completed',
  'failed',
  'skipped',
  'retrying',
]);

export const RECIPE_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
} as const;

export type RecipePriority = (typeof RECIPE_PRIORITY)[keyof typeof RECIPE_PRIORITY];
export const RecipePrioritySchema = z.enum(['low', 'normal', 'high', 'critical', 'emergency']);

export const RECIPE_STEP_TYPE = {
  COMMAND: 'command',
  WAIT: 'wait',
  CONDITION: 'condition',
  PARALLEL: 'parallel',
  SAFETY_CHECK: 'safety_check',
  ROLLBACK: 'rollback',
} as const;

export type RecipeStepType = (typeof RECIPE_STEP_TYPE)[keyof typeof RECIPE_STEP_TYPE];
export const RecipeStepTypeSchema = z.enum([
  'command',
  'wait',
  'condition',
  'parallel',
  'safety_check',
  'rollback',
]);

export const SAFETY_CHECK_TYPE = {
  PLC_INTERLOCK: 'plc_interlock',
  EMERGENCY_STOP: 'emergency_stop',
  ZONE_CLEAR: 'zone_clear',
  EQUIPMENT_READY: 'equipment_ready',
  RESOURCE_AVAILABLE: 'resource_available',
  POLICY_COMPLIANCE: 'policy_compliance',
} as const;

export type SafetyCheckType = (typeof SAFETY_CHECK_TYPE)[keyof typeof SAFETY_CHECK_TYPE];
export const SafetyCheckTypeSchema = z.enum([
  'plc_interlock',
  'emergency_stop',
  'zone_clear',
  'equipment_ready',
  'resource_available',
  'policy_compliance',
]);

export const RECIPE_SAFETY_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type RecipeSafetyLevel = (typeof RECIPE_SAFETY_LEVEL)[keyof typeof RECIPE_SAFETY_LEVEL];
export const RecipeSafetyLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

// ─────────────────────────────────────────────────────────────────────────────
// Recipe Step
// ─────────────────────────────────────────────────────────────────────────────

export const RecipeStepSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: RecipeStepTypeSchema,
  order: z.number().int().min(0),
  // Execution
  command: z.string().optional(),
  timeout: z.number().int().min(0).optional(),
  retryCount: z.number().int().min(0).max(10).default(0),
  retryDelay: z.number().int().min(0).default(1000),
  // Conditional
  condition: z.string().optional(),
  skipOnFailure: z.boolean().default(false),
  // Safety
  safetyChecks: z.array(SafetyCheckTypeSchema).default([]),
  requiredResources: z.array(z.string()).default([]),
  // Rollback
  rollbackCommand: z.string().optional(),
  rollbackTimeout: z.number().int().min(0).optional(),
  // Parallel
  parallelSteps: z.array(z.string().uuid()).optional(),
  // Metadata
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type RecipeStep = z.infer<typeof RecipeStepSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Recipe Definition
// ─────────────────────────────────────────────────────────────────────────────

export const RecipeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().min(1),
  // Configuration
  priority: RecipePrioritySchema.default('normal'),
  category: z.string().default('general'),
  tags: z.array(z.string()).default([]),
  // Approval
  requiresApproval: z.boolean().default(false),
  requiresDualApproval: z.boolean().default(false),
  allowParallelExecution: z.boolean().default(true),
  maxConcurrentExecutions: z.number().int().min(1).default(1),
  // Safety
  safetyLevel: RecipeSafetyLevelSchema.default('medium'),
  emergencyStopEnabled: z.boolean().default(true),
  rollbackOnFailure: z.boolean().default(true),
  // Steps
  steps: z.array(RecipeStepSchema).min(1),
  // Dependencies
  dependencies: z.array(z.string()).default([]),
  requiredResources: z.array(z.string()).default([]),
  requiredCapabilities: z.array(z.string()).default([]),
  // Validation
  preconditions: z.array(z.string()).default([]),
  postconditions: z.array(z.string()).default([]),
  // Authorship
  author: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Recipe Execution Request
// ─────────────────────────────────────────────────────────────────────────────

export const RecipeExecutionRequestSchema = z.object({
  recipeId: z.string().uuid(),
  executedBy: z.string().min(1),
  approvedBy: z.string().optional(),
  secondApprover: z.string().optional(),
  context: z.record(z.unknown()).default({}),
  parameters: z.record(z.unknown()).default({}),
  priority: RecipePrioritySchema.optional(),
  safetyChecks: z.boolean().default(true),
  rollbackOnFailure: z.boolean().default(true),
  dryRun: z.boolean().default(false),
  scheduleAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  reason: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type RecipeExecutionRequest = z.infer<typeof RecipeExecutionRequestSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Step Execution Result
// ─────────────────────────────────────────────────────────────────────────────

export const StepExecutionResultSchema = z.object({
  stepId: z.string().uuid(),
  status: StepExecutionStatusSchema,
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  durationMs: z.number().int().min(0).optional(),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

export type StepExecutionResult = z.infer<typeof StepExecutionResultSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Safety Violation
// ─────────────────────────────────────────────────────────────────────────────

export const SafetyViolationSchema = z.object({
  type: SafetyCheckTypeSchema,
  message: z.string().min(1),
  severity: RecipeSafetyLevelSchema,
  timestamp: z.string().datetime(),
});

export type SafetyViolation = z.infer<typeof SafetyViolationSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Recipe Execution Record
// ─────────────────────────────────────────────────────────────────────────────

export const RecipeExecutionSchema = z.object({
  id: z.string().uuid(),
  recipeId: z.string().uuid(),
  recipeName: z.string().min(1),
  recipeVersion: z.string().min(1),
  status: RecipeExecutionStatusSchema,
  executedBy: z.string().min(1),
  approvedBy: z.string().optional(),
  secondApprover: z.string().optional(),
  // Timing
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  durationMs: z.number().int().min(0).optional(),
  // Context
  context: z.record(z.unknown()).default({}),
  parameters: z.record(z.unknown()).default({}),
  // Progress
  totalSteps: z.number().int().min(0),
  completedSteps: z.number().int().min(0),
  failedSteps: z.number().int().min(0),
  currentStep: z.string().optional(),
  // Results
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  stepResults: z.array(StepExecutionResultSchema).default([]),
  // Safety
  safetyViolations: z.array(SafetyViolationSchema).default([]),
  rollbackExecuted: z.boolean().default(false),
  rollbackSteps: z.array(z.string()).default([]),
  rollbackResult: z.record(z.unknown()).optional(),
  // Metadata
  siteId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RecipeExecution = z.infer<typeof RecipeExecutionSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Recipe Validation Result
// ─────────────────────────────────────────────────────────────────────────────

export const RecipeValidationMessageSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
});

export type RecipeValidationMessage = z.infer<typeof RecipeValidationMessageSchema>;

export const SafetyCheckResultSchema = z.object({
  type: SafetyCheckTypeSchema,
  status: z.enum(['passed', 'failed', 'warning']),
  message: z.string(),
});

export type SafetyCheckResult = z.infer<typeof SafetyCheckResultSchema>;

export const RecipeValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(RecipeValidationMessageSchema),
  warnings: z.array(z.object({ field: z.string(), message: z.string() })),
  safetyChecks: z.array(SafetyCheckResultSchema),
});

export type RecipeValidationResult = z.infer<typeof RecipeValidationResultSchema>;

