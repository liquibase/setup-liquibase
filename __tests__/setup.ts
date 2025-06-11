/**
 * Jest setup file for setup-liquibase tests
 * 
 * This file configures the test environment for optimal performance
 * and memory management in CI/CD environments.
 */

// Enable garbage collection if available (requires --expose-gc flag)
if (typeof global.gc === 'function') {
  // Force garbage collection before each test suite
  beforeEach(() => {
    global.gc!();
  });
  
  // Force garbage collection after each test suite
  afterEach(() => {
    global.gc!();
  });
}

// Set longer timeout for CI environments
jest.setTimeout(30000);

// Mock console methods to reduce noise in CI logs
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Only show important logs in CI
  if (process.env.CI) {
    console.log = jest.fn();
    console.warn = jest.fn();
    // Keep error logs for debugging
    console.error = originalConsoleError;
  }
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Clean up any lingering timers or processes
afterEach(() => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Reset all mocks
  jest.clearAllMocks();
  
  // Force process cleanup if needed
  if (process.env.CI && typeof global.gc === 'function') {
    global.gc!();
  }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests, just log
});

// Memory usage monitoring for debugging
if (process.env.NODE_ENV === 'test' && process.env.DEBUG_MEMORY) {
  beforeEach(() => {
    const memUsage = process.memoryUsage();
    console.log(`Memory before test: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  });
  
  afterEach(() => {
    const memUsage = process.memoryUsage();
    console.log(`Memory after test: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  });
}

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.RUNNER_TEMP = process.env.RUNNER_TEMP || '/tmp';
process.env.RUNNER_TOOL_CACHE = process.env.RUNNER_TOOL_CACHE || '/tmp/tool-cache';

// Export test utilities
export const testUtils = {
  /**
   * Force garbage collection if available
   */
  forceGC: () => {
    if (typeof global.gc === 'function') {
      global.gc!();
    }
  },
  
  /**
   * Get current memory usage
   */
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024) // MB
    };
  },
  
  /**
   * Wait for a specified amount of time
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Create a temporary directory for testing
   */
  createTempDir: () => {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    
    const tempDir = path.join(os.tmpdir(), `setup-liquibase-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    return tempDir;
  },
  
  /**
   * Clean up temporary directory
   */
  cleanupTempDir: (tempDir: string) => {
    const fs = require('fs');
    const path = require('path');
    
    if (fs.existsSync(tempDir)) {
      // Recursive delete
      const rmSync = fs.rmSync || fs.rmdirSync;
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to cleanup temp dir ${tempDir}:`, error);
      }
    }
  }
};

// Default export for convenience
export default testUtils;