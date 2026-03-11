import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Recipe,
  RecipeExecutionRequestSchema,
  RecipeExecutionSchema,
  RecipeExecutionStatsSchema,
  RecipeExecutionStatus,
  RecipePriority,
  RecipeQuerySchema,
  RecipeSchema,
  RecipeStepType,
  SafetyCheckType,
} from '../types/index';
import { RecipeExecutorService } from '../services/recipe-executor.service';

vi.mock('@neurologix/core/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const buildRecipeInput = (
  overrides: Partial<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>> = {}
): Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: 'Contract Recipe Alpha',
  description: 'Recipe executor contract baseline',
  version: '1.0.0',
  priority: RecipePriority.NORMAL,
  category: 'contract-tests',
  tags: ['contract', 'recipe-executor'],
  requiresApproval: false,
  requiresDualApproval: false,
  allowParallelExecution: true,
  maxConcurrentExecutions: 1,
  safetyLevel: 'medium',
  emergencyStopEnabled: true,
  rollbackOnFailure: true,
  steps: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Initialize line',
      description: 'Initialize the target line',
      type: RecipeStepType.COMMAND,
      order: 0,
      command: 'line.initialize',
      timeout: 5000,
      retryCount: 1,
      retryDelay: 500,
      skipOnFailure: false,
      safetyChecks: [SafetyCheckType.PLC_INTERLOCK],
      requiredResources: ['plc-a'],
      tags: ['init'],
      metadata: { stage: 'initialize' },
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Start conveyor',
      description: 'Start conveyor safely',
      type: RecipeStepType.COMMAND,
      order: 1,
      command: 'conveyor.start',
      timeout: 3000,
      retryCount: 1,
      retryDelay: 250,
      skipOnFailure: false,
      safetyChecks: [SafetyCheckType.ZONE_CLEAR, SafetyCheckType.EQUIPMENT_READY],
      requiredResources: ['conveyor-a'],
      rollbackCommand: 'conveyor.stop',
      rollbackTimeout: 2000,
      tags: ['conveyor'],
      metadata: { stage: 'run' },
    },
  ],
  dependencies: [],
  requiredResources: ['plc-a', 'conveyor-a'],
  requiredCapabilities: ['opcua-adapter'],
  preconditions: ['line_ready'],
  postconditions: ['conveyor_running'],
  author: 'contract-suite',
  metadata: { suite: 'recipe-executor-contracts' },
  ...overrides,
});

describe('Recipe Executor Service Contract Baseline', () => {
  let service: RecipeExecutorService;

  beforeEach(() => {
    service = new RecipeExecutorService();
  });

  it('enforces create recipe response contract shape', async () => {
    const created = await service.createRecipe(buildRecipeInput());
    const parsed = RecipeSchema.parse(created);

    expect(parsed.name).toBe('Contract Recipe Alpha');
    expect(parsed.priority).toBe(RecipePriority.NORMAL);
    expect(parsed.steps).toHaveLength(2);
  });

  it('enforces recipe query response contract shape with pagination metadata', async () => {
    await service.createRecipe(buildRecipeInput());
    await service.createRecipe(
      buildRecipeInput({
        name: 'Contract Recipe Beta',
        version: '1.1.0',
        tags: ['contract', 'query'],
      })
    );

    const query = RecipeQuerySchema.parse({
      category: 'contract-tests',
      page: 1,
      pageSize: 5,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    const response = await service.queryRecipes(query);
    response.recipes.forEach(recipe => RecipeSchema.parse(recipe));

    expect(response.page).toBe(query.page);
    expect(response.pageSize).toBe(query.pageSize);
    expect(response.total).toBeGreaterThanOrEqual(2);
    expect(response.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('enforces execution request and response contract shape', async () => {
    const recipe = await service.createRecipe(buildRecipeInput());
    const request = RecipeExecutionRequestSchema.parse({
      recipeId: recipe.id,
      executedBy: 'operator-contract',
      context: {
        siteId: 'site-a',
        lineId: 'line-1',
      },
      parameters: {
        targetSpeed: 120,
      },
      safetyChecks: false,
      rollbackOnFailure: true,
      dryRun: true,
      tags: ['contract'],
      metadata: {
        requestedBy: 'contract-suite',
      },
    });

    const execution = await service.executeRecipe(request);
    const parsed = RecipeExecutionSchema.parse(execution);

    expect(parsed.recipeId).toBe(recipe.id);
    expect(parsed.executedBy).toBe(request.executedBy);
    expect(parsed.status).toBe(RecipeExecutionStatus.COMPLETED);
    expect(parsed.result?.dryRun).toBe(true);
  });

  it('enforces execution statistics response contract shape', async () => {
    const recipe = await service.createRecipe(buildRecipeInput());
    await service.executeRecipe(
      RecipeExecutionRequestSchema.parse({
        recipeId: recipe.id,
        executedBy: 'operator-stats',
        context: {},
        parameters: {},
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: true,
        tags: ['stats'],
        metadata: {},
      })
    );

    const stats = await service.getExecutionStats();
    const parsed = RecipeExecutionStatsSchema.parse(stats);

    expect(parsed.totalRecipes).toBeGreaterThanOrEqual(1);
    expect(parsed.totalExecutions).toBeGreaterThanOrEqual(1);
    expect(parsed.mostExecutedRecipes[0]?.recipeId).toBe(recipe.id);
    expect(parsed.recentExecutions.length).toBeGreaterThanOrEqual(1);
  });

  it('enforces execution progress response shape', async () => {
    const recipe = await service.createRecipe(buildRecipeInput());
    const execution = await service.executeRecipe(
      RecipeExecutionRequestSchema.parse({
        recipeId: recipe.id,
        executedBy: 'operator-progress',
        context: {},
        parameters: {},
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: true,
        tags: ['progress'],
        metadata: {},
      })
    );

    const progress = await service.getExecutionProgress(execution.id);

    expect(progress.executionId).toBe(execution.id);
    expect(Object.values(RecipeExecutionStatus)).toContain(progress.status);
    expect(progress.completedSteps).toBeGreaterThanOrEqual(0);
    expect(progress.totalSteps).toBe(recipe.steps.length);
    expect(progress.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(progress.progressPercentage).toBeLessThanOrEqual(100);
    expect(Number.isNaN(Date.parse(progress.lastUpdated))).toBe(false);
  });
});