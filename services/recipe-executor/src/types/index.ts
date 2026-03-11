import { z } from 'zod';
import {
  RECIPE_EXECUTION_STATUS,
  STEP_EXECUTION_STATUS,
  RECIPE_PRIORITY,
  RECIPE_STEP_TYPE,
  SAFETY_CHECK_TYPE,
  RecipeSchema,
  RecipeStepSchema,
  RecipeExecutionRequestSchema,
  RecipeExecutionSchema,
  RecipeValidationResultSchema,
  RecipeExecutionStatusSchema,
  RecipePrioritySchema,
  RecipeSafetyLevelSchema,
  type Recipe,
  type RecipeStep,
  type RecipeExecutionRequest,
  type RecipeExecution,
  type RecipeValidationResult,
  type RecipeExecutionStatus as CanonicalRecipeExecutionStatus,
  type StepExecutionStatus as CanonicalStepExecutionStatus,
  type RecipePriority as CanonicalRecipePriority,
  type RecipeStepType as CanonicalRecipeStepType,
  type SafetyCheckType as CanonicalSafetyCheckType,
} from '@neurologix/schemas';

export const RecipeExecutionStatus = RECIPE_EXECUTION_STATUS;
export const StepExecutionStatus = STEP_EXECUTION_STATUS;
export const RecipePriority = RECIPE_PRIORITY;
export const RecipeStepType = RECIPE_STEP_TYPE;
export const SafetyCheckType = SAFETY_CHECK_TYPE;

export type RecipeExecutionStatus = CanonicalRecipeExecutionStatus;
export type StepExecutionStatus = CanonicalStepExecutionStatus;
export type RecipePriority = CanonicalRecipePriority;
export type RecipeStepType = CanonicalRecipeStepType;
export type SafetyCheckType = CanonicalSafetyCheckType;

export {
  RecipeSchema,
  RecipeStepSchema,
  RecipeExecutionRequestSchema,
  RecipeExecutionSchema,
  RecipeValidationResultSchema,
};

export type { Recipe, RecipeStep, RecipeExecutionRequest, RecipeExecution, RecipeValidationResult };

export const RecipeQuerySchema = z.object({
  category: z.string().optional(),
  priority: RecipePrioritySchema.optional(),
  safetyLevel: RecipeSafetyLevelSchema.optional(),
  status: z.array(RecipeExecutionStatusSchema).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  executedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const RecipeExecutionStatsSchema = z.object({
  totalRecipes: z.number().int().min(0),
  totalExecutions: z.number().int().min(0),
  successfulExecutions: z.number().int().min(0),
  failedExecutions: z.number().int().min(0),
  averageExecutionTime: z.number().min(0),
  executionsByStatus: z.record(z.number().int().min(0)),
  executionsByPriority: z.record(z.number().int().min(0)),
  safetyViolations: z.number().int().min(0),
  emergencyStops: z.number().int().min(0),
  rollbacksExecuted: z.number().int().min(0),
  averageStepsPerRecipe: z.number().min(0),
  mostExecutedRecipes: z.array(
    z.object({
      recipeId: z.string().uuid(),
      recipeName: z.string(),
      executionCount: z.number().int().min(0),
    })
  ),
  recentExecutions: z.array(RecipeExecutionSchema).max(10),
});

export type RecipeQuery = z.infer<typeof RecipeQuerySchema>;
export type RecipeExecutionStats = z.infer<typeof RecipeExecutionStatsSchema>;

export interface RecipeExecutionProgress {
  executionId: string;
  status: RecipeExecutionStatus;
  currentStep: string | null;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  estimatedTimeRemaining: number | null;
  lastUpdated: string;
}
