import { describe, expect, it, beforeEach } from 'vitest';
import { DigitalTwinService } from './digital-twin.service.js';

describe('DigitalTwinService', () => {
  let service: DigitalTwinService;

  beforeEach(() => {
    service = new DigitalTwinService();
  });

  it('creates and retrieves a twin', async () => {
    const created = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    const retrieved = await service.getTwin(created.id);

    expect(retrieved.id).toBe(created.id);
    expect(retrieved.assetId).toBe('asset-1');
  });

  it('prevents duplicate twins for the same asset', async () => {
    await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    await expect(
      service.createTwin({
        assetId: 'asset-1',
        name: 'Conveyor Twin 2',
        assetType: 'conveyor',
        status: 'online',
        zone: 'line-a',
        metadata: {},
      })
    ).rejects.toThrow('A digital twin already exists for this asset');
  });

  it('throws not found for unknown twin', async () => {
    await expect(service.getTwin('not-found')).rejects.toThrow("Asset 'DigitalTwin' not found");
  });

  it('updates a twin', async () => {
    const created = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    const updated = await service.updateTwin(created.id, {
      name: 'Conveyor Twin Updated',
      status: 'maintenance',
    });

    expect(updated.name).toBe('Conveyor Twin Updated');
    expect(updated.status).toBe('maintenance');
  });

  it('queries twins with filters and pagination', async () => {
    await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });
    await service.createTwin({
      assetId: 'asset-2',
      name: 'Sensor Twin',
      assetType: 'sensor',
      status: 'offline',
      zone: 'line-b',
      metadata: {},
    });

    const response = await service.queryTwins({
      assetType: 'sensor',
      page: 1,
      pageSize: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(response.total).toBe(1);
    expect(response.twins[0].assetType).toBe('sensor');
  });

  it('ingests and fetches latest state', async () => {
    const twin = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    const ingested = await service.ingestState(twin.id, {
      source: 'telemetry',
      properties: { speed: 100 },
      confidence: 0.97,
    });

    const latest = await service.getLatestState(twin.id);

    expect(ingested.version).toBe(1);
    expect(latest?.properties).toEqual({ speed: 100 });
  });

  it('returns bounded state history', async () => {
    const twin = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    await service.ingestState(twin.id, { source: 'telemetry', properties: { speed: 1 }, confidence: 1 });
    await service.ingestState(twin.id, { source: 'telemetry', properties: { speed: 2 }, confidence: 1 });
    await service.ingestState(twin.id, { source: 'telemetry', properties: { speed: 3 }, confidence: 1 });

    const history = await service.getStateHistory(twin.id, 2);
    expect(history).toHaveLength(2);
    expect(history[0].version).toBe(2);
    expect(history[1].version).toBe(3);
  });

  it('validates twin and warns when no state exists', async () => {
    const twin = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    const validation = await service.validateTwin(twin.id);

    expect(validation.isValid).toBe(true);
    expect(validation.issues.some(issue => issue.code === 'NO_STATE')).toBe(true);
  });

  it('validates twin and flags stale state', async () => {
    const twin = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    await service.ingestState(twin.id, {
      source: 'manual',
      properties: { speed: 1 },
      confidence: 1,
      timestamp: new Date(Date.now() - 16 * 60 * 1000),
    });

    const validation = await service.validateTwin(twin.id);

    expect(validation.issues.some(issue => issue.code === 'STATE_STALE')).toBe(true);
  });

  it('runs a simulation and returns generated states', async () => {
    const twin = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    await service.ingestState(twin.id, {
      source: 'telemetry',
      properties: { speed: 100, enabled: true },
      confidence: 1,
    });

    const simulation = await service.runSimulation(twin.id, {
      maxSteps: 3,
      timeScale: 1,
      stepIntervalMs: 100,
      includeStochastic: false,
      seed: 7,
    });

    expect(simulation.status).toBe('completed');
    expect(simulation.currentStep).toBe(3);
    expect(simulation.outputStates).toHaveLength(3);
  });

  it('returns statistics', async () => {
    const twin = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    await service.ingestState(twin.id, {
      source: 'telemetry',
      properties: { speed: 10 },
      confidence: 1,
    });

    await service.runSimulation(twin.id, { maxSteps: 2 });

    const stats = await service.getStatistics();

    expect(stats.totalTwins).toBe(1);
    expect(stats.twinsWithState).toBe(1);
    expect(stats.totalSimulations).toBe(1);
  });

  it('deletes twin when no active simulation exists', async () => {
    const twin = await service.createTwin({
      assetId: 'asset-1',
      name: 'Conveyor Twin',
      assetType: 'conveyor',
      status: 'online',
      zone: 'line-a',
      metadata: {},
    });

    await service.deleteTwin(twin.id);

    await expect(service.getTwin(twin.id)).rejects.toThrow("Asset 'DigitalTwin' not found");
  });
});
