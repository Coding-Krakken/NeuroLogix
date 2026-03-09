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
  RecipeSchema,
  RecipeExecutionRequestSchema,
  RecipeExecutionSchema,
  RecipeQuerySchema,
  RecipeExecutionStatsSchema,
} from '../types/index';
import {
  ValidationError,
  AssetNotFoundError,
  InternalServerError,
  generateId,
  logAuditEvent,
} from '@neurologix/core';
import logger from '@neurologix/core/logger';

/**
 * Enterprise-grade Recipe Executor Service
 *
 * Provides comprehensive recipe management and execution capabilities including:
 * - Recipe lifecycle management (CRUD operations)
 * - Safety-first execution with comprehensive prechecks
 * - Rollback capabilities with automatic failure recovery
 * - 2-person approval system for safety-critical recipes
 * - Real-time execution monitoring and progress tracking
 * - Emergency stop integration
 * - Advanced query system with filtering and analytics
 */
export class RecipeExecutorService {
  private recipes = new Map<string, Recipe>();
  private executions = new Map<string, RecipeExecution>();
  private executionQueue: RecipeExecutionRequest[] = [];
  private activeExecutions = new Map<string, Promise<void>>();

  /**
   * Create a new recipe
   */
  async createRecipe(recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    try {
      const recipe: Recipe = {
        ...recipeData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Validate recipe
      const validation = await this.validateRecipe(recipe);
      if (!validation.isValid) {
        throw new ValidationError('Recipe validation failed', {
          errors: validation.errors.map(e => e.message),
        });
      }

      RecipeSchema.parse(recipe);
      this.recipes.set(recipe.id, recipe);

      await logAuditEvent({
        action: 'recipe_create',
        resource: `recipe/${recipe.id}`,
        outcome: 'success',
        details: { recipeName: recipe.name, version: recipe.version },
        severity: 'medium',
      });

      logger.info('Recipe created successfully', {
        recipeId: recipe.id,
        name: recipe.name,
        version: recipe.version,
      });

      return recipe;
    } catch (error) {
      await logAuditEvent({
        action: 'recipe_create',
        resource: 'recipe/unknown',
        outcome: 'failure',
        details: { error: error instanceof Error ? error.message : String(error) },
        severity: 'high',
      });
      throw error;
    }
  }

  /**
   * Get recipe by ID
   */
  async getRecipe(id: string): Promise<Recipe> {
    const recipe = this.recipes.get(id);
    if (!recipe) {
      throw new AssetNotFoundError('Recipe', { assetType: 'Recipe', requestedId: id });
    }
    return recipe;
  }

  /**
   * Update an existing recipe
   */
  async updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    const existingRecipe = await this.getRecipe(id);

    const updatedRecipe: Recipe = {
      ...existingRecipe,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date(),
    };

    // Validate updated recipe
    const validation = await this.validateRecipe(updatedRecipe);
    if (!validation.isValid) {
      throw new ValidationError('Recipe validation failed', {
        errors: validation.errors.map(e => e.message),
      });
    }

    RecipeSchema.parse(updatedRecipe);
    this.recipes.set(id, updatedRecipe);

    await logAuditEvent({
      action: 'recipe_update',
      resource: `recipe/${id}`,
      outcome: 'success',
      details: { recipeName: updatedRecipe.name, version: updatedRecipe.version },
      severity: 'medium',
    });

    return updatedRecipe;
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    const recipe = await this.getRecipe(id);

    // Check if recipe has active executions
    const activeExecutions = Array.from(this.executions.values()).filter(
      exec =>
        exec.recipeId === id &&
        [
          RecipeExecutionStatus.EXECUTING,
          RecipeExecutionStatus.PENDING,
          RecipeExecutionStatus.APPROVED,
        ].includes(exec.status)
    );

    if (activeExecutions.length > 0) {
      throw new ValidationError('Cannot delete recipe with active executions', {
        errors: [`Recipe has ${activeExecutions.length} active executions`],
      });
    }

    this.recipes.delete(id);

    await logAuditEvent({
      action: 'recipe_delete',
      resource: `recipe/${id}`,
      outcome: 'success',
      details: { recipeName: recipe.name, version: recipe.version },
      severity: 'high',
    });
  }

