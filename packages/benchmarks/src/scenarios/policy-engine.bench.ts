/**
 * Benchmark Scenario: Policy Engine Decision Latency
 *
 * Measures policy evaluation API response latency.
 * Uses GET /api/control-policy with a standard operator query.
 *
 * Budget ref: PERF-BUDGETS-001
 *   latency_budgets.policy_decision.p95_ms = 10
 *   latency_budgets.policy_decision.p99_ms = 25
 *   gate_action.warn_above_ms = 10
 *   gate_action.block_above_ms = 50
 */
import { runBenchmark, printResult } from '../runner';
import type { BenchmarkResult } from '../types';

export async function runPolicyEngineBenchmark(baseURL: string): Promise<BenchmarkResult> {
  console.log('\n─── Policy Engine Decision Latency Benchmark ───');

  const result = await runBenchmark({
    name: 'Policy Engine Decision Latency',
    description:
      'Control policy evaluation latency (PERF-BUDGETS-001: p95 < 10ms, p99 < 25ms)',
    baseURL,
    path: '/api/control-policy?commandType=allocate_pick&actorRole=operator&confirmationAccepted=true',
    method: 'GET',
    duration: 10,
    connections: 20, // 20 concurrent to stress policy evaluation
    budgets: {
      p95WarnMs: 10,
      p95BlockMs: 50,
      p99WarnMs: 25,
      p99BlockMs: 100,
    },
  });

  printResult(result);
  return result;
}

if (require.main === module) {
  const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3100';
  runPolicyEngineBenchmark(baseURL).then(result => {
    process.exit(result.passed ? 0 : 1);
  });
}
