import { describe, it, expect } from 'vitest';
import {
  NeuroLogixError,
  AuthenticationError,
  ValidationError,
  AssetNotFoundError,
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
  });
});
