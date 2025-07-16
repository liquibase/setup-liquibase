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
    '^.+\\.ts$': ['ts-jest', { 
      tsconfig: 'tsconfig.json'
    }]
  },

  // Set test timeout to 30 seconds for CI environments
  testTimeout: 30000,

  // Force exit to prevent hanging processes (especially important on Windows)
  forceExit: true,

  // Don't leak memory between test runs
  clearMocks: true,
  restoreMocks: true,

  // Reduce parallelism to avoid resource exhaustion and cross-platform issues
  maxWorkers: process.env.CI ? 1 : 2,

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Memory management and cross-platform compatibility
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Handle Windows path issues
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  
  // Reduce memory usage
  logHeapUsage: process.env.CI ? true : false,
  
  // Ensure clean slate for each test file
  resetMocks: true,
  resetModules: true
};