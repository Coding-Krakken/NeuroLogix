/**
 * @fileoverview Canonical API schemas for NeuroLogix service contracts
 *
 * Defines shared response envelopes, structured error payloads, pagination
 * metadata, and health-check responses used across REST/SSE surfaces.
 *
 * Model ref: contracts/*.yaml (API request/response/error schema families)
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// API Error Codes
// ─────────────────────────────────────────────────────────────────────────────

export const API_ERROR_CODE = {
	BAD_REQUEST: 'BAD_REQUEST',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	NOT_FOUND: 'NOT_FOUND',
	CONFLICT: 'CONFLICT',
	RATE_LIMITED: 'RATE_LIMITED',
	TIMEOUT: 'TIMEOUT',
	SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
	INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODE)[keyof typeof API_ERROR_CODE];
export const ApiErrorCodeSchema = z.enum([
	'BAD_REQUEST',
	'VALIDATION_ERROR',
	'UNAUTHORIZED',
	'FORBIDDEN',
	'NOT_FOUND',
	'CONFLICT',
	'RATE_LIMITED',
	'TIMEOUT',
	'SERVICE_UNAVAILABLE',
	'INTERNAL_ERROR',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Error Details
// ─────────────────────────────────────────────────────────────────────────────

export const ApiFieldErrorSchema = z.object({
	field: z.string().min(1),
	message: z.string().min(1),
	code: z.string().optional(),
});

export type ApiFieldError = z.infer<typeof ApiFieldErrorSchema>;

export const ApiErrorSchema = z.object({
	code: ApiErrorCodeSchema,
	message: z.string().min(1),
	details: z.record(z.unknown()).optional(),
	fieldErrors: z.array(ApiFieldErrorSchema).optional(),
	retryable: z.boolean().default(false),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Response Metadata
// ─────────────────────────────────────────────────────────────────────────────

export const ApiResponseMetaSchema = z.object({
	requestId: z.string().min(1),
	timestamp: z.string().datetime(),
	traceId: z.string().optional(),
	siteId: z.string().optional(),
	version: z.string().optional(),
});

export type ApiResponseMeta = z.infer<typeof ApiResponseMetaSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Response Envelopes
// ─────────────────────────────────────────────────────────────────────────────

export const ApiSuccessResponseSchema = z.object({
	success: z.literal(true),
	data: z.unknown(),
	meta: ApiResponseMetaSchema,
});

export type ApiSuccessResponse<T = unknown> = Omit<z.infer<typeof ApiSuccessResponseSchema>, 'data'> & {
	data: T;
};

export const ApiErrorResponseSchema = z.object({
	success: z.literal(false),
	error: ApiErrorSchema,
	meta: ApiResponseMetaSchema,
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export const ApiResponseSchema = z.discriminatedUnion('success', [
	ApiSuccessResponseSchema,
	ApiErrorResponseSchema,
]);

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

export const PaginationMetaSchema = z.object({
	page: z.number().int().min(1),
	pageSize: z.number().int().min(1).max(1000),
	totalItems: z.number().int().min(0),
	totalPages: z.number().int().min(0),
	hasNext: z.boolean(),
	hasPrevious: z.boolean(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const PaginatedResponseSchema = z.object({
	success: z.literal(true),
	data: z.array(z.unknown()),
	pagination: PaginationMetaSchema,
	meta: ApiResponseMetaSchema,
});

export type PaginatedResponse<T = unknown> = Omit<z.infer<typeof PaginatedResponseSchema>, 'data'> & {
	data: T[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────────────────────

export const SERVICE_HEALTH_STATUS = {
	HEALTHY: 'healthy',
	DEGRADED: 'degraded',
	UNHEALTHY: 'unhealthy',
} as const;

export type ServiceHealthStatus = (typeof SERVICE_HEALTH_STATUS)[keyof typeof SERVICE_HEALTH_STATUS];
export const ServiceHealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);

export const ServiceDependencySchema = z.object({
	name: z.string().min(1),
	status: ServiceHealthStatusSchema,
	latencyMs: z.number().min(0).optional(),
	message: z.string().optional(),
});

export type ServiceDependency = z.infer<typeof ServiceDependencySchema>;

export const ServiceHealthSchema = z.object({
	service: z.string().min(1),
	status: ServiceHealthStatusSchema,
	version: z.string().min(1),
	uptimeSeconds: z.number().min(0),
	timestamp: z.string().datetime(),
	dependencies: z.array(ServiceDependencySchema).default([]),
});

export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

export const HealthCheckResponseSchema = z.object({
	success: z.literal(true),
	data: z.object({
		status: ServiceHealthStatusSchema,
		services: z.array(ServiceHealthSchema),
	}),
	meta: ApiResponseMetaSchema,
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
