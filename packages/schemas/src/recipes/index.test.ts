/**
 * Tests for canonical recipe schemas
 */
import { describe, it, expect } from 'vitest';
import {
  RECIPE_EXECUTION_STATUS,
  STEP_EXECUTION_STATUS,
  RECIPE_PRIORITY,
  RECIPE_STEP_TYPE,
  SAFETY_CHECK_TYPE,
  RECIPE_SAFETY_LEVEL,
  RecipeExecutionStatusSchema,
  RecipePrioritySchema,
  RecipeStepTypeSchema,
  SafetyCheckTypeSchema,
  RecipeStepSchema,
  RecipeSchema,
  RecipeExecutionRequestSchema,
  RecipeExecutionSchema,
  RecipeValidationResultSchema,
} from './index.js';

describe('RECIPE_EXECUTION_STATUS', () => {
  it('defines all 10 status constants', () => {
    expect(RECIPE_EXECUTION_STATUS.PENDING).toBe('pending');
    expect(RECIPE_EXECUTION_STATUS.VALIDATING).toBe('validating');
    expect(RECIPE_EXECUTION_STATUS.APPROVED).toBe('approved');
    expect(RECIPE_EXECUTION_STATUS.EXECUTING).toBe('executing');
    expect(RECIPE_EXECUTION_STATUS.PAUSED).toBe('paused');
    expect(RECIPE_EXECUTION_STATUS.COMPLETED).toBe('completed');
    expect(RECIPE_EXECUTION_STATUS.FAILED).toBe('failed');
    expect(RECIPE_EXECUTION_STATUS.CANCELLED).toBe('cancelled');
    expect(RECIPE_EXECUTION_STATUS.ROLLING_BACK).toBe('rolling_back');
    expect(RECIPE_EXECUTION_STATUS.ROLLED_BACK).toBe('rolled_back');
  });
});

describe('STEP_EXECUTION_STATUS', () => {
  it('defines all step status constants', () => {
    expect(STEP_EXECUTION_STATUS.PENDING).toBe('pending');
    expect(STEP_EXECUTION_STATUS.EXECUTING).toBe('executing');
    expect(STEP_EXECUTION_STATUS.COMPLETED).toBe('completed');
    expect(STEP_EXECUTION_STATUS.FAILED).toBe('failed');
    expect(STEP_EXECUTION_STATUS.SKIPPED).toBe('skipped');
    expect(STEP_EXECUTION_STATUS.RETRYING).toBe('retrying');
  });
});

describe('RECIPE_PRIORITY', () => {
  it('defines all priority levels', () => {
    expect(RECIPE_PRIORITY.LOW).toBe('low');
    expect(RECIPE_PRIORITY.NORMAL).toBe('normal');
    expect(RECIPE_PRIORITY.HIGH).toBe('high');
    expect(RECIPE_PRIORITY.CRITICAL).toBe('critical');
    expect(RECIPE_PRIORITY.EMERGENCY).toBe('emergency');
  });
});

describe('SAFETY_CHECK_TYPE', () => {
  it('defines all safety check types', () => {
    expect(SAFETY_CHECK_TYPE.PLC_INTERLOCK).toBe('plc_interlock');
    expect(SAFETY_CHECK_TYPE.EMERGENCY_STOP).toBe('emergency_stop');
    expect(SAFETY_CHECK_TYPE.ZONE_CLEAR).toBe('zone_clear');
    expect(SAFETY_CHECK_TYPE.EQUIPMENT_READY).toBe('equipment_ready');
    expect(SAFETY_CHECK_TYPE.RESOURCE_AVAILABLE).toBe('resource_available');
    expect(SAFETY_CHECK_TYPE.POLICY_COMPLIANCE).toBe('policy_compliance');
  });
});

describe('RecipeExecutionStatusSchema', () => {
  it('accepts all valid statuses', () => {
    for (const status of Object.values(RECIPE_EXECUTION_STATUS)) {
      expect(RecipeExecutionStatusSchema.parse(status)).toBe(status);
    }
  });

  it('rejects invalid status', () => {
    expect(() => RecipeExecutionStatusSchema.parse('running')).toThrow();
  });
});

describe('RecipePrioritySchema', () => {
  it('accepts all valid priorities', () => {
    for (const p of Object.values(RECIPE_PRIORITY)) {
      expect(RecipePrioritySchema.parse(p)).toBe(p);
    }
  });
});

describe('RecipeStepTypeSchema', () => {
  it('accepts all valid step types', () => {
    for (const t of Object.values(RECIPE_STEP_TYPE)) {
      expect(RecipeStepTypeSchema.parse(t)).toBe(t);
    }
  });
});

describe('SafetyCheckTypeSchema', () => {
  it('accepts all valid safety check types', () => {
    for (const t of Object.values(SAFETY_CHECK_TYPE)) {
      expect(SafetyCheckTypeSchema.parse(t)).toBe(t);
    }
  });
});

const validStep = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Activate conveyor A',
  type: RECIPE_STEP_TYPE.COMMAND,
  order: 0,
  command: 'conveyor.start',
};

