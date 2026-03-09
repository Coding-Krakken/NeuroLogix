import { z } from 'zod';

/**
 * Recipe execution status enumeration
 * Tracks the current state of recipe execution
 */
export enum RecipeExecutionStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  APPROVED = 'approved',
  EXECUTING = 'executing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ROLLING_BACK = 'rolling_back',
  ROLLED_BACK = 'rolled_back',
}

/**
 * Recipe step execution status
 */
export enum StepExecutionStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
}

/**
 * Recipe priority levels for execution scheduling
 */
export enum RecipePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

/**
 * Recipe step types
 */
export enum RecipeStepType {
  COMMAND = 'command',
  WAIT = 'wait',
  CONDITION = 'condition',
  PARALLEL = 'parallel',
  SAFETY_CHECK = 'safety_check',
  ROLLBACK = 'rollback',
}

/**
 * Safety check types for recipe validation
 */
export enum SafetyCheckType {
  PLC_INTERLOCK = 'plc_interlock',
  EMERGENCY_STOP = 'emergency_stop',
  ZONE_CLEAR = 'zone_clear',
  EQUIPMENT_READY = 'equipment_ready',
  RESOURCE_AVAILABLE = 'resource_available',
  POLICY_COMPLIANCE = 'policy_compliance',
}

/**
 * Recipe step definition schema
 */
