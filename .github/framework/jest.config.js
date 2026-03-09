/**
 * Jest Configuration for SubZero Framework
 *
 * Uses ts-jest for TypeScript support with ESM
 */

export default {
  // Use ts-jest preset for TypeScript + ESM
  preset: 'ts-jest/presets/default-esm',

  // Test environment
  testEnvironment: 'node',

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Module name mapper for absolute imports
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Transform files with ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  // Test match patterns
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.spec.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // ESM support
  extensionsToTreatAsEsm: ['.ts'],
};
