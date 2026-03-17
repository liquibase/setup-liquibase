/**
 * Vitest setup file for setup-liquibase tests
 *
 * This file configures the test environment for optimal performance
 * and memory management in CI/CD environments.
 */

import { beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

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

// Mock console methods to reduce noise in CI logs
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Only show important logs in CI
  if (process.env.CI) {
    console.log = vi.fn();
    console.warn = vi.fn();
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
  // Clear all timers (vitest config handles mock reset via clearMocks/mockReset)
  vi.clearAllTimers();

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
      rss: Math.round(usage.rss / 1024 / 1024), // MB
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
    const tempDir = path.join(
      os.tmpdir(),
      `setup-liquibase-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  },

  /**
   * Clean up temporary directory
   */
  cleanupTempDir: (tempDir: string) => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup temp dir ${tempDir}:`, error);
    }
  },
};

// Default export for convenience
export default testUtils;
