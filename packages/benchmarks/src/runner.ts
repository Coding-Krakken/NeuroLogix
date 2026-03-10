/**
 * Benchmark Runner Utility
 *
 * Wraps autocannon with budget assertion logic and structured result output.
 * Model ref: PERF-BUDGETS-001 (.github/.system-state/perf/budgets.yaml)
 */
import autocannon from 'autocannon';
import type { BenchmarkResult, BudgetAssertion, LatencyStats, ThroughputStats } from './types';

export interface RunnerOptions {
  /** Human-readable benchmark name */
  name: string;
  /** Description of what is being measured */
  description: string;
  /** Base URL of service under test (e.g. http://localhost:3100) */
  baseURL: string;
  /** Path to benchmark (appended to baseURL) */
  path: string;
  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST';
  /** POST body (JSON serialised) */
  body?: string;
  /** Headers to send */
  headers?: Record<string, string>;
  /** Test duration in seconds (default: 10) */
  duration?: number;
  /** Number of concurrent connections (default: 10) */
  connections?: number;
  /** Budget thresholds from PERF-BUDGETS-001 */
  budgets: {
    p95WarnMs?: number;
    p95BlockMs?: number;
    p99WarnMs?: number;
    p99BlockMs?: number;
    minRps?: number;
  };
}

/**
 * Run a single benchmark scenario and return structured results with budget assertions.
 */
export async function runBenchmark(opts: RunnerOptions): Promise<BenchmarkResult> {
  const url = `${opts.baseURL}${opts.path}`;

  return new Promise<BenchmarkResult>((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        method: opts.method ?? 'GET',
        headers: {
          accept: 'application/json',
          ...(opts.body ? { 'content-type': 'application/json' } : {}),
          ...opts.headers,
        },
        body: opts.body,
        duration: opts.duration ?? 10,
        connections: opts.connections ?? 10,
        pipelining: 1,
        timeout: 5,
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        const latency: LatencyStats = {
          min: result.latency.min,
          max: result.latency.max,
          average: result.latency.average,
          p50: result.latency.p50,
          p95: result.latency.p97_5,
          p99: result.latency.p99,
        };

        const throughput: ThroughputStats = {
          requestsPerSecond: result.requests.average,
          bytesPerSecond: result.throughput.average,
          totalRequests: result.requests.total,
          totalDuration: result.duration,
        };

        const budgets: BudgetAssertion[] = [];

        if (opts.budgets.p95WarnMs !== undefined) {
          budgets.push({
            metric: 'p95_latency',
            actual: latency.p95,
            budget: opts.budgets.p95WarnMs,
            unit: 'ms',
            passed: latency.p95 <= opts.budgets.p95WarnMs,
            action: 'warn',
          });
        }

        if (opts.budgets.p95BlockMs !== undefined) {
          budgets.push({
            metric: 'p95_latency_block',
            actual: latency.p95,
            budget: opts.budgets.p95BlockMs,
            unit: 'ms',
            passed: latency.p95 <= opts.budgets.p95BlockMs,
            action: 'block',
          });
        }

        if (opts.budgets.p99WarnMs !== undefined) {
          budgets.push({
            metric: 'p99_latency',
            actual: latency.p99,
            budget: opts.budgets.p99WarnMs,
            unit: 'ms',
            passed: latency.p99 <= opts.budgets.p99WarnMs,
            action: 'warn',
          });
        }

        if (opts.budgets.p99BlockMs !== undefined) {
          budgets.push({
            metric: 'p99_latency_block',
            actual: latency.p99,
            budget: opts.budgets.p99BlockMs,
            unit: 'ms',
            passed: latency.p99 <= opts.budgets.p99BlockMs,
            action: 'block',
          });
        }

        if (opts.budgets.minRps !== undefined) {
          budgets.push({
            metric: 'min_requests_per_second',
            actual: throughput.requestsPerSecond,
            budget: opts.budgets.minRps,
            unit: 'rps',
            passed: throughput.requestsPerSecond >= opts.budgets.minRps,
            action: 'warn',
          });
        }

        const hasBlockFailure = budgets.some(b => !b.passed && b.action === 'block');
        const passed = !hasBlockFailure;

        resolve({
          name: opts.name,
          description: opts.description,
          timestamp: new Date().toISOString(),
          baseURL: opts.baseURL,
          duration: result.duration,
          connections: opts.connections ?? 10,
          latency,
          throughput,
          errors: result.errors,
          timeouts: result.timeouts,
          budgets,
          passed,
        });
      }
    );

    autocannon.track(instance, { renderProgressBar: !process.env.CI });
  });
}

/** Print a human-readable benchmark result to stdout */
export function printResult(result: BenchmarkResult): void {
  const icon = result.passed ? '✓' : '✗';
  console.log(`\n${icon} ${result.name}`);
  console.log(`  Description: ${result.description}`);
  console.log(`  Duration:    ${result.duration}s | Connections: ${result.connections}`);
  console.log(
    `  Latency:     p50=${result.latency.p50}ms  p95=${result.latency.p95}ms  p99=${result.latency.p99}ms  max=${result.latency.max}ms`
  );
  console.log(
    `  Throughput:  ${result.throughput.requestsPerSecond.toFixed(1)} req/s  (${result.throughput.totalRequests} total)`
  );
  console.log(`  Errors:      ${result.errors}  Timeouts: ${result.timeouts}`);

  for (const budget of result.budgets) {
    const ok = budget.passed ? '✓' : '✗';
    const tag = budget.action === 'block' ? '[BLOCK]' : '[WARN] ';
    console.log(
      `  Budget ${ok} ${tag}  ${budget.metric}: ${budget.actual.toFixed(2)}${budget.unit} (budget: ${budget.budget}${budget.unit})`
    );
  }
}
