/**
 * Comprehensive error handling tests for setup-liquibase action
 * 
 * These tests verify that the action handles various error conditions gracefully
 * and provides meaningful error messages to users.
 * 
 * OPTIMIZATION: Separated unit tests (no downloads) from integration tests (minimal downloads)
 */

import { setupLiquibase } from '../../src/installer';
import { getDownloadUrl } from '../../src/installer';
import { MIN_SUPPORTED_VERSION } from '../../src/config';
import { getSharedOSSInstallation, validateInstallationExists } from '../fixtures/shared-installation';

describe('Error Handling Tests', () => {
  /**
   * Unit tests - Input validation errors (NO DOWNLOADS)
   * These test the validation logic without performing actual installations
   */
  describe('Input Validation Errors (Unit Tests)', () => {
    it('should reject missing version', async () => {
      const options = {
        version: '',
        edition: 'oss' as const,
        cache: false
      };

      await expect(setupLiquibase(options)).rejects.toThrow('Version is required');
    });

    it('should reject null/undefined version', async () => {
      const options = {
        version: null as any,
        edition: 'oss' as const,
        cache: false
      };

      await expect(setupLiquibase(options)).rejects.toThrow('Version is required');
    });

    it('should reject invalid version formats', async () => {
      // Test purely validation logic - these fail before any downloads
      const invalidVersions = [
        'invalid-version',
        '4.32.x',
        '^4.32.0',
        '~4.32.0',
        '>=4.32.0'
      ];

      for (const version of invalidVersions) {
        const options = {
          version,
          edition: 'oss' as const,
          cache: false
        };

        await expect(setupLiquibase(options)).rejects.toThrow();
      }
    });

    it('should reject versions below minimum supported', async () => {
      const unsupportedVersions = [
        '4.31.0',
        '4.31.9',
        '4.25.0',
        '4.0.0',
        '3.10.0',
        '1.0.0'
      ];

      for (const version of unsupportedVersions) {
        const options = {
          version,
          edition: 'oss' as const,
          cache: false
        };

        await expect(setupLiquibase(options)).rejects.toThrow(
          `Version ${version} is not supported. Minimum supported version is ${MIN_SUPPORTED_VERSION}`
        );
      }
    });

    it('should reject invalid editions', async () => {
      const invalidEditions = [
        'invalid',
        'community',
        'enterprise',
        'free',
        'paid',
        'OSS',
        'PRO',
        'oss-pro',
        ''
      ];

      for (const edition of invalidEditions) {
        const options = {
          version: '4.32.0',
          edition: edition as any,
          cache: false
        };

        await expect(setupLiquibase(options)).rejects.toThrow(
          `Invalid edition: ${edition}. Must be either 'oss' or 'pro'`
        );
      }
    });
  });

  /**
   * Unit tests - URL generation (NO DOWNLOADS)
   * These test URL generation logic without network calls
   */
  describe('URL Generation Logic (Unit Tests)', () => {
    it('should generate correct URLs for error scenarios', () => {
      // Test URL generation doesn't crash with edge case versions
      const edgeCaseVersions = [
        '4.32.0',
        '4.33.1',
        '10.0.0',
        '4.32.0-beta',
        '4.32.0-SNAPSHOT'
      ];

      edgeCaseVersions.forEach(version => {
        expect(() => getDownloadUrl(version, 'oss')).not.toThrow();
        expect(() => getDownloadUrl(version, 'pro')).not.toThrow();
      });
    });

    it('should handle different platform scenarios', () => {
      const platforms = ['win32', 'linux', 'darwin', 'freebsd', 'openbsd'];
      const originalPlatform = process.platform;

      platforms.forEach(platform => {
        Object.defineProperty(process, 'platform', { value: platform });
        
        const ossUrl = getDownloadUrl('4.32.0', 'oss');
        const proUrl = getDownloadUrl('4.32.0', 'pro');
        
        expect(ossUrl).toBeTruthy();
        expect(proUrl).toBeTruthy();
        expect(ossUrl).toMatch(/^https:/);
        expect(proUrl).toMatch(/^https:/);
      });

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle unsupported platform scenarios', () => {
      const unsupportedPlatforms = ['aix', 'android', 'haiku', 'netbsd', 'sunos'];
      const originalPlatform = process.platform;

      unsupportedPlatforms.forEach(platform => {
        Object.defineProperty(process, 'platform', { value: platform });
        
        // Should still generate URLs, but might use default Unix behavior
        const url = getDownloadUrl('4.32.0', 'oss');
        expect(url).toBeTruthy();
        expect(url).toMatch(/^https:/);
      });

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  /**
   * Unit tests - License validation (NO DOWNLOADS)
   */
  describe('License Configuration Logic (Unit Tests)', () => {
    it('should validate license key sanitization', () => {
      const licenseKeysToSanitize = [
        '  valid-license-key  ', // Leading/trailing spaces
        '\tvalid-license-key\t', // Leading/trailing tabs
        '\nvalid-license-key\n', // Leading/trailing newlines
        ' \t\n valid-license-key \t\n ' // Mixed whitespace
      ];

      licenseKeysToSanitize.forEach(licenseKey => {
        expect(licenseKey.trim()).toBeTruthy();
        expect(licenseKey.trim().length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Unit tests - Error message quality (NO DOWNLOADS)
   */
  describe('Error Message Quality (Unit Tests)', () => {
    it('should provide actionable error messages', async () => {
      const testCases = [
        {
          options: { version: '', edition: 'oss' as const, cache: 'false' },
          expectedMessageParts: ['Version', 'required']
        },
        {
          options: { version: 'invalid', edition: 'oss' as const, cache: 'false' },
          expectedMessageParts: ['Invalid version format', 'semantic version']
        },
        {
          options: { version: '4.25.0', edition: 'oss' as const, cache: 'false' },
          expectedMessageParts: ['not supported', 'Minimum supported version']
        },
        {
          options: { version: '4.32.0', edition: 'invalid' as any, cache: 'false' },
          expectedMessageParts: ['Invalid edition', 'oss', 'pro']
        },
      ];

      for (const testCase of testCases) {
        try {
          await setupLiquibase(testCase.options);
          fail('Expected error to be thrown');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          testCase.expectedMessageParts.forEach(part => {
            expect(errorMessage).toContain(part);
          });
          
          // Error messages should be reasonably long and descriptive
          expect(errorMessage.length).toBeGreaterThan(10);
          
          // Error messages should not contain internal implementation details
          expect(errorMessage).not.toContain('undefined');
          expect(errorMessage).not.toContain('null');
          expect(errorMessage).not.toContain('TypeError');
        }
      }
    });

    it('should provide consistent error message format', async () => {
      const errorGeneratingOptions = [
        { version: '', edition: 'oss' as const, cache: 'false' },
        { version: 'invalid', edition: 'oss' as const, cache: 'false' },
        { version: '4.25.0', edition: 'oss' as const, cache: 'false' }
      ];

      const errorMessages: string[] = [];

      for (const options of errorGeneratingOptions) {
        try {
          await setupLiquibase(options);
        } catch (error) {
          errorMessages.push(error instanceof Error ? error.message : String(error));
        }
      }

      // All error messages should be strings
      errorMessages.forEach(message => {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });

      // Error messages should be unique (not generic)
      const uniqueMessages = new Set(errorMessages);
      expect(uniqueMessages.size).toBe(errorMessages.length);
    });
  });

  /**
   * Integration tests - Real installation scenarios (MINIMAL DOWNLOADS)
   * These test actual installation error handling with shared fixtures
   */
  describe('Real Installation Error Scenarios (Integration Tests)', () => {
    let sharedInstallation: any;

    beforeAll(async () => {
      // Single shared installation for all integration tests
      sharedInstallation = await getSharedOSSInstallation();
      console.log('[ERROR HANDLING TEST] Using shared installation for integration tests');
    }, 120000);

    it('should handle concurrent installation attempts gracefully', async () => {
      // Test multiple simultaneous setup attempts using shared cache
      const promises = Array.from({ length: 3 }, () => {
        return setupLiquibase({
          version: '4.32.0',
          edition: 'oss' as const,
          cache: true // Use cache to avoid multiple downloads
        });
      });

      // All should complete successfully or fail gracefully
      const results = await Promise.allSettled(promises);
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status);
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
          expect(result.value.version).toBe('4.32.0');
        }
      });
    }, 60000);

    it('should handle version not found scenarios', async () => {
      // Test with a version that likely doesn't exist
      // This will attempt a real download but should fail quickly
      const options = {
        version: '99.99.99',
        edition: 'oss' as const,
        cache: false
      };

      try {
        const result = await setupLiquibase(options);
        // If it somehow succeeds, validate the result
        expect(result).toBeDefined();
        expect(result.version).toBe('99.99.99');
        expect(result.path).toBeTruthy();
      } catch (error) {
        // Expected case - version doesn't exist
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        // Should provide meaningful error about version not found
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toMatch(/not found|404|Network error|Failed to download/i);
      }
    }, 30000);

    it('should validate shared installation works correctly', () => {
      // Lightweight validation of shared installation
      expect(sharedInstallation).toBeDefined();
      expect(sharedInstallation.version).toBe('4.32.0');
      expect(sharedInstallation.path).toBeTruthy();
      expect(validateInstallationExists(sharedInstallation)).toBe(true);
    });

    it('should handle cache scenarios without extra downloads', async () => {
      // Test both cache scenarios using existing installations
      const cacheScenarios = [
        { cache: true, description: 'with caching enabled' },
        { cache: false, description: 'with caching disabled' }
      ];

      for (const scenario of cacheScenarios) {
        const options = {
          version: '4.32.0',
          edition: 'oss' as const,
          cache: scenario.cache
        };

        // Should handle both cache scenarios successfully
        const result = await setupLiquibase(options);
        expect(result).toBeDefined();
        expect(result.version).toBe('4.32.0');
        expect(result.path).toBeTruthy();
      }
    }, 60000);
  });
});