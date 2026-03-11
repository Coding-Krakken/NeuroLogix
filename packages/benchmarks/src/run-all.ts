/**
 * Benchmark Suite Runner
 *
 * Orchestrates all benchmark scenarios, generates a JSON suite report,
 * and exits with code 1 if any BLOCK-level budget is exceeded.
 *
 * Output: benchmark-results/suite-<timestamp>.json
 *
 * Model ref: PERF-BUDGETS-001 (.github/.system-state/perf/budgets.yaml)
 * TEST-TRACE-001 (.github/.system-state/ops/test_traceability_model.yaml)
 *
 * Usage:
 *   BASE_URL=http://localhost:3100 node dist/run-all.js
 *   BASE_URL=http://staging.example.com node dist/run-all.js
 */
import fs from 'fs';
import path from 'path';
import { runControlLoopBenchmark } from './scenarios/control-loop.bench';
import { runPolicyEngineBenchmark } from './scenarios/policy-engine.bench';
import { runCapabilityLookupBenchmark } from './scenarios/capability-lookup.bench';
import type { BenchmarkResult, BenchmarkSuite } from './types';

async function runAll(): Promise<void> {
  const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3100';
  const runId = `bench-${Date.now()}`;
  const startedAt = new Date().toISOString();

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        NeuroLogix Performance Benchmark Suite            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`Run ID:  ${runId}`);
  console.log(`Target:  ${baseURL}`);
  console.log(`Started: ${startedAt}\n`);

  // Verify server is reachable before benchmarking
  try {
    const response = await fetch(`${baseURL}/health`);
    if (!response.ok) {
      throw new Error(`Health check returned ${response.status}`);
    }
    const body = await response.json() as Record<string, unknown>;
    console.log(`Server health: ${JSON.stringify(body)}\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`ERROR: Cannot reach ${baseURL}/health — ${message}`);
    console.error('Ensure the target server is running before running benchmarks.');
    process.exit(2);
  }

  const benchmarkSteps = [
    {
      name: 'control-loop',
      run: () => runControlLoopBenchmark(baseURL),
    },
    {
      name: 'policy-engine',
      run: () => runPolicyEngineBenchmark(baseURL),
    },
    {
      name: 'capability-lookup',
      run: () => runCapabilityLookupBenchmark(baseURL),
    },
  ];

  const settled: BenchmarkResult[] = [];
  for (const benchmarkStep of benchmarkSteps) {
    try {
      settled.push(await benchmarkStep.run());
    } catch (err) {
      console.error(`Benchmark ${benchmarkStep.name} failed: ${err}`);
    }
  }

  const completedAt = new Date().toISOString();

  const summary = {
    total: settled.length,
    passed: settled.filter(r => r.passed).length,
    failed: settled.filter(r => !r.passed && r.budgets.some(b => !b.passed && b.action === 'block')).length,
    warned: settled.filter(r => !r.passed && r.budgets.some(b => !b.passed && b.action === 'warn')).length,
  };

  const suite: BenchmarkSuite = {
    schemaVersion: '1.0',
    modelRef: 'PERF-BUDGETS-001',
    runId,
    startedAt,
    completedAt,
    baseURL,
    results: settled,
    summary,
  };

  // Write report
  const outDir = 'benchmark-results';
  fs.mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, `${runId}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(suite, null, 2));

  // Also write a latest.json for CI artifact consistency
  const latestPath = path.join(outDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(suite, null, 2));

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                   Benchmark Summary                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Total:   ${summary.total}`);
  console.log(`  Passed:  ${summary.passed}`);
  console.log(`  Failed:  ${summary.failed}  (BLOCK-level budget exceeded)`);
  console.log(`  Warned:  ${summary.warned}  (WARN-level budget exceeded)`);
  console.log(`  Report:  ${reportPath}`);
  console.log(`  Completed: ${completedAt}\n`);

  if (summary.failed > 0) {
    console.error(`BENCHMARK FAILED: ${summary.failed} BLOCK-level budget(s) exceeded.`);
    process.exit(1);
  }

  if (summary.warned > 0) {
    console.warn(`BENCHMARK WARNING: ${summary.warned} WARN-level budget(s) exceeded.`);
    // Warnings do not block CI (model: fail_action: warn)
  }

  console.log('All benchmark budgets satisfied. ✓');
}

runAll().catch(err => {
  console.error('Benchmark suite crashed:', err);
  process.exit(1);
});
