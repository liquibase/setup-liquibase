import { VersionResolver } from '../../src/version-resolver';

describe('VersionResolver', () => {
  let versionResolver: VersionResolver;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance
    (VersionResolver as any).instance = undefined;
    
    // Get a fresh instance
    versionResolver = VersionResolver.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = VersionResolver.getInstance();
      const instance2 = VersionResolver.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('resolveVersion', () => {
    it('should return exact version when valid semver is provided', async () => {
      const result = await versionResolver.resolveVersion('4.32.0');
      expect(result).toBe('4.32.0');
    });

    it('should handle different valid semantic versions', async () => {
      const testVersions = ['4.32.0', '4.33.1', '5.0.0'];
      
      for (const version of testVersions) {
        const result = await versionResolver.resolveVersion(version);
        expect(result).toBe(version);
      }
    });

    it('should consistently return the same version', async () => {
      const result1 = await versionResolver.resolveVersion('4.32.0');
      const result2 = await versionResolver.resolveVersion('4.32.0');
      
      expect(result1).toBe('4.32.0');
      expect(result2).toBe('4.32.0');
      expect(result1).toBe(result2);
    });
  });
});