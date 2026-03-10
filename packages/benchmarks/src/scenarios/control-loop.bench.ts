/**
 * Benchmark Scenario: Control Loop Latency
 *
 * Measures end-to-end API response latency as a proxy for control loop performance.
 * Uses the /api/stream?once=true endpoint which exercises the full SSE pipeline.
 *
 * Budget ref: PERF-BUDGETS-001
 *   latency_budgets.control_loop.p95_ms = 50
 *   latency_budgets.control_loop.p99_ms = 100
 *   gate_action.warn_above_ms = 50
 *   gate_action.block_above_ms = 150
 */
import { runBenchmark, printResult } from '../runner';
import type { BenchmarkResult } from '../types';

export async function runControlLoopBenchmark(baseURL: string): Promise<BenchmarkResult> {
  console.log('\n─── Control Loop Latency Benchmark ───');

  const result = await runBenchmark({
    name: 'Control Loop API Latency',
    description:
      'SSE snapshot endpoint latency as control loop proxy (PERF-BUDGETS-001: p95 < 50ms)',
    baseURL,
    path: '/api/stream?once=true',
    method: 'GET',
    headers: { accept: 'text/event-stream' },
    duration: 10,
    connections: 10,
    budgets: {
      p95WarnMs: 50,
      p95BlockMs: 150,
      p99WarnMs: 100,
      p99BlockMs: 200,
    },
  });

  printResult(result);
  return result;
}

// Allow direct execution: `node dist/scenarios/control-loop.bench.js`
if (require.main === module) {
  const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3100';
  runControlLoopBenchmark(baseURL).then(result => {
    process.exit(result.passed ? 0 : 1);
  });
}
