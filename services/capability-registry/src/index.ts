/**
 * @fileoverview NeuroLogix Capability Registry Service
 * @version 0.1.0
 * @license PROPRIETARY
 * 
 * Enterprise-grade capability management service for the NeuroLogix platform.
 * Provides comprehensive lifecycle management, health monitoring, and dependency resolution.
 */

export * from './types/index.js';
export * from './services/capability-registry.service.js';

// Re-export for convenience
export { CapabilityRegistryService } from './services/capability-registry.service.js';
export type { 
  Capability, 
  CapabilityInstallRequest, 
  CapabilityUpdateRequest,
  CapabilityQuery,
  CapabilityRegistryResponse,
  CapabilityHealth,
  RegistryStats
} from './types/index.js';