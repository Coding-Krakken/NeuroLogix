import { describe, it, expect } from 'vitest';
import {
  NeuroLogixError,
  AuthenticationError,
  AuthorizationError,
  TokenExpiredError,
  ValidationError,
  InvalidInputError,
  MissingRequiredFieldError,
  AssetNotFoundError,
  RecipeExecutionError,
  CapabilityNotAvailableError,
  PolicyViolationError,
  DatabaseConnectionError,
  ExternalServiceError,
  RateLimitExceededError,
  InternalServerError,
  isOperationalError,
  createErrorFromHttpStatus,
} from '@/errors/index';

describe('Error Classes', () => {
  describe('NeuroLogixError', () => {
    it('should create error with all properties', () => {
      class TestError extends NeuroLogixError {
        constructor(message: string) {
          super(message, 'TEST_001', 400, true, { test: true });
        }
      }

      const error = new TestError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_001');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ test: true });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should serialize to JSON correctly', () => {
      const error = new AuthenticationError('Auth failed', { userId: '123' });
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'AuthenticationError');
      expect(json).toHaveProperty('message', 'Auth failed');
      expect(json).toHaveProperty('code', 'AUTH_001');
      expect(json).toHaveProperty('statusCode', 401);
      expect(json).toHaveProperty('isOperational', true);
      expect(json).toHaveProperty('context', { userId: '123' });
      expect(json).toHaveProperty('timestamp');
    });
  });

  describe('AuthenticationError', () => {
    it('should create with default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_001');
    });

    it('should create with custom message and context', () => {
      const error = new AuthenticationError('Invalid token', { token: 'abc123' });
      expect(error.message).toBe('Invalid token');
      expect(error.context).toEqual({ token: 'abc123' });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VAL_001');
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('AssetNotFoundError', () => {
    it('should create asset not found error', () => {
      const error = new AssetNotFoundError('asset-123');
      expect(error.message).toBe("Asset 'asset-123' not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('BIZ_001');
      expect(error.context).toEqual({ assetId: 'asset-123' });
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational errors', () => {
      const error = new ValidationError('Test error');
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-NeuroLogix errors', () => {
      const error = new Error('Standard error');
      expect(isOperationalError(error)).toBe(false);
    });
  });

  describe('createErrorFromHttpStatus', () => {
    it('should create appropriate error for status codes', () => {
      expect(createErrorFromHttpStatus(400)).toBeInstanceOf(ValidationError);
      expect(createErrorFromHttpStatus(401)).toBeInstanceOf(AuthenticationError);
      expect(createErrorFromHttpStatus(404)).toBeInstanceOf(AssetNotFoundError);
    });

    it('should create error with custom message', () => {
      const error = createErrorFromHttpStatus(400, 'Custom validation error');
      expect(error.message).toBe('Custom validation error');
    });

    it('should create AuthorizationError for status 403', () => {
      const error = createErrorFromHttpStatus(403);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.statusCode).toBe(403);
    });

    it('should create RateLimitExceededError for status 429', () => {
      const error = createErrorFromHttpStatus(429);
      expect(error).toBeInstanceOf(RateLimitExceededError);
      expect(error.statusCode).toBe(429);
    });

    it('should create ExternalServiceError for status 503', () => {
      const error = createErrorFromHttpStatus(503);
      expect(error).toBeInstanceOf(ExternalServiceError);
      expect(error.statusCode).toBe(503);
    });

    it('should create InternalServerError for unrecognised status codes (default case)', () => {
      const error = createErrorFromHttpStatus(418);
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error.statusCode).toBe(500);
    });

    it('uses default message when none provided', () => {
      const error = createErrorFromHttpStatus(401);
      expect(error.message).toBe('An error occurred');
    });
  });
});

// ─── Additional error classes ──────────────────────────────────────────────

describe('AuthorizationError', () => {
  it('creates with default message', () => {
    const error = new AuthorizationError();
    expect(error.message).toBe('Insufficient permissions');
    expect(error.statusCode).toBe(403);
    expect(error.isOperational).toBe(true);
  });

  it('creates with custom message and context', () => {
    const error = new AuthorizationError('Not allowed', { resource: '/api/plc' });
    expect(error.message).toBe('Not allowed');
    expect(error.context).toEqual({ resource: '/api/plc' });
  });
});

describe('TokenExpiredError', () => {
  it('creates with default message', () => {
    const error = new TokenExpiredError();
    expect(error.message).toBe('Token has expired');
    expect(error.statusCode).toBe(401);
    expect(error.isOperational).toBe(true);
  });

  it('creates with custom message', () => {
    const error = new TokenExpiredError('JWT expired');
    expect(error.message).toBe('JWT expired');
  });
});

describe('InvalidInputError', () => {
  it('creates with default message', () => {
    const error = new InvalidInputError();
    expect(error.message).toBe('Invalid input provided');
    expect(error.statusCode).toBe(400);
  });

  it('creates with custom message and context', () => {
    const error = new InvalidInputError('Bad format', { field: 'recipeId' });
    expect(error.context).toEqual({ field: 'recipeId' });
  });
});

describe('MissingRequiredFieldError', () => {
  it('includes the field name in the message', () => {
    const error = new MissingRequiredFieldError('siteId');
    expect(error.message).toBe("Required field 'siteId' is missing");
    expect(error.statusCode).toBe(400);
  });

  it('includes the field in context', () => {
    const error = new MissingRequiredFieldError('recipeId', { caller: 'executor' });
    expect(error.context).toMatchObject({ field: 'recipeId', caller: 'executor' });
  });
});

describe('RecipeExecutionError', () => {
  it('includes recipeId and reason in message', () => {
    const error = new RecipeExecutionError('recipe-001', 'safety interlock triggered');
    expect(error.message).toContain('recipe-001');
    expect(error.message).toContain('safety interlock triggered');
    expect(error.statusCode).toBe(422);
  });

  it('stores recipeId and reason in context', () => {
    const error = new RecipeExecutionError('r-002', 'timeout', { stepId: 's-01' });
    expect(error.context).toMatchObject({ recipeId: 'r-002', reason: 'timeout', stepId: 's-01' });
  });
});

describe('CapabilityNotAvailableError', () => {
  it('includes capability name in message', () => {
    const error = new CapabilityNotAvailableError('conveyor-speed');
    expect(error.message).toContain('conveyor-speed');
    expect(error.statusCode).toBe(503);
    expect(error.isOperational).toBe(true);
  });

  it('stores capability in context', () => {
    const error = new CapabilityNotAvailableError('e-stop', { reason: 'hardware fault' });
    expect(error.context).toMatchObject({ capability: 'e-stop', reason: 'hardware fault' });
  });
});

describe('PolicyViolationError', () => {
  it('includes policy and reason in message', () => {
    const error = new PolicyViolationError('safety-zone-A', 'unauthorized PLC command');
    expect(error.message).toContain('safety-zone-A');
    expect(error.message).toContain('unauthorized PLC command');
    expect(error.statusCode).toBe(403);
  });

  it('stores policy and reason in context', () => {
    const error = new PolicyViolationError('rate-limit', 'exceeded', { limit: 100 });
    expect(error.context).toMatchObject({ policy: 'rate-limit', reason: 'exceeded', limit: 100 });
  });
});

describe('DatabaseConnectionError', () => {
  it('creates with default message and is NOT operational', () => {
    const error = new DatabaseConnectionError();
    expect(error.message).toBe('Database connection failed');
    expect(error.statusCode).toBe(503);
    expect(error.isOperational).toBe(false);
  });

  it('is flagged as non-operational by isOperationalError()', () => {
    const error = new DatabaseConnectionError();
    expect(isOperationalError(error)).toBe(false);
  });

  it('creates with custom message', () => {
    const error = new DatabaseConnectionError('Redis unreachable');
    expect(error.message).toBe('Redis unreachable');
  });
});

describe('ExternalServiceError', () => {
  it('includes service name and reason in message', () => {
    const error = new ExternalServiceError('scada-api', 'connection refused');
    expect(error.message).toContain('scada-api');
    expect(error.message).toContain('connection refused');
    expect(error.statusCode).toBe(503);
  });

  it('stores service and reason in context', () => {
    const error = new ExternalServiceError('kafka', 'broker down', { topic: 'nlx.telemetry' });
    expect(error.context).toMatchObject({ service: 'kafka', reason: 'broker down' });
  });
});

describe('RateLimitExceededError', () => {
  it('includes limit and window in message', () => {
    const error = new RateLimitExceededError(100, '1m');
    expect(error.message).toContain('100');
    expect(error.message).toContain('1m');
    expect(error.statusCode).toBe(429);
  });

  it('stores limit and window in context', () => {
    const error = new RateLimitExceededError(50, '10s', { endpoint: '/api/cmd' });
    expect(error.context).toMatchObject({ limit: 50, window: '10s', endpoint: '/api/cmd' });
  });
});

describe('InternalServerError', () => {
  it('creates with default message and is NOT operational', () => {
    const error = new InternalServerError();
    expect(error.message).toBe('Internal server error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });

  it('creates with custom message', () => {
    const error = new InternalServerError('Unexpected null pointer');
    expect(error.message).toBe('Unexpected null pointer');
  });
});
