import { ERROR_CODES } from '../constants/index.js';

/**
 * Base error class for NeuroLogix platform
 */
export abstract class NeuroLogixError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends NeuroLogixError {
  constructor(message = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, ERROR_CODES.AUTH_INVALID_TOKEN, 401, true, context);
  }
}

export class AuthorizationError extends NeuroLogixError {
  constructor(message = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, 403, true, context);
  }
}

export class TokenExpiredError extends NeuroLogixError {
  constructor(message = 'Token has expired', context?: Record<string, unknown>) {
    super(message, ERROR_CODES.AUTH_EXPIRED_TOKEN, 401, true, context);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends NeuroLogixError {
  constructor(message = 'Validation failed', context?: Record<string, unknown>) {
    super(message, ERROR_CODES.VALIDATION_FAILED, 400, true, context);
  }
}

export class InvalidInputError extends NeuroLogixError {
  constructor(message = 'Invalid input provided', context?: Record<string, unknown>) {
    super(message, ERROR_CODES.INVALID_INPUT, 400, true, context);
  }
}

export class MissingRequiredFieldError extends NeuroLogixError {
  constructor(field: string, context?: Record<string, unknown>) {
    super(`Required field '${field}' is missing`, ERROR_CODES.MISSING_REQUIRED_FIELD, 400, true, {
      field,
      ...context,
    });
  }
}

/**
 * Business logic errors
 */
export class AssetNotFoundError extends NeuroLogixError {
  constructor(assetId: string, context?: Record<string, unknown>) {
    super(`Asset '${assetId}' not found`, ERROR_CODES.ASSET_NOT_FOUND, 404, true, {
      assetId,
      ...context,
    });
  }
}

export class RecipeExecutionError extends NeuroLogixError {
  constructor(recipeId: string, reason: string, context?: Record<string, unknown>) {
    super(
      `Recipe '${recipeId}' execution failed: ${reason}`,
      ERROR_CODES.RECIPE_EXECUTION_FAILED,
      422,
      true,
      {
        recipeId,
        reason,
        ...context,
      }
    );
  }
}

export class CapabilityNotAvailableError extends NeuroLogixError {
  constructor(capability: string, context?: Record<string, unknown>) {
    super(
      `Capability '${capability}' is not available`,
      ERROR_CODES.CAPABILITY_NOT_AVAILABLE,
      503,
      true,
      {
        capability,
        ...context,
      }
    );
  }
}

export class PolicyViolationError extends NeuroLogixError {
  constructor(policy: string, reason: string, context?: Record<string, unknown>) {
    super(`Policy '${policy}' violation: ${reason}`, ERROR_CODES.POLICY_VIOLATION, 403, true, {
      policy,
      reason,
      ...context,
    });
  }
}

/**
 * System errors
 */
export class DatabaseConnectionError extends NeuroLogixError {
  constructor(message = 'Database connection failed', context?: Record<string, unknown>) {
    super(message, ERROR_CODES.DATABASE_CONNECTION_FAILED, 503, false, context);
  }
}

export class ExternalServiceError extends NeuroLogixError {
  constructor(service: string, reason: string, context?: Record<string, unknown>) {
    super(
      `External service '${service}' unavailable: ${reason}`,
      ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE,
      503,
      true,
      {
        service,
        reason,
        ...context,
      }
    );
  }
}

export class RateLimitExceededError extends NeuroLogixError {
  constructor(limit: number, window: string, context?: Record<string, unknown>) {
    super(
      `Rate limit exceeded: ${limit} requests per ${window}`,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429,
      true,
      {
        limit,
        window,
        ...context,
      }
    );
  }
}

export class InternalServerError extends NeuroLogixError {
  constructor(message = 'Internal server error', context?: Record<string, unknown>) {
    super(message, ERROR_CODES.INTERNAL_SERVER_ERROR, 500, false, context);
  }
}

/**
 * Error handler utility functions
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof NeuroLogixError) {
    return error.isOperational;
  }
  return false;
}

export function createErrorFromHttpStatus(statusCode: number, message?: string): NeuroLogixError {
  const defaultMessage = message ?? 'An error occurred';

  switch (statusCode) {
    case 400:
      return new ValidationError(defaultMessage);
    case 401:
      return new AuthenticationError(defaultMessage);
    case 403:
      return new AuthorizationError(defaultMessage);
    case 404:
      return new AssetNotFoundError('unknown', { customMessage: defaultMessage });
    case 429:
      return new RateLimitExceededError(100, '1m', { customMessage: defaultMessage });
    case 503:
      return new ExternalServiceError('unknown', defaultMessage);
    default:
      return new InternalServerError(defaultMessage);
  }
}
