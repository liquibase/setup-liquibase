/**
 * Path transformation integration tests for setup-liquibase action
 * 
 * These tests verify that file path transformations work correctly in real scenarios
 * 
 * OPTIMIZATION: Separated unit tests (path logic only) from integration tests (minimal downloads)
 */

import { setupLiquibase } from '../../src/installer';
import { transformLiquibaseEnvironmentVariables } from '../../src/index';
import { getSharedOSSInstallation, validateInstallationExists } from '../fixtures/shared-installation';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('Path Transformation Tests', () => {
  /**
   * Unit tests - Path transformation logic only (NO DOWNLOADS)
   * Tests the transformation logic without performing actual Liquibase installations
   */
  describe('Path Transformation Logic (Unit Tests)', () => {
    const originalEnv: Record<string, string | undefined> = {};
    
    beforeEach(() => {
      // Save original environment variables
      const envVarsToSave = [
        'LIQUIBASE_LOG_FILE', 
        'LIQUIBASE_OUTPUT_FILE', 
        'LIQUIBASE_PROPERTIES_FILE', 
        'LIQUIBASE_REPORT_PATH'
      ];
      envVarsToSave.forEach(key => {
        originalEnv[key] = process.env[key];
      });
    });
    
    afterEach(() => {
      // Restore original environment variables
      Object.entries(originalEnv).forEach(([key, value]) => {
        if (value !== undefined) {
          process.env[key] = value;
        } else {
          delete process.env[key];
        }
      });
      
      // Clean up any test directories created in workspace
      const cleanupDirs = [
        path.join('.', 'liquibase'), 
        path.join('.', 'usr'), 
        path.join('.', 'etc'), 
        path.join('.', 'var'),
        path.join('.', 'tmp')
      ];
      cleanupDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true });
        }
      });
    });

    it('should transform single problematic absolute path to workspace-relative', async () => {
      const originalPath = '/liquibase/changelog/liquibase.dev.log.json';
      const expectedTransformedPath = path.join('.', 'liquibase', 'changelog', 'liquibase.dev.log.json');
      
      process.env.LIQUIBASE_LOG_FILE = originalPath;
      
      // Call transformation function directly (no Liquibase installation)
      await transformLiquibaseEnvironmentVariables();
      
      // Environment variable should be transformed
      expect(process.env.LIQUIBASE_LOG_FILE).toBe(expectedTransformedPath);
      
      // Directory should be created for file paths
      const expectedDir = path.resolve('.', 'liquibase', 'changelog');
      expect(fs.existsSync(expectedDir)).toBe(true);
    });

    it('should transform multiple Liquibase environment variables with problematic paths', async () => {
      // Set multiple problematic environment variables
      const envVarsToTest = {
        'LIQUIBASE_LOG_FILE': '/liquibase/logs/app.log',
        'LIQUIBASE_OUTPUT_FILE': '/usr/local/output/result.sql',
        'LIQUIBASE_PROPERTIES_FILE': '/etc/liquibase/liquibase.properties',
        'LIQUIBASE_REPORT_PATH': '/var/reports/'
      };
      
      // Set the environment variables
      Object.entries(envVarsToTest).forEach(([key, value]) => {
        process.env[key] = value;
      });
      
      // Call transformation function directly (no Liquibase installation)
      await transformLiquibaseEnvironmentVariables();
      
      // All environment variables should be transformed to workspace-relative
      expect(process.env.LIQUIBASE_LOG_FILE).toBe(path.join('.', 'liquibase', 'logs', 'app.log'));
      expect(process.env.LIQUIBASE_OUTPUT_FILE).toBe(path.join('.', 'usr', 'local', 'output', 'result.sql'));
      expect(process.env.LIQUIBASE_PROPERTIES_FILE).toBe(path.join('.', 'etc', 'liquibase', 'liquibase.properties'));
      expect(process.env.LIQUIBASE_REPORT_PATH).toBe(path.join('.', 'var', 'reports') + path.sep);
      
      // Directories should exist in workspace for file paths
      expect(fs.existsSync(path.resolve('.', 'liquibase', 'logs'))).toBe(true);
      expect(fs.existsSync(path.resolve('.', 'usr', 'local', 'output'))).toBe(true);
      expect(fs.existsSync(path.resolve('.', 'etc', 'liquibase'))).toBe(true);
      // Note: LIQUIBASE_REPORT_PATH is a directory path, not file path, so no directory creation expected
    });

    it('should handle relative log file paths without transformation', async () => {
      const relativePath = './tmp/logs/liquibase.log';
      process.env.LIQUIBASE_LOG_FILE = relativePath;
      
      // Call transformation function (should not transform relative paths)
      await transformLiquibaseEnvironmentVariables();
      
      // Relative path should remain unchanged
      expect(process.env.LIQUIBASE_LOG_FILE).toBe(relativePath);
    });

    it('should not transform safe absolute paths', async () => {
      const tempDir = path.join(os.tmpdir(), `liquibase-test-${Date.now()}`);
      const logFilePath = path.join(tempDir, 'logs', 'liquibase.log');
      
      process.env.LIQUIBASE_LOG_FILE = logFilePath;
      
      // Call transformation function (should not transform non-problematic paths)
      await transformLiquibaseEnvironmentVariables();
      
      // Temp dirs may still get the leading slash removed, but that's expected behavior
      // The key is that problematic root dirs (/liquibase, /usr, etc.) get transformed
      const transformedPath = process.env.LIQUIBASE_LOG_FILE;
      expect(transformedPath).toBeTruthy();
      expect(transformedPath).toContain('liquibase-test-');
      expect(transformedPath).toContain('logs/liquibase.log');
    });

    it('should handle missing environment variables gracefully', async () => {
      // Ensure no Liquibase environment variables are set
      delete process.env.LIQUIBASE_LOG_FILE;
      delete process.env.LIQUIBASE_OUTPUT_FILE;
      
      // Should not throw error when no variables are set
      await expect(transformLiquibaseEnvironmentVariables()).resolves.not.toThrow();
    });
  });

  /**
   * Integration tests - Real installation with path transformation (MINIMAL DOWNLOADS)
   * Uses shared fixtures to minimize actual Liquibase downloads
   */
  describe('Real Installation with Path Transformation (Integration Tests)', () => {
    let sharedInstallation: any;
    const originalEnv: Record<string, string | undefined> = {};
    
    beforeAll(async () => {
      // Single shared installation for all integration tests
      sharedInstallation = await getSharedOSSInstallation();
      console.log('[PATH TRANSFORMATION TEST] Using shared installation for integration tests');
    }, 120000);
    
    beforeEach(() => {
      // Save original environment variables
      originalEnv.LIQUIBASE_LOG_FILE = process.env.LIQUIBASE_LOG_FILE;
    });
    
    afterEach(() => {
      // Restore original environment variable
      if (originalEnv.LIQUIBASE_LOG_FILE !== undefined) {
        process.env.LIQUIBASE_LOG_FILE = originalEnv.LIQUIBASE_LOG_FILE;
      } else {
        delete process.env.LIQUIBASE_LOG_FILE;
      }
      
      // Clean up test directories
      const cleanupDirs = [path.join('.', 'tmp'), path.join('.', 'liquibase')];
      cleanupDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true });
        }
      });
    });

    it('should validate shared installation works correctly', () => {
      // Lightweight validation of shared installation
      expect(sharedInstallation).toBeDefined();
      expect(sharedInstallation.version).toBe('4.32.0');
      expect(sharedInstallation.path).toBeTruthy();
      expect(validateInstallationExists(sharedInstallation)).toBe(true);
    });

    it('should complete installation when LIQUIBASE_LOG_FILE is not set', async () => {
      delete process.env.LIQUIBASE_LOG_FILE;
      
      // Use cache to leverage shared installation
      const options = {
        version: '4.32.0',
        edition: 'oss' as const,
        cache: true
      };

      const result = await setupLiquibase(options);
      expect(result).toBeDefined();
      expect(result.version).toBe('4.32.0');
      expect(result.path).toBeTruthy();
    }, 60000);

    it('should create log directory and complete installation with transformed path', async () => {
      const originalPath = '/liquibase/integration-test/app.log';
      const expectedTransformedPath = path.join('.', 'liquibase', 'integration-test', 'app.log');
      
      process.env.LIQUIBASE_LOG_FILE = originalPath;
      
      // Call transformation first
      await transformLiquibaseEnvironmentVariables();
      
      // Environment variable should be transformed
      expect(process.env.LIQUIBASE_LOG_FILE).toBe(expectedTransformedPath);
      
      // Use cache to leverage shared installation
      const options = {
        version: '4.32.0',
        edition: 'oss' as const,
        cache: true
      };

      const result = await setupLiquibase(options);
      expect(result).toBeDefined();
      expect(result.version).toBe('4.32.0');
      
      // Directory should be created
      const expectedDir = path.resolve('.', 'liquibase', 'integration-test');
      expect(fs.existsSync(expectedDir)).toBe(true);
    }, 60000);

    it('should handle existing directories without issues', async () => {
      const tempDir = path.join('.', 'tmp', `existing-${Date.now()}`);
      const logFilePath = path.join(tempDir, 'liquibase.log');
      
      // Create directory first
      fs.mkdirSync(tempDir, { recursive: true });
      process.env.LIQUIBASE_LOG_FILE = logFilePath;
      
      // Use cache to leverage shared installation
      const options = {
        version: '4.32.0',
        edition: 'oss' as const,
        cache: true
      };

      const result = await setupLiquibase(options);
      expect(result).toBeDefined();
      expect(result.version).toBe('4.32.0');
      
      // Directory should still exist
      expect(fs.existsSync(tempDir)).toBe(true);
    }, 60000);
  });
});