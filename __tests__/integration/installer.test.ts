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
        version: '4.32.0',
        edition: 'oss',
        cache: true
      });
      
      expect(tc.find).toHaveBeenCalledWith('liquibase-oss', '4.32.0');
      expect(tc.downloadTool).not.toHaveBeenCalled();
      expect(result.path).toBe('/path/to/cached/liquibase');
    });

    it('should download and cache when version not found in cache', async () => {
      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      
      const result = await setupLiquibase({
        version: '4.32.0',
        edition: 'oss',
        cache: true
      });
      
      expect(tc.find).toHaveBeenCalledWith('liquibase-oss', '4.32.0');
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.extractTar).toHaveBeenCalled();
      expect(tc.cacheDir).toHaveBeenCalled();
      expect(result.path).toBe('/path/to/cached/dir');
    });

    it('should not download when cache is disabled', async () => {
      (tc.find as jest.Mock).mockReturnValue('');
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/extract/dir');
      
      const result = await setupLiquibase({
        version: '4.32.0',
        edition: 'oss',
        cache: false
      });
      
      expect(tc.downloadTool).toHaveBeenCalled();
      expect(tc.cacheDir).not.toHaveBeenCalled();
      expect(result.path).toBe('/path/to/extract/dir');
    });
  });

  describe('Pro Edition Support', () => {
    it('should require license key for Pro edition', async () => {
      await expect(setupLiquibase({
        version: '4.32.0',
        edition: 'pro',
        cache: false
      })).rejects.toThrow('License key is required for Liquibase Pro edition');
    });

    it('should configure license key for Pro edition', async () => {
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      
      // Mock fs.promises.writeFile for Pro license key configuration
      jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
      
      await setupLiquibase({
        version: '4.32.0',
        edition: 'pro',
        licenseKey: 'test-license-key',
        cache: false
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
        version: '4.32.0',
        edition: 'oss',
        cache: false
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
        version: '4.32.0',
        edition: 'oss',
        cache: false
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
        version: '4.32.0',
        edition: 'oss',
        cache: false
      })).rejects.toThrow('Download failed');
    });

    it('should handle extraction failures', async () => {
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockRejectedValue(new Error('Extraction failed'));
      
      await expect(setupLiquibase({
        version: '4.32.0',
        edition: 'oss',
        cache: false
      })).rejects.toThrow('Extraction failed');
    });

    it('should handle validation failures', async () => {
      (tc.downloadTool as jest.Mock).mockResolvedValue('/path/to/downloaded/file');
      (tc.extractTar as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (tc.cacheDir as jest.Mock).mockResolvedValue('/path/to/cached/dir');
      (exec.exec as jest.Mock).mockRejectedValue(new Error('Failed to validate Liquibase installation'));
      
      await expect(setupLiquibase({
        version: '4.32.0',
        edition: 'oss',
        cache: false
      })).rejects.toThrow('Failed to validate Liquibase installation');
    });
  });
}); 