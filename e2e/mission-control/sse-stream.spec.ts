/**
 * E2E — Mission Control: SSE Stream
 *
 * Validates the Server-Sent Events stream endpoint:
 * - Content-Type is text/event-stream
 * - Initial snapshot event is delivered
 * - Once mode terminates the stream properly
 *
 * Invariant coverage:
 *   INV-008 — Mission Control SSE stream recovers within 5s of disconnect
 * Model ref: TEST-TRACE-001
 */
import { test, expect } from '../fixtures/base.fixture';

test.describe('Mission Control — SSE Stream (INV-008)', () => {
  test('GET /api/stream?once=true returns text/event-stream with snapshot', async ({
    request,
    baseURL,
  }) => {
    // Use once=true to get a single snapshot frame without holding the connection open
    const response = await request.get(`${baseURL}/api/stream?once=true`, {
      headers: { Accept: 'text/event-stream' },
    });

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/event-stream');

    const body = await response.text();
    // SSE response must contain an "event: snapshot" frame
    expect(body).toContain('event: snapshot');
    // Data field must contain valid JSON payload
    expect(body).toContain('data: {');
  });

  test('SSE snapshot frame contains commandCenter and lineView fields', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/api/stream?once=true`, {
      headers: { Accept: 'text/event-stream' },
    });

    const body = await response.text();

    // Extract the data line from the SSE frame
    const dataLine = body
      .split('\n')
      .find(line => line.startsWith('data: '));

    expect(dataLine).toBeDefined();

    const jsonStr = dataLine!.replace(/^data: /, '');
    let parsed: unknown;
    expect(() => {
      parsed = JSON.parse(jsonStr);
    }).not.toThrow();

    const payload = parsed as Record<string, unknown>;
    expect(payload).toHaveProperty('commandCenter');
    expect(payload).toHaveProperty('lineView');
    expect(payload).toHaveProperty('events');
  });

  test('INV-008: multiple consecutive SSE requests all succeed (reconnect simulation)', async ({
    request,
    baseURL,
  }) => {
    // Simulate 5 rapid reconnects — all must succeed to satisfy INV-008 recovery SLO
    const results: number[] = [];

    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      const response = await request.get(`${baseURL}/api/stream?once=true`, {
        headers: { Accept: 'text/event-stream' },
      });
      const elapsed = performance.now() - start;

      expect(response.status()).toBe(200);
      results.push(elapsed);
    }

    // All 5 reconnects should complete within 5s (INV-008: 5s recovery SLO)
    const maxReconnectMs = Math.max(...results);
    expect(maxReconnectMs).toBeLessThan(5000);
  });

  test('SSE cache control headers prevent stale stream data', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/api/stream?once=true`, {
      headers: { Accept: 'text/event-stream' },
    });

    const cacheControl = response.headers()['cache-control'] ?? '';
    expect(cacheControl).toContain('no-cache');
  });
});