  /**
   * Execute a recipe with comprehensive safety checks and monitoring
   */
  async executeRecipe(request: RecipeExecutionRequest): Promise<RecipeExecution> {
    try {
      // Validate request
      RecipeExecutionRequestSchema.parse(request);

      const recipe = await this.getRecipe(request.recipeId);

      // Create execution record
      const execution: RecipeExecution = {
        id: generateId(),
        recipeId: recipe.id,
        recipeName: recipe.name,
        recipeVersion: recipe.version,
        status: RecipeExecutionStatus.PENDING,
        executedBy: request.executedBy,
        approvedBy: request.approvedBy,
        secondApprover: request.secondApprover,
        context: request.context,
        parameters: request.parameters,
        totalSteps: recipe.steps.length,
        completedSteps: 0,
        failedSteps: 0,
        stepResults: [],
        safetyViolations: [],
        rollbackExecuted: false,
        rollbackSteps: [],
        tags: request.tags,
        metadata: request.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      RecipeExecutionSchema.parse(execution);
      this.executions.set(execution.id, execution);

      // Check approval requirements
      if (recipe.requiresApproval && !request.approvedBy) {
        throw new ValidationError('Recipe requires approval', { errors: ['Approver is required'] });
      }

      if (recipe.requiresDualApproval && (!request.approvedBy || !request.secondApprover)) {
        throw new ValidationError('Recipe requires dual approval', {
          errors: ['Two approvers are required'],
        });
      }

      // Perform safety checks if enabled
      if (request.safetyChecks) {
        const safetyResult = await this.performSafetyChecks(recipe, request);
        if (!safetyResult.passed) {
          execution.status = RecipeExecutionStatus.FAILED;
          execution.error = 'Safety checks failed';
          execution.safetyViolations = safetyResult.violations;
          this.executions.set(execution.id, execution);

          throw new ValidationError('Safety checks failed', {
            errors: safetyResult.violations.map(v => v.message),
          });
        }
      }

      // Start execution (async)
      if (!request.dryRun) {
        const executionPromise = this.startExecution(execution, recipe, request);
        this.activeExecutions.set(execution.id, executionPromise);
      } else {
        execution.status = RecipeExecutionStatus.COMPLETED;
        execution.completedAt = new Date();
        execution.result = { dryRun: true, message: 'Dry run completed successfully' };
        this.executions.set(execution.id, execution);
      }

      await logAuditEvent({
        action: 'recipe_execute',
        resource: `execution/${execution.id}`,
        outcome: 'success',
        details: {
          recipeId: recipe.id,
          recipeName: recipe.name,
          executedBy: request.executedBy,
          dryRun: request.dryRun,
        },
        severity: 'high',
      });

      return execution;
    } catch (error) {
      await logAuditEvent({
        action: 'recipe_execute',
        resource: `recipe/${request.recipeId}`,
        outcome: 'failure',
        details: { error: error instanceof Error ? error.message : String(error) },
        severity: 'high',
      });
      throw error;
    }
  }

  /**
   * Get execution by ID
   */
  async getExecution(id: string): Promise<RecipeExecution> {
    const execution = this.executions.get(id);
    if (!execution) {
      throw new AssetNotFoundError(id, { assetType: 'Recipe Execution' });
    }
    return execution;
  }

  /**
   * Cancel a recipe execution
   */
  async cancelExecution(id: string, reason?: string): Promise<void> {
    const execution = await this.getExecution(id);

    if (
      ![
        RecipeExecutionStatus.PENDING,
        RecipeExecutionStatus.EXECUTING,
        RecipeExecutionStatus.PAUSED,
      ].includes(execution.status)
    ) {
      throw new ValidationError('Cannot cancel execution', {
        errors: ['Execution is not in a cancellable state'],
      });
    }

    execution.status = RecipeExecutionStatus.CANCELLED;
    execution.completedAt = new Date();
    execution.error = reason || 'Execution cancelled by user';
    execution.updatedAt = new Date();

    this.executions.set(id, execution);

    // Remove from active executions
    this.activeExecutions.delete(id);

    await logAuditEvent({
      action: 'recipe_cancel',
      resource: `execution/${id}`,
      outcome: 'success',
      details: { reason, executionId: id },
      severity: 'medium',
    });
  }

  /**
   * Emergency stop all executions
   */
  async emergencyStop(reason: string, authorizedBy: string): Promise<void> {
    const activeExecutionIds = Array.from(this.activeExecutions.keys());

    for (const executionId of activeExecutionIds) {
      try {
        await this.cancelExecution(executionId, `Emergency stop: ${reason}`);
      } catch (error) {
        logger.error('Failed to cancel execution during emergency stop', {
          executionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await logAuditEvent({
      action: 'emergency_stop',
      resource: 'all_executions',
      outcome: 'success',
      details: {
        reason,
        authorizedBy,
        cancelledExecutions: activeExecutionIds.length,
      },
      severity: 'critical',
    });

    logger.warn('Emergency stop executed', {
      reason,
      authorizedBy,
      cancelledExecutions: activeExecutionIds.length,
    });
  }

  /**
   * Query recipes and executions with advanced filtering
   */
  async queryRecipes(query: RecipeQuery): Promise<{
    recipes: Recipe[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      RecipeQuerySchema.parse(query);

      let filteredRecipes = Array.from(this.recipes.values());

      // Apply filters
      if (query.category) {
        filteredRecipes = filteredRecipes.filter(r => r.category === query.category);
      }

      if (query.priority) {
        filteredRecipes = filteredRecipes.filter(r => r.priority === query.priority);
      }

      if (query.safetyLevel) {
        filteredRecipes = filteredRecipes.filter(r => r.safetyLevel === query.safetyLevel);
      }

      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredRecipes = filteredRecipes.filter(
          r =>
            r.name.toLowerCase().includes(searchTerm) ||
            r.description?.toLowerCase().includes(searchTerm)
        );
      }

      if (query.tags && query.tags.length > 0) {
        filteredRecipes = filteredRecipes.filter(r =>
          query.tags!.some(tag => r.tags.includes(tag))
        );
      }

      // Apply date filters
      if (query.createdAfter) {
        filteredRecipes = filteredRecipes.filter(r => r.createdAt >= query.createdAfter!);
      }

      if (query.createdBefore) {
        filteredRecipes = filteredRecipes.filter(r => r.createdAt <= query.createdBefore!);
      }

      // Sort results
      filteredRecipes.sort((a, b) => {
        let comparison = 0;

        switch (query.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'updatedAt':
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
          case 'priority':
            const priorityOrder = { low: 1, normal: 2, high: 3, critical: 4, emergency: 5 };
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
          default:
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
        }

        return query.sortOrder === 'desc' ? -comparison : comparison;
      });

      // Apply pagination
      const total = filteredRecipes.length;
      const totalPages = Math.ceil(total / query.pageSize);
      const startIndex = (query.page - 1) * query.pageSize;
      const endIndex = startIndex + query.pageSize;
      const recipes = filteredRecipes.slice(startIndex, endIndex);

      return {
        recipes,
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages,
      };
    } catch (error) {
      logger.error('Recipe query failed', {
        query,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new InternalServerError('Failed to query recipes', {
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  /**
   * Get recipe execution statistics and analytics
   */
  async getExecutionStats(): Promise<RecipeExecutionStats> {
    const executions = Array.from(this.executions.values());
    const recipes = Array.from(this.recipes.values());

    // Calculate basic statistics
    const totalRecipes = recipes.length;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(
      e => e.status === RecipeExecutionStatus.COMPLETED
    ).length;
    const failedExecutions = executions.filter(
      e => e.status === RecipeExecutionStatus.FAILED
    ).length;

    // Calculate average execution time
    const completedExecutions = executions.filter(e => e.duration !== undefined);
    const averageExecutionTime =
      completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) /
          completedExecutions.length
        : 0;

    // Execution status breakdown
    const executionsByStatus: Record<string, number> = {};
    Object.values(RecipeExecutionStatus).forEach(status => {
      executionsByStatus[status] = executions.filter(e => e.status === status).length;
    });

    // Priority breakdown
    const executionsByPriority: Record<string, number> = {};
    Object.values(RecipePriority).forEach(priority => {
      executionsByPriority[priority] = recipes.filter(r => r.priority === priority).length;
    });

    // Safety statistics
    const safetyViolations = executions.reduce((sum, e) => sum + e.safetyViolations.length, 0);
    const emergencyStops = executions.filter(e => e.error?.includes('Emergency stop')).length;
    const rollbacksExecuted = executions.filter(e => e.rollbackExecuted).length;

    // Performance metrics
    const averageStepsPerRecipe =
      recipes.length > 0 ? recipes.reduce((sum, r) => sum + r.steps.length, 0) / recipes.length : 0;

    // Most executed recipes
    const recipeExecutionCounts: Record<string, number> = {};
    executions.forEach(e => {
      recipeExecutionCounts[e.recipeId] = (recipeExecutionCounts[e.recipeId] || 0) + 1;
    });

    const mostExecutedRecipes = Object.entries(recipeExecutionCounts)
      .map(([recipeId, count]) => {
        const recipe = this.recipes.get(recipeId);
        return {
          recipeId,
          recipeName: recipe?.name || 'Unknown',
          executionCount: count,
        };
      })
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 10);

    // Recent executions
    const recentExecutions = executions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const stats: RecipeExecutionStats = {
      totalRecipes,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      executionsByStatus,
      executionsByPriority,
      safetyViolations,
      emergencyStops,
      rollbacksExecuted,
      averageStepsPerRecipe,
      mostExecutedRecipes,
      recentExecutions,
    };

    return RecipeExecutionStatsSchema.parse(stats);
  }

  /**
   * Get real-time execution progress
   */
  async getExecutionProgress(id: string): Promise<RecipeExecutionProgress> {
    const execution = await this.getExecution(id);

    const progressPercentage =
      execution.totalSteps > 0
        ? Math.round((execution.completedSteps / execution.totalSteps) * 100)
        : 0;

    // Estimate time remaining based on average step time
    let estimatedTimeRemaining: number | null = null;
    if (execution.status === RecipeExecutionStatus.EXECUTING && execution.startedAt) {
      const elapsedTime = Date.now() - execution.startedAt.getTime();
      const remainingSteps = execution.totalSteps - execution.completedSteps;

      if (execution.completedSteps > 0) {
        const averageStepTime = elapsedTime / execution.completedSteps;
        estimatedTimeRemaining = Math.round(averageStepTime * remainingSteps);
      }
    }

    return {
      executionId: execution.id,
      status: execution.status,
      currentStep: execution.currentStep || null,
      completedSteps: execution.completedSteps,
      totalSteps: execution.totalSteps,
      progressPercentage,
      estimatedTimeRemaining,
      lastUpdated: execution.updatedAt,
    };
  }

  /**
   * Validate recipe for safety and correctness
   */
  private async validateRecipe(recipe: Recipe): Promise<RecipeValidationResult> {
    const errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];
    const warnings: Array<{ field: string; message: string }> = [];
    const safetyChecks: Array<{
      type: SafetyCheckType;
      status: 'passed' | 'failed' | 'warning';
      message: string;
    }> = [];

    // Validate steps
    if (recipe.steps.length === 0) {
      errors.push({
        field: 'steps',
        message: 'Recipe must have at least one step',
        severity: 'error',
      });
    }

    // Check for duplicate step orders
    const stepOrders = recipe.steps.map(s => s.order);
    const duplicateOrders = stepOrders.filter(
      (order, index) => stepOrders.indexOf(order) !== index
    );
    if (duplicateOrders.length > 0) {
      errors.push({ field: 'steps', message: 'Duplicate step orders found', severity: 'error' });
    }

    // Validate safety requirements for high/critical safety levels
    if (recipe.safetyLevel === 'critical' || recipe.safetyLevel === 'high') {
      if (!recipe.requiresApproval) {
        warnings.push({
          field: 'requiresApproval',
          message: 'High/critical safety recipes should require approval',
        });
      }

      if (recipe.safetyLevel === 'critical' && !recipe.requiresDualApproval) {
        warnings.push({
          field: 'requiresDualApproval',
          message: 'Critical safety recipes should require dual approval',
        });
      }
    }

    // Mock safety checks (in real implementation, these would check actual system state)
    safetyChecks.push({
      type: SafetyCheckType.PLC_INTERLOCK,
      status: 'passed',
      message: 'PLC interlock validation passed',
    });

    safetyChecks.push({
      type: SafetyCheckType.POLICY_COMPLIANCE,
      status: 'passed',
      message: 'Policy compliance check passed',
    });

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      safetyChecks,
    };
  }

  /**
   * Perform comprehensive safety checks before execution
   */
  private async performSafetyChecks(
    recipe: Recipe,
    request: RecipeExecutionRequest
  ): Promise<{
    passed: boolean;
    violations: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timestamp: Date;
    }>;
  }> {
    const violations: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timestamp: Date;
    }> = [];

    // Mock safety checks (in real implementation, these would check actual system state)

    // Check PLC interlocks
    const plcInterlockActive = false; // Mock check
    if (plcInterlockActive) {
      violations.push({
        type: 'plc_interlock',
        message: 'PLC safety interlock is active',
        severity: 'critical',
        timestamp: new Date(),
      });
    }

    // Check emergency stop status
    const emergencyStopActive = false; // Mock check
    if (emergencyStopActive) {
      violations.push({
        type: 'emergency_stop',
        message: 'Emergency stop is active',
        severity: 'critical',
        timestamp: new Date(),
      });
    }

    // Check resource availability
    for (const resource of recipe.requiredResources) {
      const resourceAvailable = true; // Mock check
      if (!resourceAvailable) {
        violations.push({
          type: 'resource_unavailable',
          message: `Required resource ${resource} is not available`,
          severity: 'high',
          timestamp: new Date(),
        });
      }
    }

    return {
      passed: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
    };
  }

  /**
   * Start recipe execution (internal method)
   */
  private async startExecution(
    execution: RecipeExecution,
    recipe: Recipe,
    request: RecipeExecutionRequest
  ): Promise<void> {
    try {
      execution.status = RecipeExecutionStatus.EXECUTING;
      execution.startedAt = new Date();
      execution.updatedAt = new Date();
      this.executions.set(execution.id, execution);

      logger.info('Starting recipe execution', {
        executionId: execution.id,
        recipeId: recipe.id,
        recipeName: recipe.name,
      });

      // Execute steps sequentially (simplified implementation)
      for (const step of recipe.steps.sort((a, b) => a.order - b.order)) {
        // Check if execution was cancelled
        const currentExecution = this.executions.get(execution.id);
        if (currentExecution && currentExecution.status === RecipeExecutionStatus.CANCELLED) {
          break;
        }

        execution.currentStep = step.id;
        execution.updatedAt = new Date();
        this.executions.set(execution.id, execution);

        try {
          // Mock step execution
          await this.executeStep(step, execution, request);

          execution.completedSteps++;
          execution.stepResults.push({
            stepId: step.id,
            status: StepExecutionStatus.COMPLETED,
            startedAt: new Date(),
            completedAt: new Date(),
            duration: 1000, // Mock duration
            result: { success: true },
          });
        } catch (stepError) {
          execution.failedSteps++;
          execution.stepResults.push({
            stepId: step.id,
            status: StepExecutionStatus.FAILED,
            startedAt: new Date(),
            completedAt: new Date(),
            duration: 500,
            error: stepError instanceof Error ? stepError.message : String(stepError),
          });

          if (!step.skipOnFailure) {
            if (request.rollbackOnFailure) {
              await this.executeRollback(execution, recipe);
            }
            throw stepError;
          }
        }
      }

      // Complete execution
      execution.status = RecipeExecutionStatus.COMPLETED;
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - (execution.startedAt?.getTime() || 0);
      execution.result = { message: 'Recipe executed successfully' };
      execution.updatedAt = new Date();
      this.executions.set(execution.id, execution);

      logger.info('Recipe execution completed successfully', {
        executionId: execution.id,
        duration: execution.duration,
      });
    } catch (error) {
      execution.status = RecipeExecutionStatus.FAILED;
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : String(error);
      execution.updatedAt = new Date();
      this.executions.set(execution.id, execution);

      logger.error('Recipe execution failed', {
        executionId: execution.id,
        error: execution.error,
      });
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }

  /**
   * Execute a single recipe step (mock implementation)
   */
  private async executeStep(
    step: RecipeStep,
    execution: RecipeExecution,
    request: RecipeExecutionRequest
  ): Promise<void> {
    // Mock step execution with delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures for testing
        if (Math.random() < 0.1) {
          reject(new Error(`Step ${step.name} failed`));
        } else {
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Execute rollback steps
   */
  private async executeRollback(execution: RecipeExecution, recipe: Recipe): Promise<void> {
    logger.info('Starting recipe rollback', { executionId: execution.id });

    execution.status = RecipeExecutionStatus.ROLLING_BACK;
    execution.rollbackExecuted = true;
    execution.updatedAt = new Date();
    this.executions.set(execution.id, execution);

    // Execute rollback steps in reverse order
    const completedSteps = execution.stepResults
      .filter(sr => sr.status === StepExecutionStatus.COMPLETED)
      .map(sr => sr.stepId);

    const rollbackSteps = recipe.steps
      .filter(step => completedSteps.includes(step.id) && step.rollbackCommand)
      .sort((a, b) => b.order - a.order); // Reverse order

    for (const step of rollbackSteps) {
      execution.rollbackSteps.push(step.id);
      // Mock rollback execution
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    execution.status = RecipeExecutionStatus.ROLLED_BACK;
    execution.updatedAt = new Date();
    this.executions.set(execution.id, execution);

    logger.info('Recipe rollback completed', {
      executionId: execution.id,
      rollbackSteps: execution.rollbackSteps.length,
    });
  }
}
