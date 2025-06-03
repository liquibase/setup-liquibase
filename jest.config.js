/**
 * Jest configuration for setup-liquibase GitHub Action
 * 
 * Configures the test environment for TypeScript testing with coverage reporting.
 * Uses ts-jest preset for seamless TypeScript compilation and execution.
 */

module.exports = {
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
  coverageReporters: ['text', 'lcov']
};