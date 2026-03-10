import { z } from 'zod';

/**
 * Telemetry schemas for real-time data collection and processing
 */

// Asset types enum for validation
export const ASSET_TYPES = {
  PLC: 'plc',
  CAMERA: 'camera',
  SENSOR: 'sensor',
  CONVEYOR: 'conveyor',
  ROBOT: 'robot',
  DOCK: 'dock',
  WORKSTATION: 'workstation',
} as const;

// Asset status enum (canonical exported version lives in assets/index.ts)
const ASSET_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  ERROR: 'error',
} as const;

// Data quality enum
export const DATA_QUALITY = {
  GOOD: 'good',
  BAD: 'bad',
  UNCERTAIN: 'uncertain',
} as const;

// Base telemetry point schema
export const TelemetryPointSchema = z.object({
  tagName: z.string().min(1).max(200),
  value: z.union([z.string(), z.number(), z.boolean()]),
  timestamp: z.date(),
  quality: z.nativeEnum(DATA_QUALITY).default('good'),
  source: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TelemetryPoint = z.infer<typeof TelemetryPointSchema>;

// Asset telemetry with structured context
export const AssetTelemetrySchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.nativeEnum(ASSET_TYPES),
  zone: z.string().min(1),
  timestamp: z.date(),
  points: z.array(TelemetryPointSchema),
  sessionId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
});

export type AssetTelemetry = z.infer<typeof AssetTelemetrySchema>;

// PLC telemetry specific schema
export const PlcTelemetrySchema = AssetTelemetrySchema.extend({
  assetType: z.literal('plc'),
  points: z.array(
    TelemetryPointSchema.extend({
      dataType: z.enum([
        'BOOL',
        'SINT',
        'INT',
        'DINT',
        'LINT',
        'USINT',
        'UINT',
        'UDINT',
        'ULINT',
        'REAL',
        'LREAL',
        'STRING',
        'TIME',
        'DATE',
      ]),
      address: z.string(), // PLC address (e.g., "%MW100", "%I0.0")
      scaling: z
        .object({
          factor: z.number(),
          offset: z.number(),
          units: z.string(),
        })
        .optional(),
    })
  ),
  plcInfo: z.object({
    stationName: z.string(),
    rackSlot: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    protocol: z.enum(['ethernet_ip', 'modbus_tcp', 'profinet', 's7']),
  }),
});

export type PlcTelemetry = z.infer<typeof PlcTelemetrySchema>;

// Camera telemetry for computer vision
export const CameraTelemetrySchema = AssetTelemetrySchema.extend({
  assetType: z.literal('camera'),
  points: z.array(
    TelemetryPointSchema.extend({
      frameId: z.string().optional(),
      roi: z
        .object({
          // Region of Interest
          x: z.number().min(0),
          y: z.number().min(0),
          width: z.number().min(1),
          height: z.number().min(1),
        })
        .optional(),
    })
  ),
  cameraInfo: z.object({
    resolution: z.object({
      width: z.number().min(1),
      height: z.number().min(1),
    }),
    fps: z.number().min(1).max(120),
    codec: z.enum(['h264', 'h265', 'mjpeg', 'raw']),
    streamUrl: z.string().url().optional(),
  }),
});

export type CameraTelemetry = z.infer<typeof CameraTelemetrySchema>;

// Sensor telemetry schema
export const SensorTelemetrySchema = AssetTelemetrySchema.extend({
  assetType: z.literal('sensor'),
  points: z.array(
    TelemetryPointSchema.extend({
      sensorType: z.enum([
        'temperature',
        'pressure',
        'flow',
        'level',
        'ph',
        'conductivity',
        'vibration',
        'proximity',
        'photoelectric',
        'load_cell',
      ]),
      range: z
        .object({
          min: z.number(),
          max: z.number(),
          units: z.string(),
        })
        .optional(),
      calibration: z
        .object({
          lastCalibrated: z.date(),
          nextCalibration: z.date(),
          certificateId: z.string().optional(),
        })
        .optional(),
    })
  ),
});

export type SensorTelemetry = z.infer<typeof SensorTelemetrySchema>;

// Conveyor telemetry schema
export const ConveyorTelemetrySchema = AssetTelemetrySchema.extend({
  assetType: z.literal('conveyor'),
  points: z.array(
    TelemetryPointSchema.extend({
      metric: z.enum([
        'speed',
        'load',
        'tension',
        'alignment',
        'motor_current',
        'motor_temp',
        'bearing_temp',
        'vibration',
      ]),
      section: z.string().optional(), // Conveyor section identifier
    })
  ),
  conveyorInfo: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    maxSpeed: z.number().positive(),
    direction: z.enum(['forward', 'reverse', 'bidirectional']),
    type: z.enum(['belt', 'roller', 'chain', 'screw', 'pneumatic']),
  }),
});

