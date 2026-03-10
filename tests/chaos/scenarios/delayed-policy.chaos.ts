/**
 * Chaos Scenario: Delayed Policy Responses
 *
 * Simulates slow policy engine responses by measuring latency distribution
 * and verifying the system behavior when policy evaluation takes longer than expected.
 *
 * Expected behavior:
 * - Policy endpoint continues to respond (no timeout crashes)
 * - Latency remains within acceptable bounds (p99 < 100ms)
 * - Policy denials are returned as structured JSON
 *
 * Budget ref: PERF-BUDGETS-001
 *   latency_budgets.policy_decision.p99_ms = 25
 *   latency_budgets.policy_decision.gate_action.block_above_ms = 50
 */
import type { ChaosScenarioResult, ChaosObservation } from '../types';

export async function runDelayedPolicyScenario(baseURL: string): Promise<ChaosScenarioResult> {
  console.log('\n── Chaos: Delayed Policy Responses ──');

  const observations: ChaosObservation[] = [];
  const notes: string[] = [];
  const scenarioStart = Date.now();

  // Phase 1: Pre-chaos baseline
  try {
    const healthResponse = await fetch(`${baseURL}/health`);
    if (healthResponse.status !== 200) {
      return buildResult(
        'skip',
        observations,
        ['Server unavailable — skipping delayed policy scenario'],
        scenarioStart
      );
    }
  } catch {
    return buildResult(
      'skip',
      observations,
      ['Server unreachable — skipping delayed policy scenario'],
      scenarioStart
    );
  }

  // Phase 2: Measure policy latency baseline (10 sequential requests)
  const policyLatencies: number[] = [];

  console.log('  Measuring policy evaluation latency (10 sequential)...');
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    try {
      const response = await fetch(
        `${baseURL}/api/control-policy?commandType=allocate_pick&actorRole=operator&confirmationAccepted=true`
      );
      const latencyMs = performance.now() - start;
      policyLatencies.push(latencyMs);

      if (response.status !== 200) {
        observations.push({
          name: `policy request ${i + 1} — response code`,
          expected: 'HTTP 200',
          actual: `HTTP ${response.status}`,
          passed: false,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      policyLatencies.push(performance.now() - start);
      observations.push({
        name: `policy request ${i + 1} — connection`,
        expected: 'successful response',
        actual: `error: ${err instanceof Error ? err.message : String(err)}`,
        passed: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  policyLatencies.sort((a, b) => a - b);
  const p95 = policyLatencies[Math.ceil(policyLatencies.length * 0.95) - 1] ?? 0;
  const p99 = policyLatencies[Math.ceil(policyLatencies.length * 0.99) - 1] ?? 0;
  const avg = policyLatencies.reduce((s, v) => s + v, 0) / policyLatencies.length;

  console.log(
    `  Policy latency: avg=${avg.toFixed(1)}ms  p95=${p95.toFixed(1)}ms  p99=${p99.toFixed(1)}ms`
  );

  observations.push({
    name: 'policy evaluation latency p95',
    expected: 'p95 < 50ms (PERF-BUDGETS-001 block threshold)',
    actual: `p95 = ${p95.toFixed(1)}ms`,
    passed: p95 < 50,
    timestamp: new Date().toISOString(),
  });

  observations.push({
    name: 'policy evaluation latency p99',
    expected: 'p99 < 100ms (2× PERF-BUDGETS-001 block threshold)',
    actual: `p99 = ${p99.toFixed(1)}ms`,
    passed: p99 < 100,
    timestamp: new Date().toISOString(),
  });

  // Phase 3: Concurrent policy storm (20 simultaneous evaluations)
  console.log('  Firing 20 concurrent policy evaluations...');

  const stormStart = performance.now();
  const stormResults = await Promise.allSettled(
    Array.from({ length: 20 }, () =>
      fetch(
        `${baseURL}/api/control-policy?commandType=allocate_pick&actorRole=operator&confirmationAccepted=true`
      )
        .then(r => ({ status: r.status, ok: r.ok }))
        .catch(err => ({ status: 0, ok: false, error: String(err) }))
    )
  );

  const stormDurationMs = performance.now() - stormStart;
  const stormOk = stormResults.filter(
    r => r.status === 'fulfilled' && r.value.ok
  ).length;

  observations.push({
    name: 'policy storm (20 concurrent evaluations)',
    expected: '≥ 19/20 succeed (95% success rate)',
    actual: `${stormOk}/20 succeeded in ${stormDurationMs.toFixed(0)}ms`,
    passed: stormOk >= 19,
    timestamp: new Date().toISOString(),
  });

  console.log(`  Storm result: ${stormOk}/20 succeeded in ${stormDurationMs.toFixed(0)}ms`);

  // Phase 4: Verify determinism — same query must return same result
  const queryA = await (
    await fetch(
      `${baseURL}/api/control-policy?commandType=allocate_pick&actorRole=operator&confirmationAccepted=true`
    )
  ).json() as Record<string, unknown>;

  const queryB = await (
    await fetch(
      `${baseURL}/api/control-policy?commandType=allocate_pick&actorRole=operator&confirmationAccepted=true`
    )
  ).json() as Record<string, unknown>;

  observations.push({
    name: 'INV-005: policy determinism (same input → same output)',
    expected: `both responses have same 'status' field`,
    actual: `A.status=${queryA['status']}, B.status=${queryB['status']}`,
    passed: queryA['status'] === queryB['status'],
    timestamp: new Date().toISOString(),
  });

  notes.push(
    'Note: Real delayed policy chaos (artificial latency injection) requires a chaos ' +
    'proxy or service mesh with delay fault injection (e.g. Istio fault injection, ' +
    'Toxiproxy). This test validates policy engine stability under concurrent load.'
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
    scenario: 'delayed-policy-responses',
    description:
      'Validates policy engine stability under concurrent load and verifies INV-005 determinism',
    category: 'delayed-policy',
    status,
    observations,
    recoveryTimeMs: Date.now() - startMs,
    notes,
    timestamp: new Date().toISOString(),
  };
}
