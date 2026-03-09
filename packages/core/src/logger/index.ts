import winston from 'winston';
import { APP_CONFIG } from '../constants/index.js';

/**
 * Centralized logging configuration for NeuroLogix platform
 */

// Custom log format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, requestId, userId, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      service: service ?? APP_CONFIG.NAME,
      requestId,
      userId,
      environment: APP_CONFIG.ENVIRONMENT,
      version: APP_CONFIG.VERSION,
      ...meta,
    };

    return JSON.stringify(logEntry);
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (APP_CONFIG.ENVIRONMENT === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: {
    service: APP_CONFIG.NAME,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),

    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(new winston.transports.File({ filename: 'logs/exceptions.log' }));

logger.rejections.handle(new winston.transports.File({ filename: 'logs/rejections.log' }));

/**
 * Create a child logger with additional context
 */
export function createChildLogger(defaultMeta: Record<string, unknown>): winston.Logger {
  return logger.child(defaultMeta);
}

/**
 * Security audit logger for compliance
 */
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const auditEntry = {
        timestamp,
        level,
        message,
        type: 'AUDIT',
        environment: APP_CONFIG.ENVIRONMENT,
        ...meta,
      };
      return JSON.stringify(auditEntry);
    })
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      maxsize: 10485760, // 10MB
      maxFiles: 50, // Keep more audit logs for compliance
    }),
  ],
});

/**
 * Performance logger for monitoring
 */
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const perfEntry = {
        timestamp,
        level,
        message,
        type: 'PERFORMANCE',
        environment: APP_CONFIG.ENVIRONMENT,
        ...meta,
      };
      return JSON.stringify(perfEntry);
    })
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/performance.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

/**
 * Log a security audit event
 */
export function logAuditEvent(event: {
  action: string;
  resource: string;
  userId?: string;
  outcome: 'success' | 'failure' | 'partial';
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}): void {
  auditLogger.info('Security audit event', {
    ...event,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log a performance metric
 */
export function logPerformanceMetric(metric: {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}): void {
  performanceLogger.info('Performance metric', {
    ...metric,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Request logger middleware helper
 */
export function createRequestLogger(serviceName: string) {
  return createChildLogger({ service: serviceName });
}

/**
 * Structured error logging
 */
export function logError(
  error: Error,
  context: {
    requestId?: string;
    userId?: string;
    operation?: string;
    metadata?: Record<string, unknown>;
  } = {}
): void {
  logger.error('Application error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
}

/**
 * Log sanitization for sensitive data
 */
export function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'credit_card',
    'ssn',
    'social_security',
  ];

  const sanitized = { ...data };

  function sanitizeRecursive(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeRecursive);
    }

    const sanitizedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitizedObj[key] = '[REDACTED]';
      } else {
        sanitizedObj[key] = sanitizeRecursive(value);
      }
    }
    return sanitizedObj;
  }

  return sanitizeRecursive(sanitized);
}

// Export the main logger
export default logger;