export type ConveyorTelemetry = z.infer<typeof ConveyorTelemetrySchema>;

// Robot telemetry schema
export const RobotTelemetrySchema = AssetTelemetrySchema.extend({
  assetType: z.literal('robot'),
  points: z.array(
    TelemetryPointSchema.extend({
      joint: z.number().min(1).max(8).optional(), // Joint number for articulated robots
      coordinate: z.enum(['x', 'y', 'z', 'rx', 'ry', 'rz']).optional(),
      metric: z.enum([
        'position',
        'velocity',
        'acceleration',
        'torque',
        'current',
        'temperature',
        'force',
      ]),
    })
  ),
  robotInfo: z.object({
    model: z.string(),
    serialNumber: z.string(),
    payload: z.number().positive(), // Maximum payload in kg
    reach: z.number().positive(), // Maximum reach in mm
    axes: z.number().min(3).max(8),
    type: z.enum(['articulated', 'scara', 'delta', 'cartesian', 'collaborative']),
  }),
});

export type RobotTelemetry = z.infer<typeof RobotTelemetrySchema>;

// Dock/workstation telemetry
export const WorkstationTelemetrySchema = AssetTelemetrySchema.extend({
  assetType: z.enum(['dock', 'workstation']),
  points: z.array(
    TelemetryPointSchema.extend({
      station: z.string().optional(), // Station or bay identifier
      metric: z.enum(['occupancy', 'cycle_time', 'throughput', 'error_count', 'quality_score']),
    })
  ),
  workstationInfo: z.object({
    capacity: z.number().positive().optional(),
    cycleTime: z.number().positive().optional(), // Expected cycle time in seconds
    qualityTarget: z.number().min(0).max(1).optional(), // Quality target as percentage
  }),
});

export type WorkstationTelemetry = z.infer<typeof WorkstationTelemetrySchema>;

// Aggregated telemetry batch for efficient processing
export const TelemetryBatchSchema = z.object({
  batchId: z.string().uuid(),
  timestamp: z.date(),
  source: z.string().min(1),
  assets: z.array(AssetTelemetrySchema),
  metadata: z.object({
    totalPoints: z.number().min(0),
    processingTime: z.number().min(0).optional(),
    compression: z.enum(['none', 'gzip', 'lz4']).optional(),
  }),
});

export type TelemetryBatch = z.infer<typeof TelemetryBatchSchema>;

// Real-time telemetry stream message
export const TelemetryStreamMessageSchema = z.object({
  messageId: z.string().uuid(),
  timestamp: z.date(),
  messageType: z.enum(['point', 'batch', 'status', 'alarm']),
  payload: z.union([
    TelemetryPointSchema,
    AssetTelemetrySchema,
    TelemetryBatchSchema,
    z.record(z.string(), z.unknown()), // Status or alarm payload
  ]),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
});

export type TelemetryStreamMessage = z.infer<typeof TelemetryStreamMessageSchema>;

// Telemetry subscription filter
export const TelemetrySubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  filters: z.object({
    assetIds: z.array(z.string().uuid()).optional(),
    assetTypes: z.array(z.nativeEnum(ASSET_TYPES)).optional(),
    zones: z.array(z.string()).optional(),
    tagNames: z.array(z.string()).optional(),
    quality: z.array(z.nativeEnum(DATA_QUALITY)).optional(),
  }),
  options: z.object({
    minInterval: z.number().min(0).optional(), // Minimum interval between updates in ms
    maxBatchSize: z.number().min(1).max(1000).default(100),
    compression: z.boolean().default(false),
    includeMetadata: z.boolean().default(true),
  }),
  webhook: z
    .object({
      url: z.string().url(),
      headers: z.record(z.string(), z.string()).optional(),
      retries: z.number().min(0).max(5).default(3),
    })
    .optional(),
});

export type TelemetrySubscription = z.infer<typeof TelemetrySubscriptionSchema>;

// Historical telemetry query
export const TelemetryQuerySchema = z.object({
  queryId: z.string().uuid(),
  timeRange: z.object({
    start: z.date(),
    end: z.date(),
  }),
  filters: TelemetrySubscriptionSchema.shape.filters,
  aggregation: z
    .object({
      interval: z.enum([
        '1s',
        '5s',
        '10s',
        '30s',
        '1m',
        '5m',
        '15m',
        '30m',
        '1h',
        '6h',
        '12h',
        '1d',
      ]),
      functions: z.array(z.enum(['avg', 'min', 'max', 'sum', 'count', 'stddev', 'first', 'last'])),
    })
    .optional(),
  limit: z.number().min(1).max(100000).default(10000),
  offset: z.number().min(0).default(0),
});

export type TelemetryQuery = z.infer<typeof TelemetryQuerySchema>;
