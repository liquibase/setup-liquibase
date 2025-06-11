/**
 * Jest configuration for setup-liquibase GitHub Action
 * 
 * Configures the test environment for TypeScript testing with coverage reporting.
 * Uses ts-jest preset for seamless TypeScript compilation and execution.
 */

export default {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Run tests in Node.js environment (appropriate for GitHub Actions)
  testEnvironment: 'node',
  
  // Pattern to find test files in __tests__ directory
  testMatch: ['**/__tests__/**/*.test.ts'],
  
  // Include source files for coverage calculation
  collectCoverageFrom: [
    'src/**/*.ts',        // Include all TypeScript source files
    '!src/**/*.d.ts'      // Exclude TypeScript declaration files
  ],
  
  // Coverage report formats: console output and LCOV for CI integration
  coverageReporters: ['text', 'lcov'],

  moduleFileExtensions: ['ts', 'js'],

  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },

  // Set test timeout to 30 seconds for CI environments
  testTimeout: 30000,

  // Force exit to prevent hanging processes
  forceExit: true,

  // Don't leak memory between test runs
  clearMocks: true,
  restoreMocks: true,

  // Reduce parallelism in CI to avoid resource exhaustion
  maxWorkers: process.env.CI ? 2 : '50%',

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Enable garbage collection for memory management
  globalSetup: undefined,
  globalTeardown: undefined
};