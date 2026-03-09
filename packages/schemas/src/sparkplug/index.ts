import { z } from 'zod';

/**
 * MQTT Sparkplug B schemas for industrial IoT communication
 * Based on Eclipse Sparkplug Specification v3.0
 */

// Sparkplug B Data Types
export const SparkplugDataType = z.enum([
  'Unknown',
  'Int8',
  'Int16',
  'Int32',
  'Int64',
  'UInt8',
  'UInt16',
  'UInt32',
  'UInt64',
  'Float',
  'Double',
  'Boolean',
  'String',
  'DateTime',
  'Text',
  'UUID',
  'DataSet',
  'Bytes',
  'File',
  'Template',
  'PropertySet',
  'PropertySetList',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Int64Array',
  'UInt8Array',
  'UInt16Array',
  'UInt32Array',
  'UInt64Array',
  'FloatArray',
  'DoubleArray',
  'BooleanArray',
  'StringArray',
  'DateTimeArray',
]);

export type SparkplugDataType = z.infer<typeof SparkplugDataType>;

// Sparkplug Metric
export const SparkplugMetricSchema = z.object({
  name: z.string().min(1),
  alias: z.number().optional(),
  timestamp: z.number(), // Unix timestamp in milliseconds
  datatype: SparkplugDataType,
  value: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.unknown()),
      z.record(z.string(), z.unknown()),
      z.null(),
    ])
    .optional(),
  metadata: z
    .object({
      isHistorical: z.boolean().optional(),
      isTransient: z.boolean().optional(),
      isNull: z.boolean().optional(),
      description: z.string().optional(),
      engUnit: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().optional(),
      precision: z.number().optional(),
    })
    .optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export type SparkplugMetric = z.infer<typeof SparkplugMetricSchema>;

// Sparkplug Payload
export const SparkplugPayloadSchema = z.object({
  timestamp: z.number(), // Unix timestamp in milliseconds
  metrics: z.array(SparkplugMetricSchema),
  seq: z.number().min(0).max(255), // Sequence number for message ordering
  uuid: z.string().optional(), // Session UUID for MQTT persistence
  body: z.instanceof(Buffer).optional(), // Binary payload
});

export type SparkplugPayload = z.infer<typeof SparkplugPayloadSchema>;

// Sparkplug Message Types
export const SparkplugMessageType = z.enum([
  'NBIRTH', // Node Birth Certificate
  'NDEATH', // Node Death Certificate
  'DBIRTH', // Device Birth Certificate
  'DDEATH', // Device Death Certificate
  'NDATA', // Node Data
  'DDATA', // Device Data
  'NCMD', // Node Command
  'DCMD', // Device Command
  'STATE', // Primary Application State
]);

export type SparkplugMessageType = z.infer<typeof SparkplugMessageType>;

// Sparkplug Topic Structure
export const SparkplugTopicSchema = z.object({
  namespace: z.literal('spBv1.0'), // Sparkplug B version 1.0
  groupId: z.string().min(1),
  messageType: SparkplugMessageType,
  edgeNodeId: z.string().min(1),
  deviceId: z.string().optional(), // Only for device messages
});

export type SparkplugTopic = z.infer<typeof SparkplugTopicSchema>;

// Node Birth Certificate (NBIRTH)
export const NodeBirthSchema = SparkplugPayloadSchema.extend({
  metrics: z.array(
    SparkplugMetricSchema.extend({
      name: z
        .enum([
          'bdSeq', // Birth/Death Sequence Number
          'Node Control/Rebirth', // Node rebirth command
          'Node Control/Reboot', // Node reboot command
          'Node Control/Next Server', // Next server command
          'Node Control/Scan Rate', // Scan rate control
        ])
        .or(z.string()), // Allow custom metrics
    })
  ),
});

export type NodeBirth = z.infer<typeof NodeBirthSchema>;

// Device Birth Certificate (DBIRTH)
export const DeviceBirthSchema = SparkplugPayloadSchema.extend({
  metrics: z.array(
    SparkplugMetricSchema.extend({
      name: z.string().min(1), // Device-specific metric names
    })
  ),
});

export type DeviceBirth = z.infer<typeof DeviceBirthSchema>;

// Node/Device Data (NDATA/DDATA)
export const DataMessageSchema = SparkplugPayloadSchema.extend({
  metrics: z.array(SparkplugMetricSchema).optional(), // May be empty for keep-alive
});