export const RecipeStepSchema = z.object({
  id: z.string().uuid('Step ID must be a valid UUID'),
  name: z.string().min(1, 'Step name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(RecipeStepType),
  order: z.number().int().min(0, 'Step order must be non-negative'),

  // Step configuration
  command: z.string().optional(),
  timeout: z.number().int().min(0).optional(),
  retryCount: z.number().int().min(0).max(10).default(0),
  retryDelay: z.number().int().min(0).default(1000),

  // Conditional execution
  condition: z.string().optional(),
  skipOnFailure: z.boolean().default(false),

  // Safety and validation
  safetyChecks: z.array(z.nativeEnum(SafetyCheckType)).default([]),
  requiredResources: z.array(z.string()).default([]),

  // Rollback configuration
  rollbackCommand: z.string().optional(),
  rollbackTimeout: z.number().int().min(0).optional(),

  // Parallel execution
  parallelSteps: z.array(z.string().uuid()).optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

/**
 * Recipe definition schema
 */
export const RecipeSchema = z.object({
  id: z.string().uuid('Recipe ID must be a valid UUID'),
  name: z.string().min(1, 'Recipe name is required'),
  description: z.string().optional(),
  version: z.string().min(1, 'Version is required'),

  // Recipe configuration
  priority: z.nativeEnum(RecipePriority).default(RecipePriority.NORMAL),
  category: z.string().default('general'),
  tags: z.array(z.string()).default([]),

  // Execution settings
  requiresApproval: z.boolean().default(false),
  requiresDualApproval: z.boolean().default(false),
  allowParallelExecution: z.boolean().default(true),
  maxConcurrentExecutions: z.number().int().min(1).default(1),

  // Safety settings
  safetyLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  emergencyStopEnabled: z.boolean().default(true),
  rollbackOnFailure: z.boolean().default(true),

  // Recipe steps
  steps: z.array(RecipeStepSchema).min(1, 'Recipe must have at least one step'),

  // Dependencies and resources
  dependencies: z.array(z.string()).default([]),
  requiredResources: z.array(z.string()).default([]),
  requiredCapabilities: z.array(z.string()).default([]),

  // Validation rules
  preconditions: z.array(z.string()).default([]),
  postconditions: z.array(z.string()).default([]),

  // Metadata
  author: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  metadata: z.record(z.any()).default({}),
});

/**
 * Recipe execution request schema
 */
export const RecipeExecutionRequestSchema = z.object({
  recipeId: z.string().uuid('Recipe ID must be a valid UUID'),
  executedBy: z.string().min(1, 'Executor ID is required'),
  approvedBy: z.string().optional(),
  secondApprover: z.string().optional(),

  // Execution context
  context: z.record(z.any()).default({}),
  parameters: z.record(z.any()).default({}),

  // Execution settings
  priority: z.nativeEnum(RecipePriority).optional(),
  safetyChecks: z.boolean().default(true),
  rollbackOnFailure: z.boolean().default(true),
  dryRun: z.boolean().default(false),

  // Scheduling
  scheduleAt: z.date().optional(),
  expiresAt: z.date().optional(),

  // Metadata
  reason: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

/**
 * Recipe execution result schema
 */
export const RecipeExecutionSchema = z.object({
  id: z.string().uuid('Execution ID must be a valid UUID'),
  recipeId: z.string().uuid('Recipe ID must be a valid UUID'),
  recipeName: z.string(),
  recipeVersion: z.string(),

  // Execution details
  status: z.nativeEnum(RecipeExecutionStatus),
  executedBy: z.string(),
  approvedBy: z.string().optional(),
  secondApprover: z.string().optional(),

  // Timing information
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  duration: z.number().int().min(0).optional(),

  // Execution context
  context: z.record(z.any()).default({}),
  parameters: z.record(z.any()).default({}),

  // Progress tracking
  totalSteps: z.number().int().min(0),
  completedSteps: z.number().int().min(0),
  failedSteps: z.number().int().min(0),
  currentStep: z.string().optional(),

  // Results and errors
  result: z.record(z.any()).optional(),
  error: z.string().optional(),
  stepResults: z
    .array(
      z.object({
        stepId: z.string().uuid(),
        status: z.nativeEnum(StepExecutionStatus),
        startedAt: z.date(),
        completedAt: z.date().optional(),
        duration: z.number().int().min(0).optional(),
        result: z.record(z.any()).optional(),
        error: z.string().optional(),
      })
    )
    .default([]),

  // Safety and compliance
  safetyViolations: z
    .array(
      z.object({
        type: z.string(),
        message: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        timestamp: z.date(),
      })
    )
    .default([]),

  // Rollback information
  rollbackExecuted: z.boolean().default(false),
  rollbackSteps: z.array(z.string()).default([]),
  rollbackResult: z.record(z.any()).optional(),

  // Metadata
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * Recipe query schema for filtering and searching
 */
export const RecipeQuerySchema = z.object({
  // Basic filtering
  category: z.string().optional(),
  priority: z.nativeEnum(RecipePriority).optional(),
  safetyLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.array(z.nativeEnum(RecipeExecutionStatus)).optional(),

  // Search
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),

  // Date filtering
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),

  // User filtering
  executedBy: z.string().optional(),
  approvedBy: z.string().optional(),

  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),

  // Sorting
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Recipe execution statistics schema
 */
export const RecipeExecutionStatsSchema = z.object({
  totalRecipes: z.number().int().min(0),
  totalExecutions: z.number().int().min(0),
  successfulExecutions: z.number().int().min(0),
  failedExecutions: z.number().int().min(0),
  averageExecutionTime: z.number().min(0),

  // Status breakdown
  executionsByStatus: z.record(z.number().int().min(0)),

  // Priority breakdown
  executionsByPriority: z.record(z.number().int().min(0)),

  // Safety statistics
  safetyViolations: z.number().int().min(0),
  emergencyStops: z.number().int().min(0),
  rollbacksExecuted: z.number().int().min(0),

  // Performance metrics
  averageStepsPerRecipe: z.number().min(0),
  mostExecutedRecipes: z.array(
    z.object({
      recipeId: z.string().uuid(),
      recipeName: z.string(),
      executionCount: z.number().int().min(0),
    })
  ),

  // Recent activity
  recentExecutions: z.array(RecipeExecutionSchema).max(10),
});

// Export type definitions
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeStep = z.infer<typeof RecipeStepSchema>;
export type RecipeExecutionRequest = z.infer<typeof RecipeExecutionRequestSchema>;
export type RecipeExecution = z.infer<typeof RecipeExecutionSchema>;
export type RecipeQuery = z.infer<typeof RecipeQuerySchema>;
export type RecipeExecutionStats = z.infer<typeof RecipeExecutionStatsSchema>;

/**
 * Recipe validation result interface
 */
export interface RecipeValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  safetyChecks: Array<{
    type: SafetyCheckType;
    status: 'passed' | 'failed' | 'warning';
    message: string;
  }>;
}

/**
 * Recipe execution progress interface
 */
export interface RecipeExecutionProgress {
  executionId: string;
  status: RecipeExecutionStatus;
  currentStep: string | null;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  estimatedTimeRemaining: number | null;
  lastUpdated: Date;
}
