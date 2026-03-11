import { describe, expect, it } from 'vitest';
import {
  BROKER_TOPIC_CONTRACTS,
  DataMessageSchema,
  TelemetryPointSchema,
  WmsWcsDispatchCommandSchema,
  parseSparkplugTopic,
} from '@neurologix/schemas';
import { SparkplugEdgeIngestionAdapter } from '../sparkplug/index.js';
import { WmsWcsCommandIngestionAdapter } from '../wms-wcs/index.js';

describe('Broker consumer contract boundaries', () => {
  it('ingests canonical Sparkplug contract topic and schema-valid payload', () => {
    const contractTopic = BROKER_TOPIC_CONTRACTS.find(
      contract => contract.backend === 'mqtt-sparkplug'
    );

    expect(contractTopic).toBeDefined();
    if (!contractTopic || contractTopic.backend !== 'mqtt-sparkplug') {
      return;
    }

    const parsedTopic = parseSparkplugTopic(contractTopic.topic);
    expect(parsedTopic).not.toBeNull();

    const payload = DataMessageSchema.parse({
      timestamp: 1700000000000,
      seq: 9,
      metrics: [
        {
          name: 'throughput.units_per_min',
          timestamp: 1700000000000,
          datatype: 'Float',
          value: 138.5,
        },
        {
          name: 'fault.jam_detected',
          timestamp: 1700000000000,
          datatype: 'Boolean',
          value: false,
        },
      ],
    });

    const adapter = new SparkplugEdgeIngestionAdapter();
    const result = adapter.ingest(contractTopic.topic, payload);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.groupId).toBe('line-a');
    expect(result.value.edgeNodeId).toBe('plc-01');
    expect(result.value.deviceId).toBe('conveyor-01');
    expect(result.value.points).toHaveLength(2);

    for (const point of result.value.points) {
      const validation = TelemetryPointSchema.safeParse(point);
      expect(validation.success).toBe(true);
    }
  });

  it('rejects Sparkplug payloads that violate canonical DataMessage schema', () => {
    const adapter = new SparkplugEdgeIngestionAdapter();

    const result = adapter.ingest('spBv1.0/line-a/DDATA/plc-01/conveyor-01', {
      timestamp: 1700000000000,
      metrics: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('INVALID_PAYLOAD');
  });

  it('rejects Sparkplug topics outside canonical topic contract shape', () => {
    const adapter = new SparkplugEdgeIngestionAdapter();

    const result = adapter.ingest('spBv1.0/line-a/INVALID/plc-01', {
      timestamp: 1700000000000,
      seq: 1,
      metrics: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('INVALID_TOPIC');
  });

  it('ingests schema-valid WMS/WCS dispatch command with deterministic key', () => {
    const rawCommand = {
      sourceSystem: 'wms',
      commandId: 'cmd-133',
      correlationId: 'corr-133',
      commandType: 'allocate_pick',
      facilityId: 'facility-a',
      targetId: 'order-133',
      requestedAt: '2026-03-11T10:00:00.000Z',
    };

    const validatedCommand = WmsWcsDispatchCommandSchema.parse(rawCommand);
    const adapter = new WmsWcsCommandIngestionAdapter();
    const result = adapter.ingest(rawCommand);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.source).toBe('wms-wcs');
    expect(result.value.idempotencyKey).toBe('wms:corr-133');
    expect(result.value.command).toEqual(validatedCommand);
  });

  it('rejects WMS/WCS commands that violate dispatch contract schema', () => {
    const adapter = new WmsWcsCommandIngestionAdapter();

    const result = adapter.ingest({
      sourceSystem: 'wms',
      commandId: 'cmd-133',
      requestedAt: '2026-03-11T10:00:00.000Z',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('INVALID_COMMAND');
  });
});
