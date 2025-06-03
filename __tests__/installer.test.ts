import { DOWNLOAD_URLS, TEST_VERSIONS } from '../src/config';
import { getDownloadUrl, setupLiquibase } from '../src/installer';
import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

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
  addPath: jest.fn()
}));

// Mock the exec module
jest.mock('@actions/exec', () => ({
  exec: jest.fn().mockResolvedValue(0)
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
  });

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
}); 