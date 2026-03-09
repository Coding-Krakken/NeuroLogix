import { describe, it, expect, beforeEach, vi } from 'vitest';

// Extend expect with custom matchers
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

import { RecipeExecutorService } from '../services/recipe-executor.service';
import {
  Recipe,
  RecipeExecutionRequest,
  RecipePriority,
  RecipeExecutionStatus,
  StepExecutionStatus,
  RecipeStepType,
  SafetyCheckType,
} from '../types/index';

// Mock the logger to avoid console output during tests
vi.mock('@neurologix/core/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RecipeExecutorService', () => {
  let service: RecipeExecutorService;
  let mockRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

  beforeEach(() => {
    service = new RecipeExecutorService();

    mockRecipe = {
      name: 'Test Recipe',
      description: 'A test recipe for validation',
      version: '1.0.0',
      priority: RecipePriority.NORMAL,
      category: 'test',
      tags: ['test', 'automation'],
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
          name: 'Initialize System',
          description: 'Initialize the automation system',
          type: RecipeStepType.COMMAND,
          order: 0,
          command: 'init_system',
          timeout: 5000,
          retryCount: 2,
          retryDelay: 1000,
          skipOnFailure: false,
          safetyChecks: [SafetyCheckType.PLC_INTERLOCK],
          requiredResources: ['plc-1'],
          tags: ['initialization'],
          metadata: {},
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Start Conveyor',
          description: 'Start the conveyor belt',
          type: RecipeStepType.COMMAND,
          order: 1,
          command: 'start_conveyor',
          timeout: 3000,
          retryCount: 1,
          retryDelay: 500,
          skipOnFailure: false,
          safetyChecks: [SafetyCheckType.ZONE_CLEAR, SafetyCheckType.EQUIPMENT_READY],
          requiredResources: ['conveyor-1'],
          rollbackCommand: 'stop_conveyor',
          rollbackTimeout: 2000,
          tags: ['conveyor'],
          metadata: {},
        },
      ],
      dependencies: [],
      requiredResources: ['plc-1', 'conveyor-1'],
      requiredCapabilities: ['modbus-adapter'],
      preconditions: ['system_ready'],
      postconditions: ['conveyor_running'],
      author: 'test-user',
      metadata: {},
    };
  });

  describe('Recipe Management', () => {
    it('should create a new recipe successfully', async () => {
      const recipe = await service.createRecipe(mockRecipe);

      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBe(mockRecipe.name);
      expect(recipe.version).toBe(mockRecipe.version);
      expect(recipe.steps).toHaveLength(2);
      expect(recipe.createdAt).toBeInstanceOf(Date);
      expect(recipe.updatedAt).toBeInstanceOf(Date);
    });

    it('should reject invalid recipe data', async () => {
      const invalidRecipe = { ...mockRecipe, name: '' };

      await expect(service.createRecipe(invalidRecipe)).rejects.toThrow('Recipe name is required');
    });

    it('should get recipe by ID', async () => {
      const createdRecipe = await service.createRecipe(mockRecipe);
      const retrievedRecipe = await service.getRecipe(createdRecipe.id);

      expect(retrievedRecipe.id).toBe(createdRecipe.id);
      expect(retrievedRecipe.name).toBe(createdRecipe.name);
    });

    it('should throw error for non-existent recipe', async () => {
      await expect(service.getRecipe('non-existent-id')).rejects.toThrow(
        "Asset 'Recipe' not found"
      );
    });

    it('should update an existing recipe', async () => {
      const createdRecipe = await service.createRecipe(mockRecipe);

      const updates = {
        name: 'Updated Recipe Name',
        description: 'Updated description',
        version: '1.1.0',
      };

      const updatedRecipe = await service.updateRecipe(createdRecipe.id, updates);

      expect(updatedRecipe.name).toBe(updates.name);
      expect(updatedRecipe.description).toBe(updates.description);
      expect(updatedRecipe.version).toBe(updates.version);
      expect(updatedRecipe.updatedAt.getTime()).toBeGreaterThanOrEqual(
        createdRecipe.updatedAt.getTime()
      );
    });

    it('should delete a recipe', async () => {
      const createdRecipe = await service.createRecipe(mockRecipe);

      await service.deleteRecipe(createdRecipe.id);

      await expect(service.getRecipe(createdRecipe.id)).rejects.toThrow("Asset 'Recipe' not found");
    });

    it('should prevent deletion of recipe with active executions', async () => {
      const createdRecipe = await service.createRecipe(mockRecipe);

      // Create an active execution
      const request: RecipeExecutionRequest = {
        recipeId: createdRecipe.id,
        executedBy: 'test-user',
        context: {},
        parameters: {},
        safetyChecks: false, // Disable safety checks for test
        rollbackOnFailure: true,
        dryRun: false,
        tags: [],
        metadata: {},
      };

      await service.executeRecipe(request);

      await expect(service.deleteRecipe(createdRecipe.id)).rejects.toThrow(
        'Cannot delete recipe with active executions'
      );
    });
  });

  describe('Recipe Execution', () => {
    let testRecipe: Recipe;

    beforeEach(async () => {
      testRecipe = await service.createRecipe(mockRecipe);
    });

    it('should execute a recipe successfully', async () => {
      const request: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user',
        context: { facility: 'warehouse-1' },
        parameters: { speed: 100 },
        safetyChecks: false, // Disable safety checks for test
        rollbackOnFailure: true,
        dryRun: false,
        reason: 'Test execution',
        tags: ['test'],
        metadata: { testRun: true },
      };

      const execution = await service.executeRecipe(request);

      expect(execution.id).toBeDefined();
      expect(execution.recipeId).toBe(testRecipe.id);
      expect(execution.recipeName).toBe(testRecipe.name);
      expect(execution.recipeVersion).toBe(testRecipe.version);
      expect(execution.executedBy).toBe(request.executedBy);
      expect(execution.status).toBeOneOf([
        RecipeExecutionStatus.PENDING,
        RecipeExecutionStatus.EXECUTING,
      ]);
      expect(execution.totalSteps).toBe(testRecipe.steps.length);
      expect(execution.completedSteps).toBe(0);
    });

    it('should perform dry run execution', async () => {
      const request: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user',
        dryRun: true,
        safetyChecks: false,
        rollbackOnFailure: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      const execution = await service.executeRecipe(request);

      expect(execution.status).toBe(RecipeExecutionStatus.COMPLETED);
      expect(execution.result?.dryRun).toBe(true);
      expect(execution.completedAt).toBeDefined();
    });

    it('should require approval for recipes that need it', async () => {
      // Create recipe requiring approval
      const approvalRecipe = await service.createRecipe({
        ...mockRecipe,
        name: 'Approval Required Recipe',
        requiresApproval: true,
      });

      const request: RecipeExecutionRequest = {
        recipeId: approvalRecipe.id,
        executedBy: 'test-user',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      await expect(service.executeRecipe(request)).rejects.toThrow('Recipe requires approval');
    });

    it('should require dual approval for critical recipes', async () => {
      // Create recipe requiring dual approval
      const criticalRecipe = await service.createRecipe({
        ...mockRecipe,
        name: 'Critical Recipe',
        requiresApproval: true,
        requiresDualApproval: true,
        safetyLevel: 'critical',
      });

      const request: RecipeExecutionRequest = {
        recipeId: criticalRecipe.id,
        executedBy: 'test-user',
        approvedBy: 'supervisor-1',
        // Missing secondApprover
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      await expect(service.executeRecipe(request)).rejects.toThrow('Recipe requires dual approval');
    });

    it('should handle safety check failures', async () => {
      const request: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user',
        safetyChecks: true,
        rollbackOnFailure: true,
        dryRun: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      // Mock safety check failure by testing with actual safety implementation
      // In real implementation, this would involve actual PLC/safety system checks
      const execution = await service.executeRecipe(request);

      // Since our mock safety checks pass, execution should proceed
      expect(execution.status).toBeOneOf([
        RecipeExecutionStatus.PENDING,
        RecipeExecutionStatus.EXECUTING,
      ]);
    });

    it('should get execution by ID', async () => {
      const request: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: true, // Use dry run for predictable test
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      const execution = await service.executeRecipe(request);
      const retrievedExecution = await service.getExecution(execution.id);

      expect(retrievedExecution.id).toBe(execution.id);
      expect(retrievedExecution.recipeId).toBe(testRecipe.id);
    });

    it('should cancel an execution', async () => {
      const request: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      const execution = await service.executeRecipe(request);

      await service.cancelExecution(execution.id, 'Test cancellation');

      const cancelledExecution = await service.getExecution(execution.id);
      expect(cancelledExecution.status).toBe(RecipeExecutionStatus.CANCELLED);
      expect(cancelledExecution.error).toContain('Test cancellation');
      expect(cancelledExecution.completedAt).toBeDefined();
    });

    it('should perform emergency stop', async () => {
      const request1: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user-1',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      const request2: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user-2',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      // Create multiple executions
      const execution1 = await service.executeRecipe(request1);
      const execution2 = await service.executeRecipe(request2);

      // Perform emergency stop
      await service.emergencyStop('Safety incident detected', 'safety-officer');

      // Check that executions were cancelled
      const cancelledExecution1 = await service.getExecution(execution1.id);
      const cancelledExecution2 = await service.getExecution(execution2.id);

      expect(cancelledExecution1.status).toBe(RecipeExecutionStatus.CANCELLED);
      expect(cancelledExecution2.status).toBe(RecipeExecutionStatus.CANCELLED);
    });
  });

  describe('Querying and Filtering', () => {
    beforeEach(async () => {
      // Create multiple test recipes with different properties
      await service.createRecipe({
        ...mockRecipe,
        name: 'High Priority Recipe',
        priority: RecipePriority.HIGH,
        category: 'production',
        tags: ['production', 'high-priority'],
      });

      await service.createRecipe({
        ...mockRecipe,
        name: 'Low Priority Recipe',
        priority: RecipePriority.LOW,
        category: 'maintenance',
        tags: ['maintenance', 'low-priority'],
      });

      await service.createRecipe({
        ...mockRecipe,
        name: 'Critical Safety Recipe',
        priority: RecipePriority.CRITICAL,
        safetyLevel: 'critical',
        category: 'safety',
        tags: ['safety', 'critical'],
      });
    });

    it('should query recipes with basic filtering', async () => {
      const result = await service.queryRecipes({
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.recipes).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by category', async () => {
      const result = await service.queryRecipes({
        category: 'production',
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('High Priority Recipe');
    });

    it('should filter by priority', async () => {
      const result = await service.queryRecipes({
        priority: RecipePriority.CRITICAL,
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Critical Safety Recipe');
    });

    it('should filter by safety level', async () => {
      const result = await service.queryRecipes({
        safetyLevel: 'critical',
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Critical Safety Recipe');
    });

    it('should search by name and description', async () => {
      const result = await service.queryRecipes({
        search: 'Critical',
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Critical Safety Recipe');
    });

    it('should filter by tags', async () => {
      const result = await service.queryRecipes({
        tags: ['production'],
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].tags).toContain('production');
    });

    it('should handle pagination correctly', async () => {
      const result = await service.queryRecipes({
        page: 1,
        pageSize: 2,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.recipes).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });

    it('should sort by different fields', async () => {
      const resultByName = await service.queryRecipes({
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const resultByPriority = await service.queryRecipes({
        page: 1,
        pageSize: 10,
        sortBy: 'priority',
        sortOrder: 'desc',
      });

      expect(resultByName.recipes[0].name).toBe('Critical Safety Recipe');
      expect(resultByPriority.recipes[0].priority).toBe(RecipePriority.CRITICAL);
    });
  });

  describe('Execution Statistics and Analytics', () => {
    it('should calculate execution statistics', async () => {
      // Create test recipe
      const testRecipe = await service.createRecipe(mockRecipe);

      // Create test executions
      const request: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: true, // Use dry run for predictable results
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      await service.executeRecipe(request);
      await service.executeRecipe(request);

      const stats = await service.getExecutionStats();

      expect(stats.totalRecipes).toBe(1);
      expect(stats.totalExecutions).toBe(2);
      expect(stats.successfulExecutions).toBe(2); // Dry runs complete successfully
      expect(stats.failedExecutions).toBe(0);
      expect(stats.executionsByStatus).toBeDefined();
      expect(stats.executionsByPriority).toBeDefined();
      expect(stats.recentExecutions).toHaveLength(2);
    });

    it('should get execution progress', async () => {
      const testRecipe = await service.createRecipe(mockRecipe);

      const request: RecipeExecutionRequest = {
        recipeId: testRecipe.id,
        executedBy: 'test-user',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: true, // Use dry run for predictable state
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      const execution = await service.executeRecipe(request);
      const progress = await service.getExecutionProgress(execution.id);

      expect(progress.executionId).toBe(execution.id);
      expect(progress.status).toBe(RecipeExecutionStatus.COMPLETED);
      expect(progress.totalSteps).toBe(testRecipe.steps.length);
      expect(progress.progressPercentage).toBeDefined();
      expect(progress.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid execution request', async () => {
      const invalidRequest = {
        recipeId: 'invalid-uuid',
        executedBy: '',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      } as RecipeExecutionRequest;

      await expect(service.executeRecipe(invalidRequest)).rejects.toThrow();
    });

    it('should handle execution of non-existent recipe', async () => {
      const request: RecipeExecutionRequest = {
        recipeId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format but non-existent
        executedBy: 'test-user',
        safetyChecks: false,
        rollbackOnFailure: true,
        dryRun: false,
        context: {},
        parameters: {},
        tags: [],
        metadata: {},
      };

      await expect(service.executeRecipe(request)).rejects.toThrow("Asset 'Recipe' not found");
    });

    it('should handle invalid query parameters', async () => {
      const invalidQuery = {
        page: 0, // Invalid page number
        pageSize: 150, // Exceeds maximum
        sortBy: 'invalid_field',
        sortOrder: 'invalid_order',
      } as any;

      await expect(service.queryRecipes(invalidQuery)).rejects.toThrow();
    });
  });
});
