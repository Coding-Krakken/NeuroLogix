import { describe, expect, it } from 'vitest';
import {
  API_ERROR_CODE,
  SERVICE_HEALTH_STATUS,
  ApiErrorCodeSchema,
  ApiErrorSchema,
  ApiResponseMetaSchema,
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
  ApiResponseSchema,
  PaginationMetaSchema,
  PaginatedResponseSchema,
  ServiceHealthSchema,
  HealthCheckResponseSchema,
} from './index.js';

describe('API_ERROR_CODE', () => {
  it('defines canonical error constants', () => {
    expect(API_ERROR_CODE.BAD_REQUEST).toBe('BAD_REQUEST');
    expect(API_ERROR_CODE.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(API_ERROR_CODE.NOT_FOUND).toBe('NOT_FOUND');
    expect(API_ERROR_CODE.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });
});

describe('ApiErrorCodeSchema', () => {
  it('accepts known error codes', () => {
    expect(ApiErrorCodeSchema.parse('BAD_REQUEST')).toBe('BAD_REQUEST');
    expect(ApiErrorCodeSchema.parse('CONFLICT')).toBe('CONFLICT');
  });

  it('rejects unknown error codes', () => {
    expect(() => ApiErrorCodeSchema.parse('SOMETHING_ELSE')).toThrow();
  });
});

describe('ApiErrorSchema', () => {
  it('parses minimal error payload and applies defaults', () => {
    const parsed = ApiErrorSchema.parse({
      code: API_ERROR_CODE.VALIDATION_ERROR,
      message: 'Invalid request body',
    });

    expect(parsed.code).toBe('VALIDATION_ERROR');
    expect(parsed.retryable).toBe(false);
  });

  it('parses field-level errors', () => {
    const parsed = ApiErrorSchema.parse({
      code: API_ERROR_CODE.VALIDATION_ERROR,
      message: 'Validation failed',
      fieldErrors: [{ field: 'siteId', message: 'siteId is required' }],
    });

    expect(parsed.fieldErrors).toHaveLength(1);
    expect(parsed.fieldErrors?.[0]?.field).toBe('siteId');
  });
});

describe('ApiResponseMetaSchema', () => {
  it('parses valid metadata', () => {
    const parsed = ApiResponseMetaSchema.parse({
      requestId: 'req-123',
      timestamp: new Date().toISOString(),
      traceId: 'trace-abc',
    });

    expect(parsed.requestId).toBe('req-123');
    expect(parsed.traceId).toBe('trace-abc');
  });

  it('rejects invalid timestamp', () => {
    expect(() =>
      ApiResponseMetaSchema.parse({
        requestId: 'req-123',
        timestamp: 'not-a-date',
      })
    ).toThrow();
  });
});

describe('ApiResponseSchema', () => {
  const meta = {
    requestId: 'req-123',
    timestamp: new Date().toISOString(),
  };

  it('accepts success envelope', () => {
    const success = ApiSuccessResponseSchema.parse({
      success: true,
      data: { id: 'site-1', name: 'Site Alpha' },
      meta,
    });

    expect(success.success).toBe(true);
    expect((success.data as { id: string }).id).toBe('site-1');
  });

  it('accepts error envelope', () => {
    const error = ApiErrorResponseSchema.parse({
      success: false,
      error: {
        code: API_ERROR_CODE.NOT_FOUND,
        message: 'Site not found',
      },
      meta,
    });

    expect(error.success).toBe(false);
    expect(error.error.code).toBe('NOT_FOUND');
  });

  it('discriminates by success field', () => {
    const parsedSuccess = ApiResponseSchema.parse({ success: true, data: { ok: true }, meta });
    const parsedError = ApiResponseSchema.parse({
      success: false,
      error: { code: API_ERROR_CODE.INTERNAL_ERROR, message: 'Unexpected error' },
      meta,
    });

    expect(parsedSuccess.success).toBe(true);
    expect(parsedError.success).toBe(false);
  });
});

describe('PaginatedResponseSchema', () => {
  const meta = {
    requestId: 'req-234',
    timestamp: new Date().toISOString(),
  };

  it('parses valid pagination metadata', () => {
    const parsed = PaginationMetaSchema.parse({
      page: 2,
      pageSize: 25,
      totalItems: 100,
      totalPages: 4,
      hasNext: true,
      hasPrevious: true,
    });

    expect(parsed.page).toBe(2);
    expect(parsed.totalPages).toBe(4);
  });

  it('rejects invalid page bounds', () => {
    expect(() =>
      PaginationMetaSchema.parse({
        page: 0,
        pageSize: 25,
        totalItems: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      })
    ).toThrow();
  });

  it('parses paginated response envelope', () => {
    const parsed = PaginatedResponseSchema.parse({
      success: true,
      data: [{ id: 'site-1' }, { id: 'site-2' }],
      pagination: {
        page: 1,
        pageSize: 2,
        totalItems: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
      meta,
    });

    expect(parsed.data).toHaveLength(2);
    expect(parsed.pagination.totalItems).toBe(2);
  });
});

describe('HealthCheckResponseSchema', () => {
  it('defines health status constants', () => {
    expect(SERVICE_HEALTH_STATUS.HEALTHY).toBe('healthy');
    expect(SERVICE_HEALTH_STATUS.DEGRADED).toBe('degraded');
    expect(SERVICE_HEALTH_STATUS.UNHEALTHY).toBe('unhealthy');
  });

  it('parses service health payload', () => {
    const parsed = ServiceHealthSchema.parse({
      service: 'recipe-executor',
      status: 'healthy',
      version: '1.0.0',
      uptimeSeconds: 12345,
      timestamp: new Date().toISOString(),
      dependencies: [{ name: 'kafka', status: 'healthy', latencyMs: 12 }],
    });

    expect(parsed.service).toBe('recipe-executor');
    expect(parsed.dependencies).toHaveLength(1);
  });

  it('parses health-check response envelope', () => {
    const parsed = HealthCheckResponseSchema.parse({
      success: true,
      data: {
        status: 'healthy',
        services: [
          {
            service: 'mission-control',
            status: 'healthy',
            version: '1.0.0',
            uptimeSeconds: 54321,
            timestamp: new Date().toISOString(),
          },
        ],
      },
      meta: {
        requestId: 'req-health',
        timestamp: new Date().toISOString(),
      },
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data.services[0]?.service).toBe('mission-control');
  });
});
