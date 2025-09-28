/**
 * System-wide constants for NeuroLogix platform
 */

// API Configuration
export const API_CONSTANTS = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RATE_LIMIT_PER_MINUTE: 1000,
  PAGE_SIZE_DEFAULT: 50,
  PAGE_SIZE_MAX: 1000,
} as const;

// Security Constants
export const SECURITY_CONSTANTS = {
  JWT_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  MIN_PASSWORD_LENGTH: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_TIMEOUT_MINUTES: 60,
} as const;

// Industrial Standards
export const IEC62443_ZONES = {
  ENTERPRISE: 'enterprise',
  MANUFACTURING: 'manufacturing',
  CELL: 'cell',
  SAFETY: 'safety',
  SECURE_REMOTE_ACCESS: 'secure_remote_access',
} as const;

export const ISA95_LEVELS = {
  LEVEL_0: 'physical_process',
  LEVEL_1: 'sensing_manipulation',
  LEVEL_2: 'monitoring_control',
  LEVEL_3: 'workflow_batch',
  LEVEL_4: 'business_logistics',
} as const;

// Asset Types and Categories
export const ASSET_TYPES = {
  PLC: 'plc',
  CAMERA: 'camera',
  SENSOR: 'sensor',
  CONVEYOR: 'conveyor',
  ROBOT: 'robot',
  DOCK: 'dock',
  WORKSTATION: 'workstation',
} as const;

export const ASSET_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  ERROR: 'error',
} as const;

// Data Quality Indicators
export const DATA_QUALITY = {
  GOOD: 'good',
  BAD: 'bad',
  UNCERTAIN: 'uncertain',
} as const;

// Service Health Status
export const SERVICE_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
} as const;

// Audit Event Severities
export const AUDIT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Logging Levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly',
} as const;

// Recipe Step Types
export const RECIPE_STEP_TYPES = {
  SET_TAG: 'set_tag',
  WAIT_CONDITION: 'wait_condition',
  CALL_SERVICE: 'call_service',
  PARALLEL: 'parallel',
  SEQUENCE: 'sequence',
} as const;

// Intent Types
export const INTENT_TYPES = {
  VOICE_COMMAND: 'voice_command',
  UI_ACTION: 'ui_action',
  AUTOMATION_TRIGGER: 'automation_trigger',
  ALARM_RESPONSE: 'alarm_response',
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: 'NeuroLogix',
  VERSION: process.env.npm_package_version || '0.1.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
} as const;

// Message Queue Topics
export const MQTT_TOPICS = {
  TELEMETRY: 'spBv1.0/group/DDATA/+/+',
  COMMANDS: 'spBv1.0/group/DCMD/+/+',
  BIRTHS: 'spBv1.0/group/DBIRTH/+/+',
  DEATHS: 'spBv1.0/group/DDEATH/+/+',
} as const;

export const KAFKA_TOPICS = {
  TELEMETRY: 'neurologix.telemetry',
  INTENTS: 'neurologix.intents',
  RECIPES: 'neurologix.recipes',
  AUDIT: 'neurologix.audit',
  ALERTS: 'neurologix.alerts',
} as const;

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME_MS: 200,
  TELEMETRY_INGESTION_RATE: 10000, // tags per second
  UI_RENDER_TIME_MS: 16, // 60 FPS
  DATABASE_QUERY_TIME_MS: 100,
  CACHE_HIT_RATIO: 0.95,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication & Authorization
  AUTH_INVALID_TOKEN: 'AUTH_001',
  AUTH_EXPIRED_TOKEN: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  
  // Validation Errors
  VALIDATION_FAILED: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  MISSING_REQUIRED_FIELD: 'VAL_003',
  
  // Business Logic Errors
  ASSET_NOT_FOUND: 'BIZ_001',
  RECIPE_EXECUTION_FAILED: 'BIZ_002',
  CAPABILITY_NOT_AVAILABLE: 'BIZ_003',
  POLICY_VIOLATION: 'BIZ_004',
  
  // System Errors
  DATABASE_CONNECTION_FAILED: 'SYS_001',
  EXTERNAL_SERVICE_UNAVAILABLE: 'SYS_002',
  RATE_LIMIT_EXCEEDED: 'SYS_003',
  INTERNAL_SERVER_ERROR: 'SYS_004',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  AI_ASSISTANT_ENABLED: process.env.FF_AI_ASSISTANT === 'true',
  ADVANCED_ANALYTICS: process.env.FF_ADVANCED_ANALYTICS === 'true',
  MULTI_SITE_FEDERATION: process.env.FF_MULTI_SITE === 'true',
  EXPERIMENTAL_FEATURES: process.env.FF_EXPERIMENTAL === 'true',
} as const;