import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@neurologix/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
      '@neurologix/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
});
