import {
  TwinAsset,
  TwinState,
  SimulationConfig,
  SimulationRun,
  TwinValidationResult,
  TwinQuery,
  TwinStatistics,
  TwinAssetSchema,
  TwinStateSchema,
  SimulationConfigSchema,
  SimulationRunSchema,
  TwinValidationResultSchema,
  TwinQuerySchema,
  TwinStatisticsSchema,
} from '../types/index.js';
import { AssetNotFoundError, ValidationError, generateId, logAuditEvent } from '@neurologix/core';

export class DigitalTwinService {
  private twins = new Map<string, TwinAsset>();
  private stateHistory = new Map<string, TwinState[]>();
  private simulations = new Map<string, SimulationRun>();

  async createTwin(data: Omit<TwinAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<TwinAsset> {
    if (Array.from(this.twins.values()).some(twin => twin.assetId === data.assetId)) {
      throw new ValidationError('A digital twin already exists for this asset', { assetId: data.assetId });
    }

    const twin = TwinAssetSchema.parse({
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.twins.set(twin.id, twin);

    await logAuditEvent({
      action: 'digital_twin_create',
      resource: `digital-twin/${twin.id}`,
      outcome: 'success',
      details: { assetId: twin.assetId, assetType: twin.assetType },
      severity: 'medium',
    });

    return twin;
  }

  async getTwin(id: string): Promise<TwinAsset> {
    const twin = this.twins.get(id);
    if (!twin) {
      throw new AssetNotFoundError('DigitalTwin', { requestedId: id, assetType: 'DigitalTwin' });
    }
    return twin;
  }

  async updateTwin(id: string, updates: Partial<Omit<TwinAsset, 'id' | 'createdAt'>>): Promise<TwinAsset> {
    const existingTwin = await this.getTwin(id);

    const updatedTwin = TwinAssetSchema.parse({
      ...existingTwin,
      ...updates,
      id,
      createdAt: existingTwin.createdAt,
      updatedAt: new Date(),
    });

    this.twins.set(id, updatedTwin);

    await logAuditEvent({
      action: 'digital_twin_update',
      resource: `digital-twin/${id}`,
      outcome: 'success',
      details: { updatedFields: Object.keys(updates) },
      severity: 'low',
    });

    return updatedTwin;
  }

  async deleteTwin(id: string): Promise<void> {
    await this.getTwin(id);

    const hasActiveSimulation = Array.from(this.simulations.values()).some(
      simulation => simulation.twinId === id && ['pending', 'running'].includes(simulation.status)
    );

    if (hasActiveSimulation) {
      throw new ValidationError('Cannot delete digital twin with active simulation', { twinId: id });
    }

    this.twins.delete(id);
    this.stateHistory.delete(id);

    await logAuditEvent({
      action: 'digital_twin_delete',
      resource: `digital-twin/${id}`,
      outcome: 'success',
      severity: 'high',
    });
  }

  async queryTwins(query: TwinQuery): Promise<{ twins: TwinAsset[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const validatedQuery = TwinQuerySchema.parse(query);
    let twins = Array.from(this.twins.values());

    if (validatedQuery.assetType) {
      twins = twins.filter(twin => twin.assetType === validatedQuery.assetType);
    }
    if (validatedQuery.status) {
      twins = twins.filter(twin => twin.status === validatedQuery.status);
    }
    if (validatedQuery.zone) {
      twins = twins.filter(twin => twin.zone === validatedQuery.zone);
    }
    if (validatedQuery.search) {
      const search = validatedQuery.search.toLowerCase();
      twins = twins.filter(
        twin => twin.name.toLowerCase().includes(search) || twin.assetId.toLowerCase().includes(search)
      );
    }

    twins.sort((left, right) => {
      let result = 0;
      switch (validatedQuery.sortBy) {
        case 'createdAt':
          result = left.createdAt.getTime() - right.createdAt.getTime();
          break;
        case 'updatedAt':
          result = left.updatedAt.getTime() - right.updatedAt.getTime();
          break;
        default:
          result = left.name.localeCompare(right.name);
      }
      return validatedQuery.sortOrder === 'desc' ? -result : result;
    });

    const total = twins.length;
    const startIndex = (validatedQuery.page - 1) * validatedQuery.pageSize;
    const pagedTwins = twins.slice(startIndex, startIndex + validatedQuery.pageSize);

    return {
      twins: pagedTwins,
      total,
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
      totalPages: Math.max(1, Math.ceil(total / validatedQuery.pageSize)),
    };
  }

  async ingestState(
    twinId: string,
    input: Omit<TwinState, 'twinId' | 'timestamp' | 'version'> & { timestamp?: Date }
  ): Promise<TwinState> {
    await this.getTwin(twinId);

    const history = this.stateHistory.get(twinId) ?? [];
    const nextState = TwinStateSchema.parse({
      twinId,
      timestamp: input.timestamp ?? new Date(),
      source: input.source,
      properties: input.properties,
      confidence: input.confidence,
      version: history.length + 1,
    });

    history.push(nextState);
    this.stateHistory.set(twinId, history.slice(-5000));

    return nextState;
  }

  async getLatestState(twinId: string): Promise<TwinState | null> {
    await this.getTwin(twinId);
    const history = this.stateHistory.get(twinId) ?? [];
    return history.length === 0 ? null : history[history.length - 1];
  }

  async getStateHistory(twinId: string, limit = 100): Promise<TwinState[]> {
    await this.getTwin(twinId);
    const history = this.stateHistory.get(twinId) ?? [];
    return history.slice(-Math.max(1, limit));
  }

  async validateTwin(twinId: string): Promise<TwinValidationResult> {
    const twin = await this.getTwin(twinId);
    const latestState = await this.getLatestState(twinId);
    const issues: TwinValidationResult['issues'] = [];

    if (!latestState) {
      issues.push({
        level: 'warning',
        code: 'NO_STATE',
        message: 'Twin has no state history',
      });
    } else {
      const stateAgeMs = Date.now() - latestState.timestamp.getTime();
      const staleThresholdMs = 15 * 60 * 1000;
      if (stateAgeMs > staleThresholdMs) {
        issues.push({
          level: 'warning',
          code: 'STATE_STALE',
          message: 'Latest state is older than 15 minutes',
        });
      }
    }

    if (!twin.zone) {
      issues.push({
        level: 'error',
        code: 'ZONE_MISSING',
        message: 'Twin is missing zone information',
      });
    }

    const validationResult = TwinValidationResultSchema.parse({
      twinId,
      isValid: !issues.some(issue => issue.level === 'error'),
      issues,
      checkedAt: new Date(),
    });

    return validationResult;
  }

  async runSimulation(twinId: string, config: Partial<SimulationConfig> = {}): Promise<SimulationRun> {
    await this.getTwin(twinId);

    const existingRunningSimulation = Array.from(this.simulations.values()).find(
      simulation => simulation.twinId === twinId && ['pending', 'running'].includes(simulation.status)
    );

    if (existingRunningSimulation) {
      throw new ValidationError('A simulation is already active for this twin', { twinId });
    }

    const validatedConfig = SimulationConfigSchema.parse(config);
    const initialState = await this.getLatestState(twinId);

    const simulation = SimulationRunSchema.parse({
      id: generateId(),
      twinId,
      status: 'running',
      config: validatedConfig,
      startedAt: new Date(),
      currentStep: 0,
      totalSteps: validatedConfig.maxSteps,
      outputStates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.simulations.set(simulation.id, simulation);

    try {
      const seed = validatedConfig.seed ?? 1;
      for (let step = 1; step <= validatedConfig.maxSteps; step++) {
        const previousState = simulation.outputStates[simulation.outputStates.length - 1] ?? initialState;
        const previousProperties = (previousState?.properties ?? {}) as Record<string, unknown>;

        const simulatedProperties: Record<string, unknown> = {};
        for (const [propertyName, propertyValue] of Object.entries(previousProperties)) {
          if (typeof propertyValue === 'number') {
            const deterministicDelta = (seed + step + propertyName.length) % 3;
            const stochasticFactor = validatedConfig.includeStochastic ? ((seed + step) % 5) / 100 : 0;
            simulatedProperties[propertyName] = propertyValue + deterministicDelta * validatedConfig.timeScale + stochasticFactor;
          } else {
            simulatedProperties[propertyName] = propertyValue;
          }
        }

        const nextState = TwinStateSchema.parse({
          twinId,
          timestamp: new Date((simulation.startedAt?.getTime() ?? Date.now()) + step * validatedConfig.stepIntervalMs),
          source: 'simulation',
          properties: simulatedProperties,
          confidence: 0.98,
          version: step,
        });

        simulation.outputStates.push(nextState);
        simulation.currentStep = step;
      }

      simulation.status = 'completed';
      simulation.completedAt = new Date();
      simulation.updatedAt = new Date();
      this.simulations.set(simulation.id, simulation);

      await logAuditEvent({
        action: 'digital_twin_simulation_run',
        resource: `simulation/${simulation.id}`,
        outcome: 'success',
        details: { twinId, totalSteps: simulation.totalSteps },
        severity: 'medium',
      });

      return simulation;
    } catch (error) {
      simulation.status = 'failed';
      simulation.error = error instanceof Error ? error.message : String(error);
      simulation.updatedAt = new Date();
      this.simulations.set(simulation.id, simulation);
      return simulation;
    }
  }

  async getSimulation(simulationId: string): Promise<SimulationRun> {
    const simulation = this.simulations.get(simulationId);
    if (!simulation) {
      throw new AssetNotFoundError('Simulation', { requestedId: simulationId, assetType: 'Simulation' });
    }
    return simulation;
  }

  async getStatistics(): Promise<TwinStatistics> {
    const twins = Array.from(this.twins.values());
    const simulations = Array.from(this.simulations.values());

    const twinsByType: Record<string, number> = {};
    const twinsByStatus: Record<string, number> = {};

    for (const twin of twins) {
      twinsByType[twin.assetType] = (twinsByType[twin.assetType] ?? 0) + 1;
      twinsByStatus[twin.status] = (twinsByStatus[twin.status] ?? 0) + 1;
    }

    const twinsWithState = twins.filter(twin => (this.stateHistory.get(twin.id) ?? []).length > 0).length;
    const activeSimulations = simulations.filter(simulation => ['pending', 'running'].includes(simulation.status)).length;

    return TwinStatisticsSchema.parse({
      totalTwins: twins.length,
      twinsByType,
      twinsByStatus,
      twinsWithState,
      activeSimulations,
      totalSimulations: simulations.length,
      generatedAt: new Date(),
    });
  }
}
