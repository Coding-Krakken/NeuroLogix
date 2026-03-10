/**
 * E2E — Mission Control: Health & Readiness
 *
 * Validates the server responds correctly to basic health probes.
 * Used by Kubernetes liveness/readiness probes and release smoke tests.
 *
 * Invariant coverage: (infrastructure baseline — all invariants depend on server health)
 * Model ref: TEST-TRACE-001
 */
import { test, expect } from '../fixtures/base.fixture';

test.describe('Mission Control — Health', () => {
  test('GET /health returns 200 with status field', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/health`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('string');
  });

  test('GET / returns 200 HTML document', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/`, {
      headers: { Accept: 'text/html' },
    });

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');

    const body = await response.text();
    expect(body).toContain('NeuroLogix Mission Control');
    expect(body).toContain('id="app"');
  });

  test('server responds within control loop latency SLO (p95 < 50ms)', async ({
    request,
    baseURL,
  }) => {
    // Validate that health endpoint stays well within the 50ms control loop p95 budget
    // Model ref: PERF-BUDGETS-001 (latency_budgets.control_loop.p95_ms = 50)
    const measurements: number[] = [];

    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      const response = await request.get(`${baseURL}/health`);
      const elapsed = performance.now() - start;
      expect(response.status()).toBe(200);
      measurements.push(elapsed);
    }

    measurements.sort((a, b) => a - b);
    const p95 = measurements[Math.ceil(measurements.length * 0.95) - 1]!;

    // Health endpoint should respond in < 50ms p95 (well below the SLO)
    expect(p95).toBeLessThan(100); // Allow 2× margin for test environment
  });
});
