/**
 * Chaos Experiment Types
 *
 * Shared types for chaos experiment results and scenarios.
 * Model ref: TEST-TRACE-001, .github/.system-state/resilience/ (planned Phase 6)
 */

export type ChaosScenarioStatus = 'pass' | 'fail' | 'skip' | 'error';

export interface ChaosObservation {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  timestamp: string;
}

export interface ChaosScenarioResult {
  scenario: string;
  description: string;
  category: 'broker-loss' | 'service-degradation' | 'delayed-policy' | 'resource-exhaustion';
  status: ChaosScenarioStatus;
  observations: ChaosObservation[];
  recoveryTimeMs?: number;
  notes: string[];
  timestamp: string;
}

export interface ChaosSuiteReport {
  schemaVersion: string;
  modelRef: string;
  runId: string;
  startedAt: string;
  completedAt: string;
  baseURL: string;
  results: ChaosScenarioResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
  };
}
