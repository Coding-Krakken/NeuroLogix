import { describe, expect, it } from 'vitest';
import {
  TwinAssetSchema,
  TwinStateSchema,
  SimulationConfigSchema,
  SimulationRunSchema,
  TwinValidationResultSchema,
  TwinQuerySchema,
  TwinStatisticsSchema,
} from './index.js';

describe('digital twin types', () => {
  it('validates a twin asset', () => {
    const result = TwinAssetSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid twin asset status', () => {
    const result = TwinAssetSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'unknown',
      zone: 'line-a',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(result.success).toBe(false);
  });

  it('validates a twin state', () => {
    const result = TwinStateSchema.safeParse({
      twinId: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: new Date(),
      source: 'telemetry',
      properties: { speed: 120 },
      confidence: 0.99,
      version: 1,
    });

    expect(result.success).toBe(true);
  });

  it('validates simulation config defaults', () => {
    const result = SimulationConfigSchema.parse({});

    expect(result.timeScale).toBe(1);
    expect(result.maxSteps).toBe(100);
    expect(result.stepIntervalMs).toBe(1000);
  });

  it('validates simulation run', () => {
    const result = SimulationRunSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      twinId: '550e8400-e29b-41d4-a716-446655440001',
      status: 'completed',
      config: {
        timeScale: 1,
        stepIntervalMs: 1000,
        maxSteps: 5,
        includeStochastic: false,
      },
      currentStep: 5,
      totalSteps: 5,
      outputStates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(result.success).toBe(true);
  });

  it('validates twin validation result', () => {
    const result = TwinValidationResultSchema.safeParse({
      twinId: '550e8400-e29b-41d4-a716-446655440000',
      isValid: true,
      issues: [],
      checkedAt: new Date(),
    });

    expect(result.success).toBe(true);
  });

  it('validates twin query defaults', () => {
    const result = TwinQuerySchema.parse({});

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe('asc');
  });

  it('validates twin statistics', () => {
    const result = TwinStatisticsSchema.safeParse({
      totalTwins: 2,
      twinsByType: { conveyor: 1, sensor: 1 },
      twinsByStatus: { online: 2 },
      twinsWithState: 1,
      activeSimulations: 0,
      totalSimulations: 2,
      generatedAt: new Date(),
    });

    expect(result.success).toBe(true);
  });
});
