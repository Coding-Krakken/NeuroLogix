import { defineConfig } from '@playwright/test';

/**
 * NeuroLogix E2E Test Configuration
 *
 * Mode: API testing (no browser) — Mission Control Fastify server
 * Invariant coverage: INV-001, INV-002, INV-004, INV-006, INV-008
 * Model ref: TEST-TRACE-001 (.github/.system-state/ops/test_traceability_model.yaml)
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],
  use: {
    // All E2E tests run against the local server (API only — no browser context needed)
    baseURL: process.env.BASE_URL ?? 'http://localhost:3100',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
      testMatch: '**/*.spec.ts',
    },
  ],
  // Start mission-control server before running tests
  webServer: {
    command: 'node -e "import(\'./apps/mission-control/dist/index.js\')"',
    url: 'http://localhost:3100/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: '3100',
      NODE_ENV: 'test',
    },
  },
  outputDir: 'test-results',
});
