import { VersionResolver } from '../../src/version-resolver';
import { HttpClient } from '@actions/http-client';
import * as core from '@actions/core';
import { IncomingHttpHeaders } from 'http';

// Mock the dependencies
jest.mock('@actions/http-client');
jest.mock('@actions/core');

describe('VersionResolver', () => {
  let versionResolver: VersionResolver;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance
    (VersionResolver as any).instance = undefined;
    
    // Get a fresh instance
    versionResolver = VersionResolver.getInstance();
    
    // Mock the HTTP client
    mockHttpClient = new HttpClient('setup-liquibase') as jest.Mocked<HttpClient>;
    (HttpClient as jest.Mock).mockImplementation(() => mockHttpClient);
  });

  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = VersionResolver.getInstance();
      const instance2 = VersionResolver.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('resolveVersion', () => {
    const mockHeaders: IncomingHttpHeaders = {
      'content-type': 'application/json'
    };

    it('should return exact version when valid semver is provided', async () => {
      const result = await versionResolver.resolveVersion('4.25.0', 'oss', false);
      expect(result).toBe('4.25.0');
    });

    it('should fetch latest version when "latest" is specified', async () => {
      mockHttpClient.getJson.mockResolvedValueOnce({
        result: { tag_name: 'v4.25.0' },
        statusCode: 200,
        headers: mockHeaders
      });

      const result = await versionResolver.resolveVersion('latest', 'oss', false);
      expect(result).toBe('4.25.0');
      expect(mockHttpClient.getJson).toHaveBeenCalledWith(
        expect.stringContaining('/releases/latest'),
        expect.any(Object)
      );
    });

    it('should handle version ranges correctly', async () => {
      mockHttpClient.getJson.mockResolvedValueOnce({
        result: [
          { tag_name: 'v4.25.0' },
          { tag_name: 'v4.24.0' },
          { tag_name: 'v4.23.0' }
        ],
        statusCode: 200,
        headers: mockHeaders
      });

      const result = await versionResolver.resolveVersion('^4.24.0', 'oss', false);
      expect(result).toBe('4.25.0');
    });

    it('should use cached versions when available', async () => {
      // First call to populate cache
      mockHttpClient.getJson.mockResolvedValueOnce({
        result: { tag_name: 'v4.25.0' },
        statusCode: 200,
        headers: mockHeaders
      });
      await versionResolver.resolveVersion('latest', 'oss', false);

      // Second call should use cache
      mockHttpClient.getJson.mockClear();
      const result = await versionResolver.resolveVersion('latest', 'oss', false);
      expect(result).toBe('4.25.0');
      expect(mockHttpClient.getJson).not.toHaveBeenCalled();
    });

    it('should handle rate limit errors with fallback versions', async () => {
      mockHttpClient.getJson.mockRejectedValueOnce(new Error('API rate limit exceeded'));
      
      const result = await versionResolver.resolveVersion('latest', 'oss', false);
      expect(result).toBe('4.25.0');
      expect(core.warning).toHaveBeenCalledWith(
        expect.stringContaining('GitHub API rate limit exceeded')
      );
    });

    it('should handle Pro edition version resolution', async () => {
      mockHttpClient.getJson.mockResolvedValueOnce({
        result: { tag_name: 'v4.25.0' },
        statusCode: 200,
        headers: mockHeaders
      });

      const result = await versionResolver.resolveVersion('latest', 'pro', false);
      expect(result).toBe('4.25.0');
    });

    it('should throw error when no matching version is found', async () => {
      mockHttpClient.getJson.mockResolvedValueOnce({
        result: [
          { tag_name: 'v4.25.0' },
          { tag_name: 'v4.24.0' }
        ],
        statusCode: 200,
        headers: mockHeaders
      });

      await expect(
        versionResolver.resolveVersion('^5.0.0', 'oss', false)
      ).rejects.toThrow('No version matching');
    });
  });
}); 