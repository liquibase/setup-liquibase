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
});

describe('setupLiquibase', () => {
  it('should reject versions below minimum supported version', async () => {
    const options = {
      version: '4.25.0', // Below 4.32.0
      edition: 'oss' as const,
      cache: false,
      checkLatest: false
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      `Version 4.25.0 is not supported. Minimum supported version is ${MIN_SUPPORTED_VERSION}`
    );
  });

  it('should reject invalid version formats', async () => {
    const options = {
      version: 'invalid-version',
      edition: 'oss' as const,
      cache: false,
      checkLatest: false
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'Invalid version format: invalid-version. Must be a valid semantic version (e.g., "4.32.0")'
    );
  });

  it('should reject Pro edition without license key', async () => {
    const options = {
      version: '4.32.0',
      edition: 'pro' as const,
      cache: false,
      checkLatest: false
    };

    await expect(setupLiquibase(options)).rejects.toThrow(
      'License key is required for Liquibase Pro edition'
    );
  });
}); 