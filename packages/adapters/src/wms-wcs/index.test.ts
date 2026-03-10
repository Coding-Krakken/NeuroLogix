import { describe, expect, it, vi } from 'vitest';
import {
  WmsWcsCommandIngestionAdapter,
  WmsWcsDispatchService,
  WmsWcsDispatchExecutor,
} from './index.js';

describe('WmsWcsCommandIngestionAdapter', () => {
  it('normalizes valid commands with deterministic idempotency key', () => {
    const adapter = new WmsWcsCommandIngestionAdapter();

    const result = adapter.ingest({
      sourceSystem: 'wms',
      commandId: 'cmd-1',
      correlationId: 'corr-1',
      commandType: 'allocate_pick',
      facilityId: 'facility-a',
      targetId: 'order-100',
      requestedAt: '2026-03-10T12:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.source).toBe('wms-wcs');
    expect(result.value.idempotencyKey).toBe('wms:corr-1');
    expect(result.value.command.requestedAt.toISOString()).toBe('2026-03-10T12:00:00.000Z');
  });

  it('rejects invalid commands', () => {
    const adapter = new WmsWcsCommandIngestionAdapter();

    const result = adapter.ingest({
      sourceSystem: 'wms',
      commandId: 'cmd-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('INVALID_COMMAND');
  });
});

describe('WmsWcsDispatchService', () => {
  const validCommand = {
    sourceSystem: 'wcs' as const,
    commandId: 'cmd-2',
    commandType: 'reroute_container' as const,
    facilityId: 'facility-b',
    targetId: 'container-77',
    requestedAt: '2026-03-10T12:30:00.000Z',
  };

  it('handles duplicate command submission idempotently', async () => {
    const executor = vi
      .fn<WmsWcsDispatchExecutor>()
      .mockResolvedValue({ providerDispatchId: 'dispatch-1', acceptedAt: new Date() });
    const service = new WmsWcsDispatchService(executor);

    const first = await service.submit(validCommand);
    const second = await service.submit(validCommand);

    expect(first.status).toBe('dispatched');
    expect(second.status).toBe('duplicate');
    expect(executor).toHaveBeenCalledTimes(1);
    if (second.status !== 'duplicate') {
      return;
    }

    expect(second.originalResult.status).toBe('dispatched');
  });

  it('retries deterministically on transient failures before succeeding', async () => {
    const transientError = Object.assign(new Error('Upstream timeout'), {
      code: 'TRANSIENT_TIMEOUT',
    });

    const executor = vi
      .fn<WmsWcsDispatchExecutor>()
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce({ providerDispatchId: 'dispatch-2', acceptedAt: new Date() });

    const service = new WmsWcsDispatchService(executor, { maxRetries: 2 });

    const result = await service.submit(validCommand);

    expect(result.status).toBe('dispatched');
    if (result.status !== 'dispatched') {
      return;
    }

    expect(result.attempts).toBe(2);
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('routes terminal failures to dead-letter queue deterministically', async () => {
    const terminalError = Object.assign(new Error('Command not supported'), {
      code: 'TERMINAL_UNSUPPORTED',
    });

    const executor = vi.fn<WmsWcsDispatchExecutor>().mockRejectedValue(terminalError);
    const now = (): Date => new Date('2026-03-10T13:00:00.000Z');
    const service = new WmsWcsDispatchService(executor, { maxRetries: 3, now });

    const result = await service.submit(validCommand);

    expect(result.status).toBe('dead-letter');
    if (result.status !== 'dead-letter') {
      return;
    }

    expect(result.attempts).toBe(1);
    expect(executor).toHaveBeenCalledTimes(1);

    const deadLetters = service.getDeadLetterQueue();
    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0].classification).toBe('terminal');
    expect(deadLetters[0].failedAt.toISOString()).toBe('2026-03-10T13:00:00.000Z');
  });
});
