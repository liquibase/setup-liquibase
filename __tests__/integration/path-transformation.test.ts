import { setupLiquibase } from '../../src/installer';
import { transformLiquibaseEnvironmentVariables } from '../../src/index';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('Liquibase file path transformation integration tests', () => {
  const originalEnv = process.env.LIQUIBASE_LOG_FILE;
  
  afterEach(() => {
    // Restore original environment variable
    if (originalEnv) {
      process.env.LIQUIBASE_LOG_FILE = originalEnv;
    } else {
      delete process.env.LIQUIBASE_LOG_FILE;
    }
  });

  it('should succeed when LIQUIBASE_LOG_FILE is not set', async () => {
    delete process.env.LIQUIBASE_LOG_FILE;
    
    const options = {
      version: '4.32.0',
      edition: 'oss' as const,
      cache: false
    };

    const result = await setupLiquibase(options);
    expect(result).toBeDefined();
    expect(result.version).toBe('4.32.0');
  }, 60000);

  it('should create log directory and succeed when LIQUIBASE_LOG_FILE path does not exist', async () => {
    const tempDir = path.join(os.tmpdir(), `liquibase-test-${Date.now()}`);
    const logFilePath = path.join(tempDir, 'logs', 'liquibase.log');
    
    process.env.LIQUIBASE_LOG_FILE = logFilePath;
    
    // Ensure directory doesn't exist initially
    expect(fs.existsSync(path.dirname(logFilePath))).toBe(false);
    
    const options = {
      version: '4.32.0',
      edition: 'oss' as const,
      cache: false
    };

    const result = await setupLiquibase(options);
    expect(result).toBeDefined();
    expect(result.version).toBe('4.32.0');
    
    // Directory should now exist
    expect(fs.existsSync(path.dirname(logFilePath))).toBe(true);
    
    // Clean up
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  }, 60000);

  it('should succeed when LIQUIBASE_LOG_FILE directory already exists', async () => {
    const tempDir = path.join(os.tmpdir(), `liquibase-test-existing-${Date.now()}`);
    const logFilePath = path.join(tempDir, 'liquibase.log');
    
    // Create directory first
    fs.mkdirSync(tempDir, { recursive: true });
    process.env.LIQUIBASE_LOG_FILE = logFilePath;
    
    const options = {
      version: '4.32.0',
      edition: 'oss' as const,
      cache: false
    };

    const result = await setupLiquibase(options);
    expect(result).toBeDefined();
    expect(result.version).toBe('4.32.0');
    
    // Directory should still exist
    expect(fs.existsSync(tempDir)).toBe(true);
    
    // Clean up
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  }, 60000);

  it('should handle relative log file paths', async () => {
    const relativePath = './tmp/logs/liquibase.log';
    const absolutePath = path.resolve(relativePath);
    const logDir = path.dirname(absolutePath);
    
    process.env.LIQUIBASE_LOG_FILE = relativePath;
    
    const options = {
      version: '4.32.0',
      edition: 'oss' as const,
      cache: false
    };

    const result = await setupLiquibase(options);
    expect(result).toBeDefined();
    expect(result.version).toBe('4.32.0');
    
    // Directory should exist
    expect(fs.existsSync(logDir)).toBe(true);
    
    // Clean up
    const cleanupPath = path.join('.', 'tmp');
    if (fs.existsSync(cleanupPath)) {
      fs.rmSync(cleanupPath, { recursive: true });
    }
  }, 60000);

  it('should transform problematic absolute paths to workspace-relative paths', async () => {
    const originalPath = '/liquibase/changelog/liquibase.dev.log.json';
    const expectedTransformedPath = path.join('.', 'liquibase', 'changelog', 'liquibase.dev.log.json');
    
    process.env.LIQUIBASE_LOG_FILE = originalPath;
    
    // Call transformation function as it would be called at action startup
    await transformLiquibaseEnvironmentVariables();
    
    const options = {
      version: '4.32.0',
      edition: 'oss' as const,
      cache: false
    };

    const result = await setupLiquibase(options);
    expect(result).toBeDefined();
    expect(result.version).toBe('4.32.0');
    
    // Environment variable should be transformed
    expect(process.env.LIQUIBASE_LOG_FILE).toBe(expectedTransformedPath);
    
    // Directory should exist in workspace
    const expectedDir = path.resolve('.', 'liquibase', 'changelog');
    expect(fs.existsSync(expectedDir)).toBe(true);
    
    // Clean up
    const cleanupDir = path.join('.', 'liquibase');
    if (fs.existsSync(cleanupDir)) {
      fs.rmSync(cleanupDir, { recursive: true });
    }
  }, 60000);

  it('should handle multiple Liquibase environment variables with problematic paths', async () => {
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
    
    // Call transformation function as it would be called at action startup
    await transformLiquibaseEnvironmentVariables();
    
    const options = {
      version: '4.32.0',
      edition: 'oss' as const,
      cache: false
    };

    const result = await setupLiquibase(options);
    expect(result).toBeDefined();
    expect(result.version).toBe('4.32.0');
    
    // All environment variables should be transformed to workspace-relative
    expect(process.env.LIQUIBASE_LOG_FILE).toBe(path.join('.', 'liquibase', 'logs', 'app.log'));
    expect(process.env.LIQUIBASE_OUTPUT_FILE).toBe(path.join('.', 'usr', 'local', 'output', 'result.sql'));
    expect(process.env.LIQUIBASE_PROPERTIES_FILE).toBe(path.join('.', 'etc', 'liquibase', 'liquibase.properties'));
    expect(process.env.LIQUIBASE_REPORT_PATH).toBe(path.join('.', 'var', 'reports') + path.sep);
    
    // Directories should exist in workspace for file paths
    expect(fs.existsSync(path.resolve('.', 'liquibase', 'logs'))).toBe(true);
    expect(fs.existsSync(path.resolve('.', 'usr', 'local', 'output'))).toBe(true);
    expect(fs.existsSync(path.resolve('.', 'etc', 'liquibase'))).toBe(true);
    // Note: LIQUIBASE_REPORT_PATH is a directory path, not a file path, so directory creation is not expected
    
    // Clean up
    const cleanupDirs = [
      path.join('.', 'liquibase'), 
      path.join('.', 'usr'), 
      path.join('.', 'etc'), 
      path.join('.', 'var')
    ];
    cleanupDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
      }
    });
    
    // Clean up environment variables
    Object.keys(envVarsToTest).forEach(key => {
      delete process.env[key];
    });
  }, 90000); // Longer timeout for the most complex test
});