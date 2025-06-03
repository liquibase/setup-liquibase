import { DOWNLOAD_URLS, TEST_VERSIONS } from '../src/config';
import { getDownloadUrl, setupLiquibase } from '../src/installer';
import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';

// Mock the tool-cache module
jest.mock('@actions/tool-cache', () => ({
  find: jest.fn(),
  cacheDir: jest.fn(),
  downloadTool: jest.fn(),
  extractTar: jest.fn(),
  extractZip: jest.fn()
}));

// Mock the core module
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  addPath: jest.fn(),
  setFailed: jest.fn(),
  warning: jest.fn()
}));

// Mock the exec module
jest.mock('@actions/exec', () => ({
  exec: jest.fn().mockResolvedValue(0)
}));

// Mock the path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

// Mock the fs module
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('getDownloadUrl', () => {
  const testCases = [
    {
      version: TEST_VERSIONS.OSS,
      extension: 'tar.gz',
      description: 'latest OSS version'
    },
    {
      version: TEST_VERSIONS.OSS,
      extension: 'zip',
      description: 'Windows OSS version'
    }
  ];

  testCases.forEach(({ version, extension, description }) => {
    it(`should construct the correct download URL for ${description}`, () => {
      const expectedUrl = DOWNLOAD_URLS.OSS_TEMPLATE
        .replace(/{version}/g, version)
        .replace('{extension}', extension);
      expect(getDownloadUrl(version, extension)).toBe(expectedUrl);
    });
  });
});

describe('setupLiquibase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset exec mock to success by default
    (exec.exec as jest.Mock).mockResolvedValue(0);
  });

  describe('Caching Behavior', () => {
    it('should use cached version when cache is enabled and version is found', async () => {
      const cachedPath = '/path/to/cached/liquibase';
      (tc.find as jest.Mock).mockReturnValue(cachedPath);

      const result = await setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: false
      });

      expect(result.path).toBe(cachedPath);
      expect(tc.find).toHaveBeenCalledWith('liquibase-oss', TEST_VERSIONS.OSS);
      expect(tc.downloadTool).not.toHaveBeenCalled();
      expect(tc.cacheDir).not.toHaveBeenCalled();
    });

    it('should download and cache version when cache is enabled but version is not found', async () => {
      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/extracted/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');

      const result = await setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: false
      });

      expect(result.path).toBe('/path/to/cached/dir');
      expect(tc.find).toHaveBeenCalledWith('liquibase-oss', TEST_VERSIONS.OSS);
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.cacheDir).toHaveBeenCalled();
    });

    it('should bypass cache when checkLatest is enabled', async () => {
      const cachedPath = '/path/to/cached/liquibase';
      (tc.find as jest.Mock).mockReturnValue(cachedPath);
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/extracted/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');

      await setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: true
      });

      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.cacheDir).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid version format', async () => {
      await expect(setupLiquibase({
        version: 'invalid-version',
        cache: true,
        checkLatest: false
      })).rejects.toThrow();
    });

    it('should handle network failures during download', async () => {
      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: false
      })).rejects.toThrow('Network error');
    });

    it('should handle extraction failures', async () => {
      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockRejectedValue(new Error('Extraction failed'));

      await expect(setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: false
      })).rejects.toThrow('Extraction failed');
    });

    it('should handle validation failures', async () => {
      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/extracted/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (exec.exec as jest.Mock).mockRejectedValue(new Error('Validation failed'));

      await expect(setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: false
      })).rejects.toThrow('Validation failed');
    });
  });

  describe('Pro Edition', () => {
    it('should throw error when Pro edition is requested without license key', async () => {
      await expect(setupLiquibase({
        version: TEST_VERSIONS.OSS,
        edition: 'pro',
        cache: true,
        checkLatest: false
      })).rejects.toThrow('License key is required for Liquibase Pro edition');
    });

    it('should use Pro edition URL when Pro edition is specified', async () => {
      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/extracted/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');

      await setupLiquibase({
        version: TEST_VERSIONS.OSS,
        edition: 'pro',
        licenseKey: 'test-license-key',
        cache: true,
        checkLatest: false
      });

      expect(tc.downloadTool).toHaveBeenCalledWith(
        expect.stringContaining('liquibase-pro')
      );
    });

    it('should configure Pro license key', async () => {
      const toolPath = '/path/to/cached/dir';
      (tc.find as jest.Mock).mockReturnValue(toolPath);

      await setupLiquibase({
        version: TEST_VERSIONS.OSS,
        edition: 'pro',
        licenseKey: 'test-license-key',
        cache: true,
        checkLatest: false
      });

      expect(path.join).toHaveBeenCalledWith(toolPath, 'liquibase.properties');
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('liquibase.properties'),
        expect.stringContaining('test-license-key')
      );
    });
  });

  describe('Cross-Platform Support', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });

    it('should use .zip extension on Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractZip as jest.Mock).mockResolvedValue('/path/to/extracted/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');

      await setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: false
      });

      expect(tc.downloadTool).toHaveBeenCalledWith(
        expect.stringContaining('.zip')
      );
      expect(tc.extractZip).toHaveBeenCalled();
    });

    it('should use .tar.gz extension on Unix', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux'
      });

      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/extracted/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');

      await setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: false
      });

      expect(tc.downloadTool).toHaveBeenCalledWith(
        expect.stringContaining('.tar.gz')
      );
      expect(tc.extractTar).toHaveBeenCalled();
    });

    it('should use .bat extension for executable on Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const toolPath = '/path/to/cached/dir';
      (tc.find as jest.Mock).mockReturnValue(toolPath);

      await setupLiquibase({
        version: TEST_VERSIONS.OSS,
        cache: true,
        checkLatest: false
      });

      expect(exec.exec).toHaveBeenCalledWith(
        expect.stringContaining('.bat'),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });
}); 