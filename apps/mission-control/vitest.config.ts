import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'vitest.config.ts',
        'src/index.ts', // barrel re-export; no testable logic
      ],
      thresholds: {
        branches: 70, // SSE and 500-path error branches are infrastructure code
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@neurologix/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@neurologix/schemas': path.resolve(__dirname, '../../packages/schemas/src/index.ts'),
      '@neurologix/site-registry': path.resolve(__dirname, '../../services/site-registry/src/index.ts'),
      '@neurologix/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
    },
  },
});