describe('RecipeStepSchema', () => {
  it('accepts a minimal valid step', () => {
    const result = RecipeStepSchema.parse(validStep);
    expect(result.name).toBe('Activate conveyor A');
    expect(result.type).toBe('command');
    expect(result.retryCount).toBe(0);
    expect(result.skipOnFailure).toBe(false);
    expect(result.safetyChecks).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  it('accepts safety checks', () => {
    const stepWithSafety = {
      ...validStep,
      safetyChecks: [SAFETY_CHECK_TYPE.PLC_INTERLOCK, SAFETY_CHECK_TYPE.ZONE_CLEAR],
    };
    const result = RecipeStepSchema.parse(stepWithSafety);
    expect(result.safetyChecks).toHaveLength(2);
    expect(result.safetyChecks[0]).toBe('plc_interlock');
  });

  it('rejects steps without required fields', () => {
    expect(() => RecipeStepSchema.parse({ name: 'test' })).toThrow();
  });

  it('enforces retryCount limit', () => {
    expect(() => RecipeStepSchema.parse({ ...validStep, retryCount: 11 })).toThrow();
  });
});

const validRecipe = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  name: 'Warehouse Pick Sequence',
  version: '1.0.0',
  steps: [validStep],
};

describe('RecipeSchema', () => {
  it('accepts a minimal valid recipe', () => {
    const result = RecipeSchema.parse(validRecipe);
    expect(result.name).toBe('Warehouse Pick Sequence');
    expect(result.steps).toHaveLength(1);
    expect(result.priority).toBe('normal');
    expect(result.safetyLevel).toBe('medium');
    expect(result.rollbackOnFailure).toBe(true);
    expect(result.emergencyStopEnabled).toBe(true);
  });

  it('applies safety defaults', () => {
    const result = RecipeSchema.parse(validRecipe);
    expect(result.requiresApproval).toBe(false);
    expect(result.allowParallelExecution).toBe(true);
  });

  it('accepts a full recipe with all fields', () => {
    const full = {
      ...validRecipe,
      priority: RECIPE_PRIORITY.CRITICAL,
      safetyLevel: RECIPE_SAFETY_LEVEL.HIGH,
      requiresApproval: true,
      rollbackOnFailure: false,
      tags: ['warehouse', 'priority'],
      preconditions: ['zone.A.clear'],
      postconditions: ['zone.A.idle'],
    };
    const result = RecipeSchema.parse(full);
    expect(result.priority).toBe('critical');
    expect(result.safetyLevel).toBe('high');
    expect(result.requiresApproval).toBe(true);
  });

  it('rejects recipes with no steps', () => {
    expect(() => RecipeSchema.parse({ ...validRecipe, steps: [] })).toThrow();
  });
});

describe('RecipeExecutionRequestSchema', () => {
  it('accepts a minimal execution request', () => {
    const req = {
      recipeId: validRecipe.id,
      executedBy: 'operator-01',
    };
    const result = RecipeExecutionRequestSchema.parse(req);
    expect(result.recipeId).toBe(validRecipe.id);
    expect(result.safetyChecks).toBe(true);
    expect(result.rollbackOnFailure).toBe(true);
    expect(result.dryRun).toBe(false);
  });

  it('accepts a dry-run request', () => {
    const req = {
      recipeId: validRecipe.id,
      executedBy: 'operator-01',
      dryRun: true,
      reason: 'pre-flight test',
    };
    const result = RecipeExecutionRequestSchema.parse(req);
    expect(result.dryRun).toBe(true);
  });
});

describe('RecipeExecutionSchema', () => {
  const now = new Date().toISOString();
  const validExecution = {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    recipeId: validRecipe.id,
    recipeName: validRecipe.name,
    recipeVersion: validRecipe.version,
    status: RECIPE_EXECUTION_STATUS.EXECUTING,
    executedBy: 'operator-01',
    totalSteps: 1,
    completedSteps: 0,
    failedSteps: 0,
    createdAt: now,
    updatedAt: now,
  };

  it('accepts a valid execution record', () => {
    const result = RecipeExecutionSchema.parse(validExecution);
    expect(result.status).toBe('executing');
    expect(result.rollbackExecuted).toBe(false);
    expect(result.safetyViolations).toEqual([]);
    expect(result.stepResults).toEqual([]);
  });

  it('records safety violations', () => {
    const withViolation = {
      ...validExecution,
      safetyViolations: [{
        type: SAFETY_CHECK_TYPE.PLC_INTERLOCK,
        message: 'PLC interlock triggered',
        severity: RECIPE_SAFETY_LEVEL.CRITICAL,
        timestamp: now,
      }],
    };
    const result = RecipeExecutionSchema.parse(withViolation);
    expect(result.safetyViolations).toHaveLength(1);
    expect(result.safetyViolations[0]!.type).toBe('plc_interlock');
  });
});

describe('RecipeValidationResultSchema', () => {
  it('accepts a valid validation result', () => {
    const result = RecipeValidationResultSchema.parse({
      isValid: true,
      errors: [],
      warnings: [],
      safetyChecks: [
        { type: SAFETY_CHECK_TYPE.ZONE_CLEAR, status: 'passed', message: 'Zone clear' },
      ],
    });
    expect(result.isValid).toBe(true);
    expect(result.safetyChecks[0]!.status).toBe('passed');
  });

  it('represents a failed validation', () => {
    const result = RecipeValidationResultSchema.parse({
      isValid: false,
      errors: [{ field: 'steps[0].command', message: 'Command not found', severity: 'error' }],
      warnings: [],
      safetyChecks: [],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]!.severity).toBe('error');
  });
});
