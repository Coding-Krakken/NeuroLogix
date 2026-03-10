/**
 * Benchmark Result Types
 *
 * Shared type definitions for benchmark reports aligned with PERF-BUDGETS-001.
 * Model ref: .github/.system-state/perf/budgets.yaml
 */

export interface LatencyStats {
  min: number;
  max: number;
  average: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface ThroughputStats {
  requestsPerSecond: number;
  bytesPerSecond: number;
  totalRequests: number;
  totalDuration: number;
}

export interface BenchmarkResult {
  name: string;
  description: string;
  timestamp: string;
  baseURL: string;
  duration: number;
  connections: number;
  latency: LatencyStats;
  throughput: ThroughputStats;
  errors: number;
  timeouts: number;
  budgets: BudgetAssertion[];
  passed: boolean;
}

export interface BudgetAssertion {
  metric: string;
  actual: number;
  budget: number;
  unit: string;
  passed: boolean;
  action: 'warn' | 'block';
}

export interface BenchmarkSuite {
  schemaVersion: string;
  modelRef: string;
  runId: string;
  startedAt: string;
  completedAt: string;
  baseURL: string;
  results: BenchmarkResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warned: number;
  };
}
