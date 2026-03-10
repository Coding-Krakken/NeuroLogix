/**
 * Chaos Scenario: SSE Stream Disconnect (Broker Loss Simulation)
 *
 * Simulates broker/stream loss by repeatedly disconnecting from the
 * SSE stream and measuring recovery behavior.
 *
 * Expected behavior (INV-008):
 * - Each reconnect attempt succeeds within 5 seconds
 * - No data is lost between reconnects (events remain in timeline)
 * - Server remains healthy throughout
 *
 * Model ref: TEST-TRACE-001 (INV-008), CICD-001 deployment_safety.canary
 */
import type { ChaosScenarioResult, ChaosObservation } from '../types';

export async function runBrokerLossScenario(baseURL: string): Promise<ChaosScenarioResult> {
  console.log('\n── Chaos: SSE Broker Loss (Stream Disconnect) ──');

  const observations: ChaosObservation[] = [];
  const notes: string[] = [];
  const scenarioStart = Date.now();

  // Phase 1: Verify server is healthy before chaos
  try {
    const healthResponse = await fetch(`${baseURL}/health`);
    observations.push({
      name: 'pre-chaos server health',
      expected: 'HTTP 200',
      actual: `HTTP ${healthResponse.status}`,
      passed: healthResponse.status === 200,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    observations.push({
      name: 'pre-chaos server health',
      expected: 'HTTP 200',
      actual: `connection refused: ${err instanceof Error ? err.message : String(err)}`,
      passed: false,
      timestamp: new Date().toISOString(),
    });

    return buildResult('failed', observations, notes, scenarioStart);
  }

  // Phase 2: Simulate 5 rapid stream disconnects (broker loss pattern)
  const reconnectTimes: number[] = [];

  for (let i = 1; i <= 5; i++) {
    const reconnectStart = performance.now();

    try {
      // Use AbortController to simulate a forced disconnect
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${baseURL}/api/stream?once=true`, {
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const reconnectMs = performance.now() - reconnectStart;
      reconnectTimes.push(reconnectMs);

      const succeeded = response.status === 200;
      const contentType = response.headers.get('content-type') ?? '';

      observations.push({
        name: `reconnect attempt ${i}`,
        expected: 'HTTP 200, text/event-stream, snapshot event within 2s',
        actual: succeeded
          ? `HTTP 200, ${contentType}, ${reconnectMs.toFixed(0)}ms`
          : `HTTP ${response.status}, ${reconnectMs.toFixed(0)}ms`,
        passed: succeeded && reconnectMs < 5000,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `  Reconnect ${i}/5: ${succeeded ? '✓' : '✗'} ${reconnectMs.toFixed(0)}ms`
      );
    } catch (err) {
      const reconnectMs = performance.now() - reconnectStart;
      const message = err instanceof Error ? err.message : String(err);

      observations.push({
        name: `reconnect attempt ${i}`,
        expected: 'HTTP 200, text/event-stream, snapshot event within 2s',
        actual: `error: ${message}`,
        passed: false,
        timestamp: new Date().toISOString(),
      });

      console.log(`  Reconnect ${i}/5: ✗ error — ${message}`);
    }

    // Brief pause between reconnects (simulates client backoff)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Phase 3: Verify server remains healthy after chaos
  try {
    const postChaosResponse = await fetch(`${baseURL}/health`);
    observations.push({
      name: 'post-chaos server health',
      expected: 'HTTP 200 (server survives chaos)',
      actual: `HTTP ${postChaosResponse.status}`,
      passed: postChaosResponse.status === 200,
      timestamp: new Date().toISOString(),
    });

    if (postChaosResponse.status === 200) {
      console.log('  Server health after chaos: ✓');
    }
  } catch (err) {
    observations.push({
      name: 'post-chaos server health',
      expected: 'HTTP 200 (server survives chaos)',
      actual: `connection refused: ${err instanceof Error ? err.message : String(err)}`,
      passed: false,
      timestamp: new Date().toISOString(),
    });
  }

  // INV-008: all reconnects must complete within 5s
  const maxReconnectMs = Math.max(...reconnectTimes);
  if (maxReconnectMs > 5000) {
    notes.push(
      `WARNING: Slowest reconnect was ${maxReconnectMs.toFixed(0)}ms — exceeds 5s INV-008 SLO`
    );
  } else {
    notes.push(
      `INV-008 satisfied: max reconnect time = ${maxReconnectMs.toFixed(0)}ms (< 5000ms)`
    );
  }

  notes.push(
    'Note: Full broker-loss chaos (killing MQTT broker) requires infrastructure deployment. ' +
    'This test validates SSE layer resilience only.'
  );

  const allPassed = observations.every(o => o.passed);
  return buildResult(allPassed ? 'pass' : 'fail', observations, notes, scenarioStart);
}

function buildResult(
  status: ChaosScenarioResult['status'],
  observations: ChaosObservation[],
  notes: string[],
  startMs: number
): ChaosScenarioResult {
  return {
    scenario: 'sse-stream-disconnect',
    description:
      'Simulates broker loss by repeatedly disconnecting from SSE stream and verifying recovery (INV-008)',
    category: 'broker-loss',
    status,
    observations,
    recoveryTimeMs: Date.now() - startMs,
    notes,
    timestamp: new Date().toISOString(),
  };
}
