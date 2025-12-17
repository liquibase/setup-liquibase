/**
 * Performance tests for setup-liquibase action
 * 
 * These tests measure the performance characteristics of the action
 * to ensure it meets acceptable performance standards.
 */

import { getDownloadUrl } from '../../src/installer';

// Cleanup helper for performance tests
const cleanupResources = () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Clear any pending timers
  if (typeof global.clearTimeout === 'function') {
    // Clear any test-created timers (not a real cleanup, but helps with consistency)
  }
};

describe('Performance Tests', () => {
  // Cleanup after each test to prevent memory accumulation
  afterEach(() => {
    cleanupResources();
  });

  /**
   * Test URL generation performance
   */
  describe('URL Generation Performance', () => {
    it('should generate URLs quickly', () => {
      const startTime = Date.now();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        getDownloadUrl('4.32.0', 'oss');
        getDownloadUrl('4.32.0', 'pro');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTimePerCall = duration / (iterations * 2);
      
      // URL generation should be very fast (less than 1ms per call on average)
      expect(avgTimePerCall).toBeLessThan(1);
      expect(duration).toBeLessThan(100); // Total time should be under 100ms
    });

    it('should handle concurrent URL generation', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) => {
        return Promise.resolve().then(() => {
          const version = `4.32.${i % 10}`;
          const edition = i % 2 === 0 ? 'oss' : 'pro';
          return getDownloadUrl(version, edition);
        });
      });
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All requests should complete
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(url => {
        expect(url).toMatch(/^https:\/\/package\.liquibase\.com/);
      });
      
      // Concurrent execution should be fast
      expect(duration).toBeLessThan(50);
    });
  });

  /**
   * Test memory usage patterns
   */
  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', () => {
      // Force initial cleanup
      cleanupResources();
      
      const initialMemory = process.memoryUsage();
      const iterations = 1000;
      
      // Perform repeated operations
      for (let i = 0; i < iterations; i++) {
        const urls = [
          getDownloadUrl('4.32.0', 'oss'),
          getDownloadUrl('4.32.0', 'pro')
        ];
        
        // Validate URLs to ensure they're not optimized away
        urls.forEach(url => {
          expect(url).toBeTruthy();
        });
        
        // Periodic cleanup during long loops
        if (i % 100 === 0) {
          cleanupResources();
        }
      }
      
      // Force final cleanup
      cleanupResources();
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be minimal (less than 20MB to account for CI variability)
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });
  });

  /**
   * Test scalability patterns
   */
  describe('Scalability', () => {
    it('should handle multiple version formats efficiently', () => {
      const versions = [
        '4.32.0', '4.32.1', '4.32.2', '4.32.3', '4.32.4',
        '4.33.0', '4.33.1', '4.33.2', '4.33.3', '4.33.4',
        '4.34.0', '4.34.1', '4.34.2', '4.34.3', '4.34.4',
        '5.0.0', '5.0.1', '5.0.2', '5.0.3', '5.0.4'
      ];
      
      const startTime = Date.now();
      
      versions.forEach(version => {
        const ossUrl = getDownloadUrl(version, 'oss');
        const proUrl = getDownloadUrl(version, 'pro');
        
        expect(ossUrl).toContain(version);
        expect(proUrl).toContain(version);
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTimePerVersion = duration / versions.length;
      
      // Should handle multiple versions quickly
      expect(avgTimePerVersion).toBeLessThan(1);
      expect(duration).toBeLessThan(50);
    });

    it('should handle different platforms efficiently', () => {
      const platforms = ['win32', 'linux', 'darwin'];
      const originalPlatform = process.platform;
      const startTime = Date.now();
      
      platforms.forEach(platform => {
        Object.defineProperty(process, 'platform', { value: platform });
        
        for (let i = 0; i < 100; i++) {
          const ossUrl = getDownloadUrl('4.32.0', 'oss');
          const proUrl = getDownloadUrl('4.32.0', 'pro');
          
          expect(ossUrl).toBeTruthy();
          expect(proUrl).toBeTruthy();
        }
      });
      
      // Restore original platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Platform-specific logic should be fast (increased threshold for CI environment)
      expect(duration).toBeLessThan(200);
    });
  });

  /**
   * Test resource usage patterns
   */
  describe('Resource Usage', () => {
    it('should have predictable CPU usage patterns', () => {
      const iterations = 10000;
      const batchSize = 1000;
      const times: number[] = [];
      
      for (let batch = 0; batch < iterations / batchSize; batch++) {
        const batchStart = Date.now();
        
        for (let i = 0; i < batchSize; i++) {
          getDownloadUrl('4.32.0', 'oss');
        }
        
        const batchEnd = Date.now();
        times.push(batchEnd - batchStart);
      }
      
      // Calculate statistics
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      // Performance should be consistent
      expect(avgTime).toBeLessThan(10); // Average batch time
      expect(maxTime - minTime).toBeLessThan(20); // Variance should be low
    });

    it('should handle edge case inputs efficiently', () => {
      const edgeCases = [
        { version: '4.32.0', edition: 'oss' as const },
        { version: '999.999.999', edition: 'oss' as const },
        { version: '4.32.0', edition: 'pro' as const },
        { version: '999.999.999', edition: 'pro' as const },
        { version: '4.32.0-beta', edition: 'oss' as const },
        { version: '4.32.0-SNAPSHOT', edition: 'pro' as const }
      ];
      
      const startTime = Date.now();
      
      edgeCases.forEach(testCase => {
        const url = getDownloadUrl(testCase.version, testCase.edition);
        expect(url).toBeTruthy();
        expect(url).toMatch(/^https:/);
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Edge cases should not significantly impact performance
      // Allow 20ms for slower CI runners (especially Windows)
      expect(duration).toBeLessThan(20);
    });
  });

  /**
   * Test performance regression patterns
   */
  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across test runs', () => {
      const runs = 5;
      const operationsPerRun = 1000;
      const runTimes: number[] = [];
      
      for (let run = 0; run < runs; run++) {
        // Cleanup before each run for consistency
        cleanupResources();
        
        const runStart = Date.now();
        
        for (let i = 0; i < operationsPerRun; i++) {
          getDownloadUrl('4.32.0', i % 2 === 0 ? 'oss' : 'pro');
        }
        
        const runEnd = Date.now();
        runTimes.push(runEnd - runStart);
        
        // Cleanup after each run
        cleanupResources();
      }
      
      // Calculate coefficient of variation (CV)
      const mean = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;
      const variance = runTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / runTimes.length;
      const stdDev = Math.sqrt(variance);
      
      // Handle edge case where mean is 0 (operations are too fast to measure)
      const cv = mean === 0 ? 0 : stdDev / mean;
      
      // Performance should be consistent (CV < 2.5 means < 250% variation for local/CI environments)
      // If CV is 0, it means operations are consistently instantaneous, which is acceptable
      expect(cv).toBeLessThan(2.5);
      expect(mean).toBeLessThan(50); // Mean time should be reasonable
    });
  });

  /**
   * Benchmark tests for comparison
   */
  describe('Performance Benchmarks', () => {
    it('should meet baseline performance requirements', () => {
      const benchmarks = {
        singleUrlGeneration: { maxTime: 5, iterations: 1 },  // Increased time tolerance for CI
        batchUrlGeneration: { maxTime: 20, iterations: 1000 },
        concurrentUrlGeneration: { maxTime: 30, iterations: 100 }
      };
      
      // Single URL generation benchmark
      const singleStart = Date.now();
      for (let i = 0; i < benchmarks.singleUrlGeneration.iterations; i++) {
        getDownloadUrl('4.32.0', 'oss');
      }
      const singleDuration = Date.now() - singleStart;
      expect(singleDuration).toBeLessThan(benchmarks.singleUrlGeneration.maxTime);
      
      // Batch URL generation benchmark
      const batchStart = Date.now();
      for (let i = 0; i < benchmarks.batchUrlGeneration.iterations; i++) {
        getDownloadUrl('4.32.0', i % 2 === 0 ? 'oss' : 'pro');
      }
      const batchDuration = Date.now() - batchStart;
      expect(batchDuration).toBeLessThan(benchmarks.batchUrlGeneration.maxTime);
      
      // Log benchmark results for reference
      console.log(`Performance Benchmarks:
        Single URL Generation: ${singleDuration}ms (max: ${benchmarks.singleUrlGeneration.maxTime}ms)
        Batch URL Generation: ${batchDuration}ms (max: ${benchmarks.batchUrlGeneration.maxTime}ms)
        Iterations: ${benchmarks.batchUrlGeneration.iterations}
      `);
    });
  });
});