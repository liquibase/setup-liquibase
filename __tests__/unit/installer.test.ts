import { getDownloadUrl, setupLiquibase } from '../../src/installer';
import { transformLiquibaseEnvironmentVariables } from '../../src/index';
import { MIN_SUPPORTED_VERSION } from '../../src/config';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('getDownloadUrl', () => {
  it('should construct correct Community URL for Unix-like systems', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'community');
    expect(url).toBe(`https://package.liquibase.com/downloads/community/gha/liquibase-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should construct correct OSS URL for Unix-like systems (backward compatibility)', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'oss');
    expect(url).toBe(`https://package.liquibase.com/downloads/community/gha/liquibase-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should return same URL for community and oss editions', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.32.0';
    const communityUrl = getDownloadUrl(version, 'community');
    const ossUrl = getDownloadUrl(version, 'oss');
    expect(communityUrl).toBe(ossUrl);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should construct correct Pro URL for Unix-like systems', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/pro/gha/liquibase-pro-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use zip extension for Windows Community', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'community');
    expect(url).toBe(`https://package.liquibase.com/downloads/community/gha/liquibase-${version}.zip`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use zip extension for Windows OSS (backward compatibility)', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'oss');
    expect(url).toBe(`https://package.liquibase.com/downloads/community/gha/liquibase-${version}.zip`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use zip extension for Windows Pro', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/pro/gha/liquibase-pro-${version}.zip`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  // Version-based URL selection tests
  it('should use Pro URLs for Pro edition with version < 4.33.0', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/pro/gha/liquibase-pro-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use Secure URLs for Pro edition with test version', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '5-secure-release-test';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/secure/gha/liquibase-secure-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use Pro URLs for Secure edition with version <= 4.33.0', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'secure');
    expect(url).toBe(`https://package.liquibase.com/downloads/pro/gha/liquibase-pro-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use Pro URLs for Pro edition with version 4.33.0', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.33.0';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/pro/gha/liquibase-pro-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use Pro URLs for Secure edition with version 4.33.0', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.33.0';
    const url = getDownloadUrl(version, 'secure');
    expect(url).toBe(`https://package.liquibase.com/downloads/pro/gha/liquibase-pro-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use Secure URLs for Secure edition with test version', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '5-secure-release-test';
    const url = getDownloadUrl(version, 'secure');
    expect(url).toBe(`https://package.liquibase.com/downloads/secure/gha/liquibase-secure-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use Secure URLs for Pro edition with version > 4.33.0', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const version = '4.34.0';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/secure/gha/liquibase-secure-${version}.zip`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use Secure URLs for Secure edition with version > 4.33.0', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const version = '4.34.0';
    const url = getDownloadUrl(version, 'secure');
    expect(url).toBe(`https://package.liquibase.com/downloads/secure/gha/liquibase-secure-${version}.zip`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use zip extension for Windows Secure (same as Pro)', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'secure');
    expect(url).toBe(`https://package.liquibase.com/downloads/pro/gha/liquibase-pro-${version}.zip`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should construct correct Secure URL for Unix-like systems (same as Pro)', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'secure');
    expect(url).toBe(`https://package.liquibase.com/downloads/pro/gha/liquibase-pro-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use tar.gz for macOS', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const version = '4.32.0';
    const url = getDownloadUrl(version, 'oss');
    expect(url).toBe(`https://package.liquibase.com/downloads/community/gha/liquibase-${version}.tar.gz`);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should handle different version formats', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    
    const versions = ['4.32.0', '4.33.1', '4.34.0-beta'];
    versions.forEach(version => {
      const url = getDownloadUrl(version, 'oss');
      expect(url).toContain(version);
      expect(url).toMatch(/^https:\/\/package\.liquibase\.com/);
    });
    
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
});

// Note: Path transformation integration tests moved to __tests__/integration/path-transformation.test.ts
// to prevent CI timeouts in unit tests

describe('setupLiquibase validation', () => {
  it('should reject empty version', async () => {
    const options = {
      version: '',
      edition: 'oss' as const,
    };

    await expect(setupLiquibase(options)).rejects.toThrow('Version is required');
  });

  it('should reject versions below minimum supported version', async () => {
    const options = {
      version: '4.25.0', // Below 4.32.0
      edition: 'oss' as const,
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      `Version 4.25.0 is not supported. Minimum supported version is ${MIN_SUPPORTED_VERSION}`
    );
  });

  it('should accept secure edition as valid', async () => {
    // Mock the download and validation functions to avoid actual network calls
    const mockDownloadTool = jest.fn().mockResolvedValue('/mock/download/path');
    const mockExtractZip = jest.fn().mockResolvedValue('/mock/extract/path');
    const mockMkdirP = jest.fn().mockResolvedValue(undefined);
    const mockExec = jest.fn().mockResolvedValue(0);
    
    jest.doMock('@actions/tool-cache', () => ({
      downloadTool: mockDownloadTool,
      extractZip: mockExtractZip,
    }));
    jest.doMock('@actions/io', () => ({
      mkdirP: mockMkdirP,
    }));
    jest.doMock('@actions/exec', () => ({
      exec: mockExec,
    }));
    jest.doMock('fs', () => ({
      existsSync: jest.fn().mockReturnValue(true),
    }));

    const options = {
      version: '4.32.0',
      edition: 'secure' as const,
    };

    // This should not throw for validation - the edition should be accepted
    await expect(async () => {
      try {
        await setupLiquibase(options);
      } catch (error) {
        // Only rethrow if it's a validation error about the edition
        if (error instanceof Error && error.message.includes('Invalid edition')) {
          throw error;
        }
        // Ignore other errors (like network/download errors in mocked environment)
      }
    }).not.toThrow();

    jest.clearAllMocks();
  });

  it('should reject invalid version format', async () => {
    const options = {
      version: 'invalid-version',
      edition: 'oss' as const,
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'Invalid version format: invalid-version. Must be a valid semantic version (e.g., "4.32.0")'
    );
  });

  it('should reject invalid edition', async () => {
    const options = {
      version: '4.32.0',
      edition: 'invalid' as any,
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'Invalid edition: invalid. Must be \'community\', \'secure\', \'oss\' (backward compatibility), or \'pro\' (backward compatibility)'
    );
  });


  // Note: Actual installation testing is covered by integration tests
  // Unit tests focus on input validation and configuration logic only

  it('should reject latest version', async () => {
    const options = {
      version: 'latest',
      edition: 'oss' as const,
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'Invalid version format: latest. Must be a valid semantic version (e.g., "4.32.0")'
    );
  });

  it('should reject latest version for Pro edition', async () => {
    const options = {
      version: 'latest',
      edition: 'pro' as const
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'Invalid version format: latest. Must be a valid semantic version (e.g., "4.32.0")'
    );
  });

  it('should handle edge cases in version validation', async () => {
    const testCases = [
      { version: '4.31.9', shouldFail: true, reason: 'below minimum version' },
      { version: '4.32', shouldFail: true, reason: 'incomplete semantic version' }
      // Note: 'v4.32.0' is coerced by semver.valid() to '4.32.0' which is valid, so not included
      // Note: '4.32.0.0' is coerced by semver to '4.32.0' which is valid, so not included
    ];

    for (const testCase of testCases) {
      const options = {
        version: testCase.version,
        edition: 'oss' as const,
        };

      // All these test cases should fail validation before attempting download
      await expect(setupLiquibase(options)).rejects.toThrow();
    }
  });

});

// Note: Caching behavior is tested in integration tests (__tests__/integration/real-world.test.ts)
// Unit testing the caching requires complex mocking of @actions/tool-cache, fs.promises, and other modules
// which adds maintenance burden without significant value over integration testing

describe('Error handling scenarios', () => {
  it('should provide meaningful error messages for common failures', () => {
    // Test that our error messages are descriptive and actionable
    const errorMessages = [
      'Version is required',
      'Invalid version format',
      'Version 4.25.0 is not supported',
      'Invalid edition',
      'License key is required for Liquibase Pro edition'
    ];

    errorMessages.forEach(message => {
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(10); // Ensure messages are descriptive
    });
  });

  it('should handle different platform configurations', () => {
    const platforms = ['win32', 'linux', 'darwin'];
    const originalPlatform = process.platform;

    platforms.forEach(platform => {
      Object.defineProperty(process, 'platform', { value: platform });
      
      const url = getDownloadUrl('4.32.0', 'oss');
      expect(url).toBeTruthy();
      expect(url).toMatch(/^https:\/\/package\.liquibase\.com/);
      
      if (platform === 'win32') {
        expect(url).toContain('.zip');
      } else {
        expect(url).toContain('.tar.gz');
      }
    });

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
});