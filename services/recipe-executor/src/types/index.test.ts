import { describe, it, expect } from 'vitest';
import {
  Recipe,
  RecipeStep,
  RecipeExecution,
  RecipeExecutionRequest,
  RecipeQuery,
  RecipeExecutionStats,
  RecipeValidationResult,
  RecipeExecutionProgress,
  RecipeExecutionStatus,
  StepExecutionStatus,
  RecipePriority,
  SafetyCheckType,
  RecipeStepType,
  RecipeSchema,
  RecipeStepSchema,
  RecipeExecutionRequestSchema,
  RecipeExecutionSchema,
  RecipeQuerySchema,
  RecipeExecutionStatsSchema,
} from './index';

describe('Recipe Executor Types', () => {
  describe('Schema Validation', () => {
    it('should validate RecipeStep schema correctly', () => {
      const validStep: RecipeStep = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Step',
        description: 'A test step',
        type: RecipeStepType.COMMAND,
        order: 0,
        command: 'test_command',
        timeout: 5000,
        retryCount: 2,
        retryDelay: 1000,
        condition: 'system_ready',
        skipOnFailure: false,
        safetyChecks: [SafetyCheckType.PLC_INTERLOCK, SafetyCheckType.ZONE_CLEAR],
        requiredResources: ['resource-1', 'resource-2'],
        rollbackCommand: 'rollback_test_command',
        rollbackTimeout: 3000,
        tags: ['test', 'validation'],
        metadata: { priority: 'high' },
      };

      const result = RecipeStepSchema.safeParse(validStep);
      expect(result.success).toBe(true);
    });

    it('should reject invalid RecipeStep with missing required fields', () => {
      const invalidStep = {
        // Missing required fields like id, name, type, order
        description: 'Invalid step',
      };

      const result = RecipeStepSchema.safeParse(invalidStep);
      expect(result.success).toBe(false);
    });

    it('should reject RecipeStep with invalid UUID', () => {
      const invalidStep = {
        id: 'not-a-uuid',
        name: 'Test Step',
        type: RecipeStepType.COMMAND,
        order: 0,
      };

      const result = RecipeStepSchema.safeParse(invalidStep);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Step ID must be a valid UUID');
      }
    });

    it('should apply default values for optional RecipeStep fields', () => {
      const minimalStep = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Minimal Step',
        type: RecipeStepType.COMMAND,
        order: 0,
      };

      const result = RecipeStepSchema.safeParse(minimalStep);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.retryCount).toBe(0);
        expect(result.data.retryDelay).toBe(1000);
        expect(result.data.skipOnFailure).toBe(false);
        expect(result.data.safetyChecks).toEqual([]);
        expect(result.data.requiredResources).toEqual([]);
        expect(result.data.tags).toEqual([]);
        expect(result.data.metadata).toEqual({});
      }
    });

    it('should validate Recipe schema correctly', () => {
      const validRecipe: Recipe = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Recipe',
        description: 'A comprehensive test recipe',
        version: '1.0.0',
        priority: RecipePriority.NORMAL,
        category: 'testing',
        tags: ['test', 'automation'],
        requiresApproval: true,
        requiresDualApproval: false,
        allowParallelExecution: true,
        maxConcurrentExecutions: 2,
        safetyLevel: 'high',
        emergencyStopEnabled: true,
        rollbackOnFailure: true,
        steps: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Test Step',
            type: RecipeStepType.COMMAND,
            order: 0,
            command: 'test_command',
            safetyChecks: [],
            requiredResources: [],
            tags: [],
            metadata: {},
            retryCount: 0,
            retryDelay: 1000,
            skipOnFailure: false,
          },
        ],
        dependencies: ['dependency-1'],
        requiredResources: ['resource-1'],
        requiredCapabilities: ['capability-1'],
        preconditions: ['system_ready'],
        postconditions: ['test_complete'],
        author: 'test-author',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { testFlag: true },
      };

      const result = RecipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
    });

    it('should reject Recipe with empty steps array', () => {
      const invalidRecipe = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Invalid Recipe',
        version: '1.0.0',
        steps: [], // Empty steps array
      };

      const result = RecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(issue =>
            issue.message.includes('Recipe must have at least one step')
          )
        ).toBe(true);
      }
    });

    it('should validate RecipeExecutionRequest schema correctly', () => {
      const validRequest: RecipeExecutionRequest = {
        recipeId: '550e8400-e29b-41d4-a716-446655440001',
        executedBy: 'test-user',
        approvedBy: 'supervisor',
        secondApprover: 'manager',
        context: { facility: 'warehouse-1' },
        parameters: { speed: 100 },
        priority: RecipePriority.HIGH,
        safetyChecks: true,
        rollbackOnFailure: true,
        dryRun: false,
        scheduleAt: new Date(Date.now() + 3600000), // 1 hour from now
        expiresAt: new Date(Date.now() + 7200000), // 2 hours from now
        reason: 'Scheduled maintenance',
        tags: ['maintenance', 'scheduled'],
        metadata: { urgency: 'high' },
      };

      const result = RecipeExecutionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should apply default values for RecipeExecutionRequest', () => {
      const minimalRequest = {
        recipeId: '550e8400-e29b-41d4-a716-446655440001',
        executedBy: 'test-user',
      };

      const result = RecipeExecutionRequestSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.context).toEqual({});
        expect(result.data.parameters).toEqual({});
        expect(result.data.safetyChecks).toBe(true);
        expect(result.data.rollbackOnFailure).toBe(true);
        expect(result.data.dryRun).toBe(false);
        expect(result.data.tags).toEqual([]);
        expect(result.data.metadata).toEqual({});
      }
    });

    it('should validate RecipeExecution schema correctly', () => {
      const validExecution: RecipeExecution = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        recipeId: '550e8400-e29b-41d4-a716-446655440001',
        recipeName: 'Test Recipe',
        recipeVersion: '1.0.0',
        status: RecipeExecutionStatus.COMPLETED,
        executedBy: 'test-user',
        approvedBy: 'supervisor',
        startedAt: new Date(Date.now() - 300000), // 5 minutes ago
        completedAt: new Date(),
        duration: 300000, // 5 minutes
        context: { facility: 'warehouse-1' },
        parameters: { speed: 100 },
        totalSteps: 3,
        completedSteps: 3,
        failedSteps: 0,
        currentStep: '550e8400-e29b-41d4-a716-446655440002',
        result: { success: true, message: 'Recipe completed successfully' },
        stepResults: [
          {
            stepId: '550e8400-e29b-41d4-a716-446655440002',
            status: StepExecutionStatus.COMPLETED,
            startedAt: new Date(Date.now() - 250000),
            completedAt: new Date(Date.now() - 200000),
            duration: 50000,
            result: { stepOutput: 'success' },
          },
        ],
        safetyViolations: [],
        rollbackExecuted: false,
        rollbackSteps: [],
        tags: ['test'],
        metadata: { executionId: 'test-123' },
        createdAt: new Date(Date.now() - 300000),
        updatedAt: new Date(),
      };

      const result = RecipeExecutionSchema.safeParse(validExecution);
      expect(result.success).toBe(true);
    });

    it('should validate RecipeQuery schema with all parameters', () => {
      const validQuery: RecipeQuery = {
        category: 'production',
        priority: RecipePriority.HIGH,
        safetyLevel: 'critical',
        status: [RecipeExecutionStatus.COMPLETED, RecipeExecutionStatus.FAILED],
        search: 'conveyor',
        tags: ['production', 'urgent'],
        createdAfter: new Date(Date.now() - 86400000), // 24 hours ago
        createdBefore: new Date(),
        executedBy: 'operator-1',
        approvedBy: 'supervisor-1',
        page: 2,
        pageSize: 25,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const result = RecipeQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should apply default values for RecipeQuery', () => {
      const minimalQuery = {};

      const result = RecipeQuerySchema.safeParse(minimalQuery);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should validate RecipeExecutionStats schema correctly', () => {
      const validStats: RecipeExecutionStats = {
        totalRecipes: 150,
        totalExecutions: 1250,
        successfulExecutions: 1180,
        failedExecutions: 70,
        averageExecutionTime: 45000,
        executionsByStatus: {
          [RecipeExecutionStatus.COMPLETED]: 1180,
          [RecipeExecutionStatus.FAILED]: 70,
          [RecipeExecutionStatus.PENDING]: 0,
          [RecipeExecutionStatus.EXECUTING]: 0,
          [RecipeExecutionStatus.CANCELLED]: 0,
        },
        executionsByPriority: {
          [RecipePriority.LOW]: 50,
          [RecipePriority.NORMAL]: 800,
          [RecipePriority.HIGH]: 250,
          [RecipePriority.CRITICAL]: 40,
          [RecipePriority.EMERGENCY]: 10,
        },
        safetyViolations: 5,
        emergencyStops: 2,
        rollbacksExecuted: 15,
        averageStepsPerRecipe: 4.5,
        mostExecutedRecipes: [
          {
            recipeId: '550e8400-e29b-41d4-a716-446655440001',
            recipeName: 'Standard Startup Sequence',
            executionCount: 120,
          },
          {
            recipeId: '550e8400-e29b-41d4-a716-446655440002',
            recipeName: 'Safety Shutdown',
            executionCount: 85,
          },
        ],
        recentExecutions: [],
      };

      const result = RecipeExecutionStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });
  });

  describe('Enum Validations', () => {
    it('should validate RecipeExecutionStatus enum values', () => {
      const validStatuses = [
        RecipeExecutionStatus.PENDING,
        RecipeExecutionStatus.VALIDATING,
        RecipeExecutionStatus.APPROVED,
        RecipeExecutionStatus.EXECUTING,
        RecipeExecutionStatus.PAUSED,
        RecipeExecutionStatus.COMPLETED,
        RecipeExecutionStatus.FAILED,
        RecipeExecutionStatus.CANCELLED,
        RecipeExecutionStatus.ROLLING_BACK,
        RecipeExecutionStatus.ROLLED_BACK,
      ];

      validStatuses.forEach(status => {
        expect(Object.values(RecipeExecutionStatus)).toContain(status);
      });
    });

    it('should validate StepExecutionStatus enum values', () => {
      const validStatuses = [
        StepExecutionStatus.PENDING,
        StepExecutionStatus.EXECUTING,
        StepExecutionStatus.COMPLETED,
        StepExecutionStatus.FAILED,
        StepExecutionStatus.SKIPPED,
        StepExecutionStatus.RETRYING,
      ];

      validStatuses.forEach(status => {
        expect(Object.values(StepExecutionStatus)).toContain(status);
      });
    });

    it('should validate RecipePriority enum values', () => {
      const validPriorities = [
        RecipePriority.LOW,
        RecipePriority.NORMAL,
        RecipePriority.HIGH,
        RecipePriority.CRITICAL,
        RecipePriority.EMERGENCY,
      ];

      validPriorities.forEach(priority => {
        expect(Object.values(RecipePriority)).toContain(priority);
      });
    });

    it('should validate SafetyCheckType enum values', () => {
      const validSafetyChecks = [
        SafetyCheckType.PLC_INTERLOCK,
        SafetyCheckType.EMERGENCY_STOP,
        SafetyCheckType.ZONE_CLEAR,
        SafetyCheckType.EQUIPMENT_READY,
        SafetyCheckType.RESOURCE_AVAILABLE,
        SafetyCheckType.POLICY_COMPLIANCE,
      ];

      validSafetyChecks.forEach(check => {
        expect(Object.values(SafetyCheckType)).toContain(check);
      });
    });

    it('should validate RecipeStepType enum values', () => {
      const validStepTypes = [
        RecipeStepType.COMMAND,
        RecipeStepType.WAIT,
        RecipeStepType.CONDITION,
        RecipeStepType.PARALLEL,
        RecipeStepType.SAFETY_CHECK,
        RecipeStepType.ROLLBACK,
      ];

      validStepTypes.forEach(type => {
        expect(Object.values(RecipeStepType)).toContain(type);
      });
    });
  });

  describe('Type Interface Validation', () => {
    it('should validate RecipeValidationResult interface structure', () => {
      const validationResult: RecipeValidationResult = {
        isValid: true,
        errors: [
          {
            field: 'steps',
            message: 'Duplicate step order found',
            severity: 'error',
          },
          {
            field: 'safetyLevel',
            message: 'Consider higher safety level',
            severity: 'warning',
          },
        ],
        warnings: [
          {
            field: 'requiresApproval',
            message: 'High safety recipes should require approval',
          },
        ],
        safetyChecks: [
          {
            type: SafetyCheckType.PLC_INTERLOCK,
            status: 'passed',
            message: 'PLC interlock validation successful',
          },
          {
            type: SafetyCheckType.EMERGENCY_STOP,
            status: 'warning',
            message: 'Emergency stop system has minor issues',
          },
        ],
      };

      // Test that the structure is correct
      expect(validationResult.isValid).toBeDefined();
      expect(Array.isArray(validationResult.errors)).toBe(true);
      expect(Array.isArray(validationResult.warnings)).toBe(true);
      expect(Array.isArray(validationResult.safetyChecks)).toBe(true);

      // Test error structure
      expect(validationResult.errors[0].field).toBeDefined();
      expect(validationResult.errors[0].message).toBeDefined();
      expect(validationResult.errors[0].severity).toBeDefined();

      // Test safety check structure
      expect(validationResult.safetyChecks[0].type).toBeDefined();
      expect(validationResult.safetyChecks[0].status).toBeDefined();
      expect(validationResult.safetyChecks[0].message).toBeDefined();
    });

    it('should validate RecipeExecutionProgress interface structure', () => {
      const progress: RecipeExecutionProgress = {
        executionId: '550e8400-e29b-41d4-a716-446655440003',
        status: RecipeExecutionStatus.EXECUTING,
        currentStep: '550e8400-e29b-41d4-a716-446655440002',
        completedSteps: 2,
        totalSteps: 5,
        progressPercentage: 40,
        estimatedTimeRemaining: 180000, // 3 minutes
        lastUpdated: new Date(),
      };

      // Test structure
      expect(progress.executionId).toBeDefined();
      expect(progress.status).toBeDefined();
      expect(typeof progress.completedSteps).toBe('number');
      expect(typeof progress.totalSteps).toBe('number');
      expect(typeof progress.progressPercentage).toBe('number');
      expect(progress.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle recipe with parallel steps correctly', () => {
      const parallelStep: RecipeStep = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Parallel Execution Step',
        type: RecipeStepType.PARALLEL,
        order: 1,
        parallelSteps: [
          '550e8400-e29b-41d4-a716-446655440005',
          '550e8400-e29b-41d4-a716-446655440006',
        ],
        safetyChecks: [SafetyCheckType.ZONE_CLEAR],
        requiredResources: [],
        tags: ['parallel', 'optimization'],
        metadata: {},
        retryCount: 0,
        retryDelay: 1000,
        skipOnFailure: false,
      };

      const result = RecipeStepSchema.safeParse(parallelStep);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.parallelSteps).toHaveLength(2);
        expect(result.data.type).toBe(RecipeStepType.PARALLEL);
      }
    });

    it('should validate safety-critical recipe configuration', () => {
      const criticalRecipe: Partial<Recipe> = {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Critical Safety Recipe',
        version: '1.0.0',
        safetyLevel: 'critical',
        requiresApproval: true,
        requiresDualApproval: true,
        emergencyStopEnabled: true,
        rollbackOnFailure: true,
        steps: [
          {
            id: '550e8400-e29b-41d4-a716-446655440008',
            name: 'Safety Check',
            type: RecipeStepType.SAFETY_CHECK,
            order: 0,
            safetyChecks: [
              SafetyCheckType.PLC_INTERLOCK,
              SafetyCheckType.EMERGENCY_STOP,
              SafetyCheckType.ZONE_CLEAR,
              SafetyCheckType.EQUIPMENT_READY,
            ],
            requiredResources: ['safety-system'],
            tags: ['safety', 'critical'],
            metadata: { criticalPath: true },
            retryCount: 0,
            retryDelay: 1000,
            skipOnFailure: false,
          },
        ],
      };

      const result = RecipeSchema.safeParse(criticalRecipe);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.safetyLevel).toBe('critical');
        expect(result.data.requiresApproval).toBe(true);
        expect(result.data.requiresDualApproval).toBe(true);
        expect(result.data.steps[0].safetyChecks).toHaveLength(4);
      }
    });

    it('should validate execution with safety violations', () => {
      const executionWithViolations: Partial<RecipeExecution> = {
        id: '550e8400-e29b-41d4-a716-446655440009',
        recipeId: '550e8400-e29b-41d4-a716-446655440001',
        recipeName: 'Test Recipe',
        recipeVersion: '1.0.0',
        status: RecipeExecutionStatus.FAILED,
        executedBy: 'test-user',
        totalSteps: 3,
        completedSteps: 1,
        failedSteps: 2,
        safetyViolations: [
          {
            type: 'plc_interlock',
            message: 'PLC safety interlock triggered during execution',
            severity: 'critical',
            timestamp: new Date(),
          },
          {
            type: 'zone_not_clear',
            message: 'Personnel detected in safety zone',
            severity: 'high',
            timestamp: new Date(),
          },
        ],
        rollbackExecuted: true,
        rollbackSteps: ['step-1', 'step-0'],
      };

      const result = RecipeExecutionSchema.safeParse(executionWithViolations);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.safetyViolations).toHaveLength(2);
        expect(result.data.rollbackExecuted).toBe(true);
        expect(result.data.rollbackSteps).toHaveLength(2);
        expect(result.data.safetyViolations[0].severity).toBe('critical');
      }
    });
  });
});
