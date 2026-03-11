import { beforeEach, describe, expect, it } from 'vitest';
import {
  SimulationRunSchema,
  TwinAsset,
  TwinAssetSchema,
  TwinQuerySchema,
  TwinStateSchema,
  TwinStatisticsSchema,
  TwinValidationResultSchema,
} from '../types/index.js';
import { DigitalTwinService } from '../services/digital-twin.service.js';

const buildTwinInput = (
  overrides: Partial<Omit<TwinAsset, 'id' | 'createdAt' | 'updatedAt'>> = {}
): Omit<TwinAsset, 'id' | 'createdAt' | 'updatedAt'> => ({
  assetId: 'asset-contract-a',
  name: 'Contract Conveyor Twin',
  assetType: 'conveyor',
  status: 'online',
  zone: 'line-a',
  metadata: {
    suite: 'digital-twin-contracts',
  },
  ...overrides,
});

describe('Digital Twin Service Contract Baseline', () => {
  let service: DigitalTwinService;

  beforeEach(() => {
    service = new DigitalTwinService();
  });

  it('enforces create twin response contract shape', async () => {
    const created = await service.createTwin(buildTwinInput());
    const parsed = TwinAssetSchema.parse(created);

    expect(parsed.assetId).toBe('asset-contract-a');
    expect(parsed.assetType).toBe('conveyor');
    expect(parsed.zone).toBe('line-a');
  });

  it('enforces twin query response contract shape with pagination metadata', async () => {
    await service.createTwin(buildTwinInput());
    await service.createTwin(
      buildTwinInput({
        assetId: 'asset-contract-b',
        name: 'Contract Sensor Twin',
        assetType: 'sensor',
        status: 'offline',
        zone: 'line-b',
      })
    );

    const query = TwinQuerySchema.parse({
      assetType: 'sensor',
      page: 1,
      pageSize: 5,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    const response = await service.queryTwins(query);
    response.twins.forEach(twin => TwinAssetSchema.parse(twin));

    expect(response.page).toBe(query.page);
    expect(response.pageSize).toBe(query.pageSize);
    expect(response.total).toBe(1);
    expect(response.totalPages).toBe(1);
    expect(response.twins[0]?.assetType).toBe('sensor');
  });

  it('enforces state ingestion and latest state response contract shape', async () => {
    const twin = await service.createTwin(buildTwinInput());

    const ingested = await service.ingestState(twin.id, {
      source: 'telemetry',
      properties: {
        speed: 120,
        load: 0.82,
      },
      confidence: 0.99,
      timestamp: new Date('2026-03-11T10:00:00.000Z'),
    });

    const latest = await service.getLatestState(twin.id);
    const parsedIngested = TwinStateSchema.parse(ingested);
    const parsedLatest = TwinStateSchema.parse(latest);

    expect(parsedIngested.twinId).toBe(twin.id);
    expect(parsedIngested.version).toBe(1);
    expect(parsedLatest.properties).toEqual({ speed: 120, load: 0.82 });
  });

  it('enforces validation response contract shape', async () => {
    const twin = await service.createTwin(buildTwinInput());

    const validation = await service.validateTwin(twin.id);
    const parsed = TwinValidationResultSchema.parse(validation);

    expect(parsed.twinId).toBe(twin.id);
    expect(parsed.isValid).toBe(true);
    expect(parsed.issues.some(issue => issue.code === 'NO_STATE')).toBe(true);
  });

  it('enforces simulation response contract shape', async () => {
    const twin = await service.createTwin(buildTwinInput());
    await service.ingestState(twin.id, {
      source: 'telemetry',
      properties: {
        speed: 100,
        enabled: true,
      },
      confidence: 1,
      timestamp: new Date('2026-03-11T10:05:00.000Z'),
    });

    const simulation = await service.runSimulation(twin.id, {
      maxSteps: 3,
      timeScale: 1,
      stepIntervalMs: 100,
      includeStochastic: false,
      seed: 7,
    });
    const parsed = SimulationRunSchema.parse(simulation);

    expect(parsed.twinId).toBe(twin.id);
    expect(parsed.status).toBe('completed');
    expect(parsed.currentStep).toBe(3);
    expect(parsed.outputStates).toHaveLength(3);
  });

  it('enforces statistics response contract shape', async () => {
    const twin = await service.createTwin(buildTwinInput());
    await service.ingestState(twin.id, {
      source: 'manual',
      properties: {
        speed: 10,
      },
      confidence: 1,
      timestamp: new Date('2026-03-11T10:10:00.000Z'),
    });
    await service.runSimulation(twin.id, {
      maxSteps: 2,
      timeScale: 1,
      stepIntervalMs: 50,
      includeStochastic: false,
      seed: 3,
    });

    const stats = await service.getStatistics();
    const parsed = TwinStatisticsSchema.parse(stats);

    expect(parsed.totalTwins).toBe(1);
    expect(parsed.twinsByType.conveyor).toBe(1);
    expect(parsed.twinsByStatus.online).toBe(1);
    expect(parsed.twinsWithState).toBe(1);
    expect(parsed.totalSimulations).toBe(1);
  });
});
