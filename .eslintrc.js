module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'security', 'import'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json', './services/*/tsconfig.json']
  },
  env: {
    node: true,
    es2022: true
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json', './services/*/tsconfig.json']
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    }
  },
  rules: {
    // Security rules
    'security/detect-object-injection': 'off',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Import rules - temporarily disabled for monorepo setup
    'import/order': 'off',
    'import/no-unresolved': 'off',
    'import/no-cycle': 'off',
    'import/no-unused-modules': 'off',
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'off', // Disabled temporarily
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    
    // General code quality
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      parserOptions: {
        project: null  // Don't require project for test files
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/prefer-optional-chain': 'off',
        'security/detect-object-injection': 'off'
      }
    },
    {
      files: ['scripts/**/*.js', 'tools/**/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};