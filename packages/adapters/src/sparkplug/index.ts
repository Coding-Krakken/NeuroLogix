import { z } from 'zod';
import {
  DataMessageSchema,
  parseSparkplugTopic,
  TelemetryPoint,
  TelemetryPointSchema,
} from '@neurologix/schemas';

export type SparkplugConnectionState = 'disconnected' | 'connected' | 'reconnecting';

export type SparkplugConnectionEvent =
  | 'connect'
  | 'disconnect'
  | 'reconnect-start'
  | 'reconnect-success';

export type SparkplugIngestionErrorCode =
  | 'INVALID_TOPIC'
  | 'UNSUPPORTED_MESSAGE_TYPE'
  | 'INVALID_PAYLOAD'
  | 'NO_VALID_METRICS';

const SparkplugNormalizedMessageSchema = z.object({
  source: z.literal('sparkplug-mqtt'),
  topic: z.string().min(1),
  groupId: z.string().min(1),
  edgeNodeId: z.string().min(1),
  deviceId: z.string().min(1).optional(),
  sequence: z.number().int().min(0).max(255),
  timestamp: z.date(),
  points: z.array(TelemetryPointSchema).min(1),
});

export type SparkplugNormalizedMessage = z.infer<typeof SparkplugNormalizedMessageSchema>;

export type SparkplugIngestionResult =
  | {
      ok: true;
      value: SparkplugNormalizedMessage;
    }
  | {
      ok: false;
      error: {
        code: SparkplugIngestionErrorCode;
        message: string;
      };
    };

export interface SparkplugConnectionTransition {
  previousState: SparkplugConnectionState;
  state: SparkplugConnectionState;
  event: SparkplugConnectionEvent;
  timestamp: Date;
}

export class SparkplugEdgeIngestionAdapter {
  private connectionState: SparkplugConnectionState = 'disconnected';
  private readonly transitions: SparkplugConnectionTransition[] = [];

  getConnectionState(): SparkplugConnectionState {
    return this.connectionState;
  }

  getConnectionHistory(): SparkplugConnectionTransition[] {
    return [...this.transitions];
  }

  transitionConnection(
    event: SparkplugConnectionEvent,
    timestamp: Date = new Date()
  ): SparkplugConnectionTransition {
    const previousState = this.connectionState;

    switch (event) {
      case 'connect':
        this.connectionState = 'connected';
        break;
      case 'disconnect':
        this.connectionState = 'disconnected';
        break;
      case 'reconnect-start':
        this.connectionState = 'reconnecting';
        break;
      case 'reconnect-success':
        this.connectionState = 'connected';
        break;
    }

    const transition: SparkplugConnectionTransition = {
      previousState,
      state: this.connectionState,
      event,
      timestamp,
    };

    this.transitions.push(transition);
    return transition;
  }

  ingest(topic: string, payload: unknown): SparkplugIngestionResult {
    const parsedTopic = parseSparkplugTopic(topic);
    if (!parsedTopic) {
      return {
        ok: false,
        error: {
          code: 'INVALID_TOPIC',
          message: 'Topic does not match Sparkplug namespace and structure.',
        },
      };
    }

    if (parsedTopic.messageType !== 'DDATA') {
      return {
        ok: false,
        error: {
          code: 'UNSUPPORTED_MESSAGE_TYPE',
          message: `Only DDATA is supported in this bounded slice, received ${parsedTopic.messageType}.`,
        },
      };
    }

    const parsedPayload = DataMessageSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return {
        ok: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Payload failed Sparkplug data-message schema validation.',
        },
      };
    }

    const points = (parsedPayload.data.metrics ?? []).flatMap(metric => {
      const primitiveValue = metric.value;
      if (
        primitiveValue === undefined ||
        primitiveValue === null ||
        (typeof primitiveValue !== 'string' &&
          typeof primitiveValue !== 'number' &&
          typeof primitiveValue !== 'boolean')
      ) {
        return [];
      }

      const candidatePoint: TelemetryPoint = {
        tagName: metric.name,
        value: primitiveValue,
        timestamp: new Date(metric.timestamp),
        quality: 'good',
        source: `sparkplug:${parsedTopic.groupId}/${parsedTopic.edgeNodeId}${parsedTopic.deviceId ? `/${parsedTopic.deviceId}` : ''}`,
        metadata: {
          datatype: metric.datatype,
          alias: metric.alias,
        },
      };

      const parsedPoint = TelemetryPointSchema.safeParse(candidatePoint);
      return parsedPoint.success ? [parsedPoint.data] : [];
    });

    if (points.length === 0) {
      return {
        ok: false,
        error: {
          code: 'NO_VALID_METRICS',
          message: 'Payload contained no normalizable primitive metrics.',
        },
      };
    }

    return {
      ok: true,
      value: SparkplugNormalizedMessageSchema.parse({
        source: 'sparkplug-mqtt',
        topic,
        groupId: parsedTopic.groupId,
        edgeNodeId: parsedTopic.edgeNodeId,
        deviceId: parsedTopic.deviceId,
        sequence: parsedPayload.data.seq,
        timestamp: new Date(parsedPayload.data.timestamp),
        points,
      }),
    };
  }
}