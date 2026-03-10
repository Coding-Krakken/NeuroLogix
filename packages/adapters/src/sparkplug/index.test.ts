import { describe, expect, it } from 'vitest';
import { SparkplugEdgeIngestionAdapter } from './index.js';

describe('SparkplugEdgeIngestionAdapter', () => {
  it('normalizes canonical DDATA payload into telemetry points', () => {
    const adapter = new SparkplugEdgeIngestionAdapter();

    const result = adapter.ingest('spBv1.0/demo-line/DDATA/edge-01/conveyor-01', {
      timestamp: 1700000000000,
      seq: 7,
      metrics: [
        {
          name: 'throughput',
          timestamp: 1700000000000,
          datatype: 'Float',
          value: 124.2,
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.groupId).toBe('demo-line');
    expect(result.value.points).toHaveLength(1);
    expect(result.value.points[0].tagName).toBe('throughput');
    expect(result.value.points[0].value).toBe(124.2);
  });

  it('rejects malformed payloads deterministically', () => {
    const adapter = new SparkplugEdgeIngestionAdapter();

    const result = adapter.ingest('spBv1.0/demo-line/DDATA/edge-01/conveyor-01', {
      timestamp: 1700000000000,
      metrics: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('INVALID_PAYLOAD');
  });

  it('rejects unsupported message types in bounded slice', () => {
    const adapter = new SparkplugEdgeIngestionAdapter();

    const result = adapter.ingest('spBv1.0/demo-line/NBIRTH/edge-01', {
      timestamp: 1700000000000,
      seq: 0,
      metrics: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('UNSUPPORTED_MESSAGE_TYPE');
  });

  it('tracks disconnect and reconnect transitions deterministically', () => {
    const adapter = new SparkplugEdgeIngestionAdapter();

    expect(adapter.getConnectionState()).toBe('disconnected');

    adapter.transitionConnection('connect', new Date('2026-03-10T10:00:00.000Z'));
    adapter.transitionConnection('disconnect', new Date('2026-03-10T10:01:00.000Z'));
    adapter.transitionConnection('reconnect-start', new Date('2026-03-10T10:01:05.000Z'));
    adapter.transitionConnection('reconnect-success', new Date('2026-03-10T10:01:08.000Z'));

    expect(adapter.getConnectionState()).toBe('connected');

    const history = adapter.getConnectionHistory();
    expect(history).toHaveLength(4);
    expect(history.map(transition => transition.state)).toEqual([
      'connected',
      'disconnected',
      'reconnecting',
      'connected',
    ]);
    expect(history[1].previousState).toBe('connected');
    expect(history[2].event).toBe('reconnect-start');
  });
});