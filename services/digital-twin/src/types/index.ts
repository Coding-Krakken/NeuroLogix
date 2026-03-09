import { z } from 'zod';

export const TwinAssetSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().min(1),
  name: z.string().min(1).max(200),
  assetType: z.enum(['plc', 'camera', 'sensor', 'conveyor', 'robot', 'dock', 'workstation']),
  status: z.enum(['online', 'offline', 'maintenance', 'error']),
  zone: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TwinAsset = z.infer<typeof TwinAssetSchema>;

export const TwinStateSchema = z.object({
  twinId: z.string().uuid(),
  timestamp: z.date(),
  source: z.enum(['telemetry', 'simulation', 'manual']),
  properties: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1).default(1),
  version: z.number().int().min(1),
});

export type TwinState = z.infer<typeof TwinStateSchema>;

export const SimulationConfigSchema = z.object({
  timeScale: z.number().positive().default(1),
  stepIntervalMs: z.number().int().min(1).default(1000),
  maxSteps: z.number().int().min(1).max(5000).default(100),
  includeStochastic: z.boolean().default(false),
  seed: z.number().int().optional(),
});

export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;

export const SimulationRunSchema = z.object({
  id: z.string().uuid(),
  twinId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  config: SimulationConfigSchema,
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  currentStep: z.number().int().min(0).default(0),
  totalSteps: z.number().int().min(1),
  outputStates: z.array(TwinStateSchema).default([]),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SimulationRun = z.infer<typeof SimulationRunSchema>;

export const TwinValidationIssueSchema = z.object({
  level: z.enum(['error', 'warning', 'info']),
  code: z.string(),
  message: z.string(),
  path: z.string().optional(),
});

export type TwinValidationIssue = z.infer<typeof TwinValidationIssueSchema>;

export const TwinValidationResultSchema = z.object({
  twinId: z.string().uuid(),
  isValid: z.boolean(),
  issues: z.array(TwinValidationIssueSchema),
  checkedAt: z.date(),
});

export type TwinValidationResult = z.infer<typeof TwinValidationResultSchema>;

export const TwinQuerySchema = z.object({
  assetType: z.enum(['plc', 'camera', 'sensor', 'conveyor', 'robot', 'dock', 'workstation']).optional(),
  status: z.enum(['online', 'offline', 'maintenance', 'error']).optional(),
  zone: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type TwinQuery = z.infer<typeof TwinQuerySchema>;

export const TwinStatisticsSchema = z.object({
  totalTwins: z.number().int().min(0),
  twinsByType: z.record(z.string(), z.number().int().min(0)),
  twinsByStatus: z.record(z.string(), z.number().int().min(0)),
  twinsWithState: z.number().int().min(0),
  activeSimulations: z.number().int().min(0),
  totalSimulations: z.number().int().min(0),
  generatedAt: z.date(),
});

export type TwinStatistics = z.infer<typeof TwinStatisticsSchema>;
