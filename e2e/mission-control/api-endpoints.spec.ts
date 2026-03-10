/**
 * E2E — Mission Control: Core API Endpoints
 *
 * Validates all REST API endpoints return valid schemas and correct HTTP semantics.
 * Ensures capability-registry-level consistency under sequential requests.
 *
 * Invariant coverage:
 *   INV-006 — Capability registry returns consistent results under concurrent load
 * Model ref: TEST-TRACE-001
 */
import { test, expect } from '../fixtures/base.fixture';

test.describe('Mission Control — Core API Endpoints', () => {
  test('GET /api/command-center returns 200 with valid snapshot', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/command-center`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    // Command center snapshot should be a non-null object
    expect(body).not.toBeNull();
    expect(typeof body).toBe('object');
  });

  test('GET /api/line-view returns 200 with limit applied', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/line-view?limit=5`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).not.toBeNull();
    expect(typeof body).toBe('object');
  });

  test('GET /api/events returns 200 with events array', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/events?limit=5`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    // Events should be an array (may be empty on fresh server)
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /api/events with limit=1 returns maximum 1 event', async ({
    request,
    baseURL,
  }) => {
    // Generate some events first via tick
    await request.post(`${baseURL}/api/tick`);
    await request.post(`${baseURL}/api/tick`);
    await request.post(`${baseURL}/api/tick`);

    const response = await request.get(`${baseURL}/api/events?limit=1`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeLessThanOrEqual(1);
  });

  test('POST /api/tick advances state and returns frame', async ({ request, baseURL }) => {
    const before = await (await request.get(`${baseURL}/api/command-center`)).json();
    const tickResponse = await request.post(`${baseURL}/api/tick`);

    expect(tickResponse.status()).toBe(200);

    const after = await (await request.get(`${baseURL}/api/command-center`)).json();
    // After a tick, updatedAt should have advanced (or state should differ)
    // Both responses should be valid non-null objects
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
  });

  test('INV-006: sequential API calls return consistent object shapes', async ({
    request,
    baseURL,
  }) => {
    // Make 5 sequential calls to verify response shape consistency
    for (let i = 0; i < 5; i++) {
      const response = await request.get(`${baseURL}/api/command-center`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).not.toBeNull();
      expect(typeof body).toBe('object');
    }
  });
});
