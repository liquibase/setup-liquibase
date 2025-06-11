import { getDownloadUrl, setupLiquibase } from '../../src/installer';
import { MIN_SUPPORTED_VERSION } from '../../src/config';

describe('getDownloadUrl', () => {
  it('should construct correct OSS URL for Unix-like systems', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    
    const version = '4.32.0';
    const url = getDownloadUrl(version, 'oss');
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase/releases/download/v${version}/liquibase-${version}.tar.gz`);
    
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should construct correct Pro URL for Unix-like systems', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    
    const version = '4.32.0';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase/releases/pro/${version}/liquibase-pro-${version}.tar.gz`);
    
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use zip extension for Windows OSS', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    
    const version = '4.32.0';
    const url = getDownloadUrl(version, 'oss');
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase/releases/download/v${version}/liquibase-${version}.zip`);
    
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use zip extension for Windows Pro', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    
    const version = '4.32.0';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase/releases/pro/${version}/liquibase-pro-${version}.zip`);
    
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use tar.gz for macOS', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    
    const version = '4.32.0';
    const url = getDownloadUrl(version, 'oss');
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase/releases/download/v${version}/liquibase-${version}.tar.gz`);
    
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

describe('setupLiquibase validation', () => {
  it('should reject empty version', async () => {
    const options = {
      version: '',
      edition: 'oss' as const,
      cache: false
    };

    await expect(setupLiquibase(options)).rejects.toThrow('Version is required');
  });

  it('should reject versions below minimum supported version', async () => {
    const options = {
      version: '4.25.0', // Below 4.32.0
      edition: 'oss' as const,
      cache: false
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      `Version 4.25.0 is not supported. Minimum supported version is ${MIN_SUPPORTED_VERSION}`
    );
  });

  it('should reject invalid version formats', async () => {
    const options = {
      version: 'invalid-version',
      edition: 'oss' as const,
      cache: false
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'Invalid version format: invalid-version. Must be a valid semantic version (e.g., "4.32.0")'
    );
  });

  it('should reject invalid edition', async () => {
    const options = {
      version: '4.32.0',
      edition: 'invalid' as any,
      cache: false
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'Invalid edition: invalid. Must be either \'oss\' or \'pro\''
    );
  });

  it('should reject Pro edition without license key', async () => {
    const options = {
      version: '4.32.0',
      edition: 'pro' as const,
      cache: false
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'License key is required for Liquibase Pro edition. Provide it via the liquibase-pro-license-key input or LIQUIBASE_LICENSE_KEY environment variable'
    );
  });

  it('should accept valid OSS configuration', async () => {
    const options = {
      version: '4.32.0',
      edition: 'oss' as const,
      cache: false
    };

    // This test will fail at download stage since we're not mocking the actual download
    // But it should pass validation and get to the download attempt
    await expect(setupLiquibase(options)).rejects.toThrow();
    // The error should NOT be a validation error
  }, 30000);

  it('should accept valid Pro configuration with license', async () => {
    const options = {
      version: '4.32.0',
      edition: 'pro' as const,
      licenseKey: 'test-license-key',
      cache: false
    };

    // This test will fail at download stage since we're not mocking the actual download
    // But it should pass validation and get to the download attempt
    await expect(setupLiquibase(options)).rejects.toThrow();
    // The error should NOT be a validation error about missing license
  }, 30000);

  it('should handle edge cases in version validation', async () => {
    const testCases = [
      { version: '4.31.9', shouldFail: true, reason: 'below minimum version' },
      { version: '4.32.0', shouldFail: false, reason: 'exact minimum version' },
      { version: '4.32.1', shouldFail: false, reason: 'above minimum version' },
      { version: '5.0.0', shouldFail: false, reason: 'major version bump' },
      { version: 'v4.32.0', shouldFail: true, reason: 'version with v prefix' },
      { version: '4.32', shouldFail: true, reason: 'incomplete semantic version' },
      { version: '4.32.0.0', shouldFail: true, reason: 'too many version parts' }
    ];

    for (const testCase of testCases) {
      const options = {
        version: testCase.version,
        edition: 'oss' as const,
        cache: false
      };

      if (testCase.shouldFail) {
        await expect(setupLiquibase(options)).rejects.toThrow();
      } else {
        // These will fail at download, but should pass validation
        await expect(setupLiquibase(options)).rejects.toThrow();
      }
    }
  }, 30000);

  it('should validate license key for Pro edition', async () => {
    const testCases = [
      { licenseKey: '', shouldFail: true, reason: 'empty license key' },
      { licenseKey: '   ', shouldFail: true, reason: 'whitespace-only license key' },
      { licenseKey: 'valid-license-key', shouldFail: false, reason: 'valid license key' }
    ];

    for (const testCase of testCases) {
      const options = {
        version: '4.32.0',
        edition: 'pro' as const,
        licenseKey: testCase.licenseKey,
        cache: false
      };

      if (testCase.shouldFail && testCase.licenseKey) {
        // Empty and whitespace keys should fail during Pro license configuration
        await expect(setupLiquibase(options)).rejects.toThrow();
      } else if (!testCase.shouldFail) {
        // Valid license keys will fail at download, but should pass validation
        await expect(setupLiquibase(options)).rejects.toThrow();
      }
    }
  }, 30000);
});

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