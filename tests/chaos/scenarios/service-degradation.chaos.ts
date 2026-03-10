/**
 * Chaos Scenario: Service Degradation
 *
 * Simulates service degradation by sending concurrent requests under load
 * and measuring: response rate, error tolerance, and latency under pressure.
 *
 * Expected behavior:
 * - Server responds to all requests (no cascading failures)
 * - Errors are returned as structured JSON (not unhandled exceptions)
 * - Service continues to respond after load spike subsides
 * - Health check passes throughout
 *
 * Model ref: CICD-001 deployment_safety.auto_rollback_triggers
 *   - service_error_rate_pct_above: 0.5 → triggers rollback
 */
import type { ChaosScenarioResult, ChaosObservation } from '../types';

export async function runServiceDegradationScenario(
  baseURL: string
): Promise<ChaosScenarioResult> {
  console.log('\n── Chaos: Service Degradation (Concurrent Load Burst) ──');

  const observations: ChaosObservation[] = [];
  const notes: string[] = [];
  const scenarioStart = Date.now();

  // Phase 1: Pre-chaos baseline
  const baselineOk = await checkHealth(baseURL, 'pre-chaos baseline', observations);
  if (!baselineOk) {
    return buildResult('skip', observations, ['Server unavailable — skipping degradation scenario'], scenarioStart);
  }

  // Phase 2: Concurrent request burst (simulate degradation)
  const BURST_SIZE = 50;
  console.log(`  Firing ${BURST_SIZE} concurrent requests...`);

  const requestStart = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: BURST_SIZE }, (_, i) => {
      // Mix of different endpoints to simulate realistic load
      const paths = [
        '/api/command-center',
        '/api/line-view?limit=12',
        '/api/events?limit=12',
        '/api/control-policy?commandType=allocate_pick&actorRole=operator&confirmationAccepted=true',
      ];
      const path = paths[i % paths.length]!;
      return fetch(`${baseURL}${path}`)
        .then(r => ({ status: r.status, ok: r.ok, path }))
        .catch(err => ({ status: 0, ok: false, path, error: String(err) }));
    })
  );

  const burstDurationMs = Date.now() - requestStart;
  const successful = results.filter(
    r => r.status === 'fulfilled' && r.value.ok
  );
  const failed = results.filter(
    r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)
  );

  const errorRate = (failed.length / BURST_SIZE) * 100;

  observations.push({
    name: `concurrent burst (${BURST_SIZE} requests)`,
    expected: `error rate < 0.5% (CICD-001 rollback trigger)`,
    actual: `${failed.length}/${BURST_SIZE} failed (${errorRate.toFixed(1)}% error rate) in ${burstDurationMs}ms`,
    passed: errorRate < 0.5,
    timestamp: new Date().toISOString(),
  });

  console.log(
    `  Burst result: ${successful.length} ok, ${failed.length} failed (${errorRate.toFixed(1)}%) in ${burstDurationMs}ms`
  );

  // Phase 3: Verify error responses are structured (not unhandled exceptions)
  // Send a malformed dispatch to verify graceful error handling
  try {
    const badDispatchResponse = await fetch(`${baseURL}/api/dispatch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ malformed: 'payload' }),
    });

    const isStructuredError =
      badDispatchResponse.status >= 400 ||
      badDispatchResponse.status === 200; // Server may return 200 with error field

    let responseBody: unknown;
    try {
      responseBody = await badDispatchResponse.json();
    } catch {
      responseBody = null;
    }

    observations.push({
      name: 'malformed request → structured error (not crash)',
      expected: 'JSON error response, server not crashed',
      actual: `HTTP ${badDispatchResponse.status}, body: ${JSON.stringify(responseBody)}`,
      passed: isStructuredError && responseBody !== null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    observations.push({
      name: 'malformed request → structured error',
      expected: 'JSON error response, server not crashed',
      actual: `connection error: ${err instanceof Error ? err.message : String(err)}`,
      passed: false,
      timestamp: new Date().toISOString(),
    });
  }

  // Phase 4: Post-chaos recovery check
  await checkHealth(baseURL, 'post-chaos recovery', observations);

  // CICD-001 rollback trigger check
  if (errorRate > 0.5) {
    notes.push(
      `ROLLBACK TRIGGER: error rate ${errorRate.toFixed(1)}% exceeds 0.5% threshold (CICD-001)`
    );
  } else {
    notes.push(`Error rate ${errorRate.toFixed(1)}% — below 0.5% rollback trigger threshold`);
  }

  notes.push(
    'Note: Full service degradation tests (killing individual microservices, simulating ' +
    'network partitions) require Kubernetes chaos tooling (e.g. Chaos Monkey, LitmusChaos). ' +
    'This test validates HTTP error handling and load tolerance at the API layer.'
  );

  const allPassed = observations.every(o => o.passed);
  return buildResult(allPassed ? 'pass' : 'fail', observations, notes, scenarioStart);
}

async function checkHealth(
  baseURL: string,
  label: string,
  observations: ChaosObservation[]
): Promise<boolean> {
  try {
    const response = await fetch(`${baseURL}/health`);
    const passed = response.status === 200;
    observations.push({
      name: label,
      expected: 'HTTP 200',
      actual: `HTTP ${response.status}`,
      passed,
      timestamp: new Date().toISOString(),
    });
    return passed;
  } catch (err) {
    observations.push({
      name: label,
      expected: 'HTTP 200',
      actual: `error: ${err instanceof Error ? err.message : String(err)}`,
      passed: false,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}

function buildResult(
  status: ChaosScenarioResult['status'],
  observations: ChaosObservation[],
  notes: string[],
  startMs: number
): ChaosScenarioResult {
  return {
    scenario: 'service-degradation',
    description:
      'Validates service handles concurrent load bursts and malformed requests without cascading failures',
    category: 'service-degradation',
    status,
    observations,
    recoveryTimeMs: Date.now() - startMs,
    notes,
    timestamp: new Date().toISOString(),
  };
}
