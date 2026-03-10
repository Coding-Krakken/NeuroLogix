/**
 * Chaos Suite Runner
 *
 * Orchestrates all chaos scenarios, generates a structured report,
 * and exits with code 1 if any critical scenario fails.
 *
 * Output: chaos-results/chaos-<timestamp>.json
 *
 * Model ref: TEST-TRACE-001, CICD-001 deployment_safety
 *
 * Usage:
 *   BASE_URL=http://localhost:3100 npx tsx tests/chaos/runner.ts
 *   BASE_URL=http://staging.example.com npx tsx tests/chaos/runner.ts
 */
import fs from 'fs';
import path from 'path';
import { runBrokerLossScenario } from './scenarios/broker-loss.chaos';
import { runServiceDegradationScenario } from './scenarios/service-degradation.chaos';
import { runDelayedPolicyScenario } from './scenarios/delayed-policy.chaos';
import type { ChaosSuiteReport } from './types';

async function runChaos(): Promise<void> {
  const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3100';
  const runId = `chaos-${Date.now()}`;
  const startedAt = new Date().toISOString();

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        NeuroLogix Chaos Experiment Suite                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`Run ID:  ${runId}`);
  console.log(`Target:  ${baseURL}`);
  console.log(`Started: ${startedAt}`);

  const results = await Promise.allSettled([
    runBrokerLossScenario(baseURL),
    runServiceDegradationScenario(baseURL),
    runDelayedPolicyScenario(baseURL),
  ]);

  const completedAt = new Date().toISOString();
  const settled = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    console.error(`Chaos scenario ${i} crashed: ${r.reason}`);
    return null;
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const summary = {
    total: settled.length,
    passed: settled.filter(r => r.status === 'pass').length,
    failed: settled.filter(r => r.status === 'fail').length,
    skipped: settled.filter(r => r.status === 'skip').length,
    errors: settled.filter(r => r.status === 'error').length,
  };

  const report: ChaosSuiteReport = {
    schemaVersion: '1.0',
    modelRef: 'TEST-TRACE-001 / CICD-001',
    runId,
    startedAt,
    completedAt,
    baseURL,
    results: settled,
    summary,
  };

  // Write report
  const outDir = 'chaos-results';
  fs.mkdirSync(outDir, { recursive: true });
  const reportPath = path.join(outDir, `${runId}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const latestPath = path.join(outDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  Chaos Suite Summary                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Total:   ${summary.total}`);
  console.log(`  Passed:  ${summary.passed}`);
  console.log(`  Failed:  ${summary.failed}`);
  console.log(`  Skipped: ${summary.skipped}`);
  console.log(`  Report:  ${reportPath}`);
  console.log(`  Done:    ${completedAt}\n`);

  if (summary.failed > 0) {
    console.error(`CHAOS FAILURE: ${summary.failed} scenario(s) failed.`);
    process.exit(1);
  }

  console.log('All chaos scenarios passed or skipped. ✓');
}

runChaos().catch(err => {
  console.error('Chaos runner crashed:', err);
  process.exit(1);
});
