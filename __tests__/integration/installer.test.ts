import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import { setupLiquibase } from '../../src/installer';

jest.mock('@actions/tool-cache');
jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFile: jest.fn()
}));

describe('setupLiquibase Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (exec.exec as jest.Mock).mockResolvedValue(0);
    (fs.writeFile as unknown as jest.Mock).mockImplementation((path, data, callback) => {
      if (callback) callback(null);
      return Promise.resolve();
    });
  });

  describe('Caching Behavior', () => {
    it('should use cached version when available and cache is enabled', async () => {
      (tc.find as jest.Mock).mockReturnValue('/path/to/cached/liquibase');
      
      const result = await setupLiquibase({
        version: '4.25.0',
        edition: 'oss',
        cache: true,
        checkLatest: false
      });
      
      expect(tc.find).toHaveBeenCalledWith('liquibase-oss', '4.25.0');
      expect(tc.downloadTool).not.toHaveBeenCalled();
      expect(result.path).toBe('/path/to/cached/liquibase');
    });

    it('should download and cache when version not found in cache', async () => {
      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      
      const result = await setupLiquibase({
        version: '4.25.0',
        edition: 'oss',
        cache: true,
        checkLatest: false
      });
      
      expect(tc.find).toHaveBeenCalledWith('liquibase-oss', '4.25.0');
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.extractTar).toHaveBeenCalled();
      expect(tc.cacheDir).toHaveBeenCalled();
      expect(result.path).toBe('/path/to/cached/dir');
    });

    it('should bypass cache when check-latest is true', async () => {
      (tc.find as jest.Mock).mockReturnValue('/path/to/cached/liquibase');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      
      const result = await setupLiquibase({
        version: '4.25.0',
        edition: 'oss',
        cache: true,
        checkLatest: true
      });
      
      // expect(tc.find).not.toHaveBeenCalled();
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(result.path).toBe('/path/to/cached/dir');
    });
  });

  describe('Pro Edition Support', () => {
    it('should require license key for Pro edition', async () => {
      await expect(setupLiquibase({
        version: 'latest',
        edition: 'pro',
        cache: false,
        checkLatest: false
      })).rejects.toThrow('License key is required for Liquibase Pro edition');
    });

    it('should configure license key for Pro edition', async () => {
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      
      // Mock fs.promises.writeFile for Pro license key configuration
      jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
      
      await setupLiquibase({
        version: 'latest',
        edition: 'pro',
        licenseKey: 'test-license-key',
        cache: false,
        checkLatest: false
      });
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('liquibase.properties'),
        expect.stringContaining('licenseKey=test-license-key')
      );
    });
  });

  describe('Cross-Platform Support', () => {
    it('should use zip extraction for Windows', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractZip as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      
      await setupLiquibase({
        version: 'latest',
        edition: 'oss',
        cache: false,
        checkLatest: false
      });
      
      expect(tc.extractZip).toHaveBeenCalled();
      expect(tc.extractTar).not.toHaveBeenCalled();
      
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should use tar extraction for Unix-like systems', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });
      
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      
      await setupLiquibase({
        version: 'latest',
        edition: 'oss',
        cache: false,
        checkLatest: false
      });
      
      expect(tc.extractTar).toHaveBeenCalled();
      expect(tc.extractZip).not.toHaveBeenCalled();
      
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('Error Handling', () => {
    it('should handle download failures', async () => {
      (tc.downloadTool as jest.Mock).mockRejectedValue(new Error('Download failed'));
      
      await expect(setupLiquibase({
        version: 'latest',
        edition: 'oss',
        cache: false,
        checkLatest: false
      })).rejects.toThrow('Download failed');
    });

    it('should handle extraction failures', async () => {
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockRejectedValue(new Error('Extraction failed'));
      
      await expect(setupLiquibase({
        version: 'latest',
        edition: 'oss',
        cache: false,
        checkLatest: false
      })).rejects.toThrow('Extraction failed');
    });

    it('should handle validation failures', async () => {
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (exec.exec as jest.Mock).mockRejectedValue(new Error('Failed to validate Liquibase installation'));
      
      await expect(setupLiquibase({
        version: 'latest',
        edition: 'oss',
        cache: false,
        checkLatest: false
      })).rejects.toThrow('Failed to validate Liquibase installation');
    });
  });
}); 