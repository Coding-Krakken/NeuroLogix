/**
 * E2E Test Fixtures
 *
 * Provides typed API request context and shared server utilities
 * for Mission Control integration tests.
 *
 * Model ref: TEST-TRACE-001 (invariant-to-test trace matrix)
 */
import { test as base, expect } from '@playwright/test';

export interface TestFixtures {
  baseURL: string;
}

/** Extended test with shared request helpers */
export const test = base.extend<TestFixtures>({
  baseURL: async ({}, use) => {
    await use(process.env.BASE_URL ?? 'http://localhost:3100');
  },
});

export { expect };
