/**
 * @fileoverview Asset schemas for industrial equipment
 */

// Placeholder - will be implemented in Phase 2
/**
 * @fileoverview Canonical asset schemas for NeuroLogix ICS industrial equipment
 *
 * Assets are the physical and logical equipment entities (PLCs, conveyors, cameras,
 * sensors, robots, docks, etc.) that form the industrial automation substrate.
 * AssetSchema is the canonical record; telemetry and maintenance windows extend it.
 *
 * Model ref: system_state_model.yaml / data_state_model.yaml
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Enumerations
// ─────────────────────────────────────────────────────────────────────────────

export const ASSET_TYPE = {
	PLC: 'plc',
	CAMERA: 'camera',
	SENSOR: 'sensor',
	CONVEYOR: 'conveyor',
	ROBOT: 'robot',
	DOCK: 'dock',
	WORKSTATION: 'workstation',
	AGV: 'agv',
	RFID_READER: 'rfid_reader',
} as const;

export type AssetType = (typeof ASSET_TYPE)[keyof typeof ASSET_TYPE];
export const AssetTypeSchema = z.enum([
	'plc',
	'camera',
	'sensor',
	'conveyor',
	'robot',
	'dock',
	'workstation',
	'agv',
	'rfid_reader',
]);

export const ASSET_STATUS = {
	ONLINE: 'online',
	OFFLINE: 'offline',
	MAINTENANCE: 'maintenance',
	ERROR: 'error',
	COMMISSIONING: 'commissioning',
	DECOMMISSIONED: 'decommissioned',
} as const;

export type AssetStatus = (typeof ASSET_STATUS)[keyof typeof ASSET_STATUS];
export const AssetStatusSchema = z.enum([
	'online',
	'offline',
	'maintenance',
	'error',
	'commissioning',
	'decommissioned',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Core Asset Schema
// ─────────────────────────────────────────────────────────────────────────────

export const AssetSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	type: AssetTypeSchema,
	description: z.string().optional(),
	// Location
	zone: z.string().min(1),
	siteId: z.string().optional(),
	lineId: z.string().optional(),
	// Identity
	serialNumber: z.string().optional(),
	manufacturer: z.string().optional(),
	model: z.string().optional(),
	firmwareVersion: z.string().optional(),
	// Status
	status: AssetStatusSchema.default('online'),
	lastSeen: z.string().datetime().optional(),
	// Connectivity
	ipAddress: z.string().optional(),
	plcAddress: z.string().optional(),
	mqttTopic: z.string().optional(),
	// Metadata
	tags: z.array(z.string()).default([]),
	metadata: z.record(z.unknown()).default({}),
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Asset Telemetry Link
// ─────────────────────────────────────────────────────────────────────────────

export const AssetTelemetryLinkSchema = z.object({
	assetId: z.string().uuid(),
	siteId: z.string().optional(),
	topics: z.array(z.string()).min(1),
	samplingIntervalMs: z.number().int().min(100).default(1000),
	metadata: z.record(z.unknown()).default({}),
});

export type AssetTelemetryLink = z.infer<typeof AssetTelemetryLinkSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Asset Maintenance Window
// ─────────────────────────────────────────────────────────────────────────────

export const AssetMaintenanceWindowSchema = z.object({
	assetId: z.string().uuid(),
	siteId: z.string().optional(),
	scheduledStart: z.string().datetime(),
	scheduledEnd: z.string().datetime(),
	reason: z.string().min(1),
	type: z.enum(['planned', 'emergency', 'calibration', 'firmware_upgrade']).default('planned'),
	scheduledBy: z.string().min(1),
	notes: z.string().optional(),
	metadata: z.record(z.unknown()).default({}),
});

export type AssetMaintenanceWindow = z.infer<typeof AssetMaintenanceWindowSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Asset Query
// ─────────────────────────────────────────────────────────────────────────────

export const AssetQuerySchema = z.object({
	type: AssetTypeSchema.optional(),
	status: AssetStatusSchema.optional(),
	zone: z.string().optional(),
	siteId: z.string().optional(),
	lineId: z.string().optional(),
	tags: z.array(z.string()).optional(),
	limit: z.number().int().min(1).max(1000).default(50),
	offset: z.number().int().min(0).default(0),
});

export type AssetQuery = z.infer<typeof AssetQuerySchema>;
