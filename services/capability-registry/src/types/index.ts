import { z } from 'zod';

/**
 * Capability Registry Types and Schemas
 * Enterprise-grade capability management system
 */

// Capability Status Enumeration
export const CapabilityStatus = z.enum([
  'installed', // Capability is installed but not active
  'enabled', // Capability is enabled and operational
  'disabled', // Capability is disabled but can be enabled
  'failed', // Capability failed to load/initialize
  'updating', // Capability is being updated
  'uninstalling', // Capability is being uninstalled
]);

export type CapabilityStatus = z.infer<typeof CapabilityStatus>;

// Capability Type Categories
export const CapabilityType = z.enum([
  'adapter', // Protocol adapters (OPC UA, MQTT, etc.)
  'ai_model', // AI/ML models and processors
  'optimizer', // Optimization algorithms
  'connector', // External system connectors (WMS, WCS, etc.)
  'ui_component', // Frontend UI components
  'middleware', // Middleware services
  'security', // Security and authentication modules
  'analytics', // Analytics and reporting
]);

export type CapabilityType = z.infer<typeof CapabilityType>;

// Capability Dependency Schema
export const CapabilityDependencySchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // Semver format
  required: z.boolean().default(true),
  description: z.string().optional(),
});

export type CapabilityDependency = z.infer<typeof CapabilityDependencySchema>;

// Capability Configuration Schema
export const CapabilityConfigSchema = z.object({
  schema: z.record(z.string(), z.unknown()), // JSON Schema for configuration
  defaults: z.record(z.string(), z.unknown()).optional(),
  required: z.array(z.string()).optional(),
  validation: z.record(z.string(), z.unknown()).optional(),
});

export type CapabilityConfig = z.infer<typeof CapabilityConfigSchema>;

// Main Capability Schema
export const CapabilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  type: CapabilityType,
  status: CapabilityStatus,

  // Metadata
  displayName: z.string().min(1).max(200),
  description: z.string().max(1000),
  author: z.string().min(1),
  homepage: z.string().url().optional(),
  documentation: z.string().url().optional(),

  // Technical specifications
  dependencies: z.array(CapabilityDependencySchema).default([]),
  permissions: z.array(z.string()).default([]), // Required permissions
  zones: z.array(z.string()).default([]), // Applicable zones
  platforms: z.array(z.string()).default(['linux', 'windows']), // Supported platforms

  // Configuration
  configuration: CapabilityConfigSchema.optional(),
  currentConfig: z.record(z.string(), z.unknown()).optional(),

  // Runtime information
  installPath: z.string().optional(),
  entryPoint: z.string().optional(), // Main executable/script
  healthEndpoint: z.string().url().optional(),
  metricsEndpoint: z.string().url().optional(),

  // Lifecycle timestamps
  installedAt: z.date(),
  enabledAt: z.date().optional(),
  lastUpdated: z.date(),
  lastHealthCheck: z.date().optional(),

  // Health and performance
  isHealthy: z.boolean().default(true),
  lastError: z.string().optional(),
  resourceUsage: z
    .object({
      cpu: z.number().min(0).max(100).optional(),
      memory: z.number().min(0).optional(), // MB
      disk: z.number().min(0).optional(), // MB
    })
    .optional(),

  // Security and compliance
  checksum: z.string().optional(), // File integrity check
  signature: z.string().optional(), // Digital signature
  securityScan: z
    .object({
      status: z.enum(['passed', 'failed', 'pending', 'skipped']),
      lastScanned: z.date().optional(),
      vulnerabilities: z.number().min(0).optional(),
    })
    .optional(),
});

export type Capability = z.infer<typeof CapabilitySchema>;

// Capability Installation Request
export const CapabilityInstallRequestSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  source: z.string().url(), // Package URL or registry identifier
  configuration: z.record(z.string(), z.unknown()).optional(),
  autoEnable: z.boolean().default(false),
  forceUpdate: z.boolean().default(false),
});

export type CapabilityInstallRequest = z.infer<typeof CapabilityInstallRequestSchema>;

// Capability Update Request
export const CapabilityUpdateRequestSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  configuration: z.record(z.string(), z.unknown()).optional(),
  restartRequired: z.boolean().default(false),
});

export type CapabilityUpdateRequest = z.infer<typeof CapabilityUpdateRequestSchema>;

// Registry Query Parameters
export const CapabilityQuerySchema = z.object({
  type: CapabilityType.optional(),
  status: CapabilityStatus.optional(),
  zone: z.string().optional(),
  search: z.string().optional(), // Search in name/description
  limit: z.number().min(1).max(1000).default(50),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['name', 'type', 'status', 'installedAt', 'lastUpdated']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CapabilityQuery = z.infer<typeof CapabilityQuerySchema>;

// Registry Response Types
export const CapabilityRegistryResponseSchema = z.object({
  capabilities: z.array(CapabilitySchema),
  total: z.number().min(0),
  limit: z.number().min(1),
  offset: z.number().min(0),
  hasMore: z.boolean(),
});

export type CapabilityRegistryResponse = z.infer<typeof CapabilityRegistryResponseSchema>;

// Health Check Response
export const CapabilityHealthSchema = z.object({
  capabilityId: z.string().uuid(),
  isHealthy: z.boolean(),
  status: CapabilityStatus,
  lastCheck: z.date(),
  details: z.record(z.string(), z.unknown()).optional(),
  errors: z.array(z.string()).optional(),
});

export type CapabilityHealth = z.infer<typeof CapabilityHealthSchema>;

// Registry Statistics
export const RegistryStatsSchema = z.object({
  total: z.number().min(0),
  enabled: z.number().min(0),
  disabled: z.number().min(0),
  failed: z.number().min(0),
  byType: z.record(CapabilityType, z.number().min(0)),
  byZone: z.record(z.string(), z.number().min(0)),
  lastUpdated: z.date(),
});

export type RegistryStats = z.infer<typeof RegistryStatsSchema>;