export type DataMessage = z.infer<typeof DataMessageSchema>;

// Command Message (NCMD/DCMD)
export const CommandMessageSchema = SparkplugPayloadSchema.extend({
  metrics: z.array(
    SparkplugMetricSchema.extend({
      value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    })
  ),
});

export type CommandMessage = z.infer<typeof CommandMessageSchema>;

// Death Certificate (NDEATH/DDEATH)
export const DeathCertificateSchema = z.object({
  timestamp: z.number(),
  seq: z.number().min(0).max(255),
});

export type DeathCertificate = z.infer<typeof DeathCertificateSchema>;

// Primary Application State
export const StateMessageSchema = z.object({
  online: z.boolean(),
  timestamp: z.number(),
});

export type StateMessage = z.infer<typeof StateMessageSchema>;

// Quality Codes (based on OPC UA status codes)
export const QualityCode = z.enum([
  'GOOD',
  'GOOD_CLAMPED',
  'GOOD_ENGINEERING_UNIT_EXCEEDED',
  'GOOD_INITIAL_VALUE',
  'GOOD_LOCAL_OVERRIDE',
  'GOOD_NON_CASCADE_INITIATED',
  'GOOD_NON_CASCADE_NOT_INVERTED',
  'GOOD_NON_CASCADE_NOT_LIMITED',
  'UNCERTAIN',
  'UNCERTAIN_DATA_SUB_NORMAL',
  'UNCERTAIN_ENGINEERING_UNIT_EXCEEDED',
  'UNCERTAIN_INITIAL_VALUE',
  'UNCERTAIN_LAST_USABLE_VALUE',
  'UNCERTAIN_SENSOR_NOT_ACCURATE',
  'UNCERTAIN_SUB_NORMAL',
  'BAD',
  'BAD_AGGREGRATE_LIST_MISMATCH',
  'BAD_BOUNDS_NOT_SUPPORTED',
  'BAD_CLAMP_NOT_SUPPORTED',
  'BAD_COMM_FAILURE',
  'BAD_CONFIG_ERROR',
  'BAD_DEVICE_FAILURE',
  'BAD_ENG_UNIT_RANGE_EXCEEDED',
  'BAD_FILTER_NOT_ALLOWED',
  'BAD_LAST_KNOWN_VALUE',
  'BAD_NO_DATA',
  'BAD_NOT_CONNECTED',
  'BAD_OUT_OF_MEMORY',
  'BAD_OUT_OF_SERVICE',
  'BAD_REFERENCE_TYPE_NOT_SUPPORTED',
  'BAD_SENSOR_FAILURE',
  'BAD_TYPE_MISMATCH',
]);

export type QualityCode = z.infer<typeof QualityCode>;

// Enhanced Metric with Quality
export const EnhancedSparkplugMetricSchema = SparkplugMetricSchema.extend({
  quality: QualityCode.optional(),
  metadata: SparkplugMetricSchema.shape.metadata
    .unwrap()
    .extend({
      quality: QualityCode.optional(),
      sourceTimestamp: z.number().optional(),
      serverTimestamp: z.number().optional(),
    })
    .optional(),
});

export type EnhancedSparkplugMetric = z.infer<typeof EnhancedSparkplugMetricSchema>;

// Utility functions for Sparkplug
export function createSparkplugTopic(
  groupId: string,
  messageType: SparkplugMessageType,
  edgeNodeId: string,
  deviceId?: string
): string {
  const parts = ['spBv1.0', groupId, messageType, edgeNodeId];
  if (deviceId && (messageType.startsWith('D') || messageType === 'DCMD')) {
    parts.push(deviceId);
  }
  return parts.join('/');
}

export function parseSparkplugTopic(topic: string): SparkplugTopic | null {
  const parts = topic.split('/');
  if (parts.length < 4 || parts[0] !== 'spBv1.0') {
    return null;
  }

  try {
    const parsed: SparkplugTopic = {
      namespace: 'spBv1.0',
      groupId: parts[1],
      messageType: parts[2] as SparkplugMessageType,
      edgeNodeId: parts[3],
      deviceId: parts[4] || undefined,
    };

    return SparkplugTopicSchema.parse(parsed);
  } catch {
    return null;
  }
}
