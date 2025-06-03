import { getDownloadUrl } from '../../src/installer';

describe('getDownloadUrl', () => {
  it('should construct correct OSS URL for latest version', () => {
    const version = '4.32.0';
    const url = getDownloadUrl(version);
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase/releases/download/v${version}/liquibase-${version}.tar.gz`);
  });

  it('should construct correct Pro URL when edition is pro', () => {
    const version = '4.32.0';
    const url = getDownloadUrl(version, 'pro');
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase-pro/releases/download/v${version}/liquibase-pro-${version}.tar.gz`);
  });

  it('should use zip extension for Windows', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    
    const version = '4.32.0';
    const url = getDownloadUrl(version);
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase/releases/download/v${version}/liquibase-${version}.zip`);
    
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should use tar.gz extension for Unix-like systems', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    
    const version = '4.32.0';
    const url = getDownloadUrl(version);
    expect(url).toBe(`https://package.liquibase.com/downloads/cli/liquibase/releases/download/v${version}/liquibase-${version}.tar.gz`);
    
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
}); 