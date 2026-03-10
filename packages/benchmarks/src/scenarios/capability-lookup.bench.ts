/**
 * Benchmark Scenario: Capability Lookup Latency
 *
 * Measures capability registry read latency via GET /api/command-center.
 * This endpoint exercises the state read path analogous to a capability lookup.
 *
 * Budget ref: PERF-BUDGETS-001
 *   latency_budgets.capability_lookup.p95_ms = 20
 *   latency_budgets.capability_lookup.p99_ms = 50
 *   gate_action.warn_above_ms = 20
 *   gate_action.block_above_ms = 100
 */
import { runBenchmark, printResult } from '../runner';
import type { BenchmarkResult } from '../types';

export async function runCapabilityLookupBenchmark(baseURL: string): Promise<BenchmarkResult> {
  console.log('\n─── Capability Lookup Latency Benchmark ───');

  const result = await runBenchmark({
    name: 'Capability Lookup Latency',
    description:
      'Command center state read latency (PERF-BUDGETS-001: p95 < 20ms, p99 < 50ms)',
    baseURL,
    path: '/api/command-center',
    method: 'GET',
    duration: 10,
    connections: 10,
    budgets: {
      p95WarnMs: 20,
      p95BlockMs: 100,
      p99WarnMs: 50,
      p99BlockMs: 200,
      minRps: 100, // Should sustain at least 100 req/s
    },
  });

  printResult(result);
  return result;
}

if (require.main === module) {
  const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3100';
  runCapabilityLookupBenchmark(baseURL).then(result => {
    process.exit(result.passed ? 0 : 1);
  });
}
