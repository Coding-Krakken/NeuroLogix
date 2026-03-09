import { z } from 'zod';

/**
 * Core business domain types for NeuroLogix Industrial Control System
 */

// Asset and Device Types
export const AssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['plc', 'camera', 'sensor', 'conveyor', 'robot', 'dock', 'workstation']),
  zone: z.string().min(1),
  status: z.enum(['online', 'offline', 'maintenance', 'error']),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Asset = z.infer<typeof AssetSchema>;

// Telemetry and Data Types
export const TelemetrySchema = z.object({
  assetId: z.string().uuid(),
  timestamp: z.date(),
  tags: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  quality: z.enum(['good', 'bad', 'uncertain']).default('good'),
  source: z.string(),
});

export type Telemetry = z.infer<typeof TelemetrySchema>;

// Intent and Action Types
export const IntentSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['voice_command', 'ui_action', 'automation_trigger', 'alarm_response']),
  source: z.string(),
  payload: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1),
  timestamp: z.date(),
  userId: z.string().optional(),
});

export type Intent = z.infer<typeof IntentSchema>;

// Recipe and Automation Types
export const RecipeStepSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['set_tag', 'wait_condition', 'call_service', 'parallel', 'sequence']),
  parameters: z.record(z.string(), z.unknown()),
  preconditions: z.array(z.string()).optional(),
  timeout: z.number().optional(),
  rollback: z.unknown().optional(),
});

export const RecipeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  version: z.string(),
  description: z.string().optional(),
  steps: z.array(RecipeStepSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),
});

export type RecipeStep = z.infer<typeof RecipeStepSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;

// Audit and Compliance Types
export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.date(),
  userId: z.string(),
  action: z.string(),
  resource: z.string(),
  details: z.record(z.string(), z.unknown()),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  outcome: z.enum(['success', 'failure', 'partial']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

// User and Authorization Types
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1),
  email: z.string().email(),
  roles: z.array(z.string()),
  zones: z.array(z.string()),
  capabilities: z.array(z.string()),
  isActive: z.boolean(),
  lastLogin: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.date(),
  requestId: z.string().uuid(),
});

export type ApiResponse<T = unknown> = Omit<z.infer<typeof ApiResponseSchema>, 'data'> & {
  data?: T;
};

// System Health and Monitoring Types
export const ServiceHealthSchema = z.object({
  name: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  version: z.string(),
  uptime: z.number(),
  metrics: z.record(z.string(), z.number()).optional(),
  dependencies: z
    .array(
      z.object({
        name: z.string(),
        status: z.enum(['healthy', 'degraded', 'unhealthy']),
      })
    )
    .optional(),
  timestamp: z.date(),
});

export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;
