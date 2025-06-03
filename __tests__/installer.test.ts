import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import { HttpClient } from '@actions/http-client';
import { setupLiquibase } from '../src/installer';

jest.mock('@actions/core');
jest.mock('@actions/tool-cache');
jest.mock('@actions/exec');
jest.mock('@actions/http-client');

const mockCore = core as jest.Mocked<typeof core>;
const mockTc = tc as jest.Mocked<typeof tc>;
const mockExec = exec as jest.Mocked<typeof exec>;
const mockHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe('setupLiquibase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTc.find.mockReturnValue('');
    mockTc.downloadTool.mockResolvedValue('/tmp/liquibase.tar.gz');
    mockTc.extractTar.mockResolvedValue('/tmp/extracted');
    mockTc.cacheDir.mockResolvedValue('/cache/liquibase');
    mockExec.exec.mockResolvedValue(0);
  });

  it('should setup Liquibase OSS with latest version', async () => {
    const mockGetJson = jest.fn().mockResolvedValue({
      result: { tag_name: 'v4.25.0' }
    });
    mockHttpClient.prototype.getJson = mockGetJson;

    const result = await setupLiquibase({
      version: 'latest',
      edition: 'oss',
      cache: true,
      checkLatest: false
    });

    expect(result.version).toBe('4.25.0');
    expect(result.path).toBe('/cache/liquibase');
    expect(mockTc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/liquibase/liquibase/releases/download/v4.25.0/liquibase-4.25.0.tar.gz'
    );
  });

  it('should setup Liquibase Pro with license key', async () => {
    const mockGetJson = jest.fn().mockResolvedValue({
      result: [{ version: '4.25.0' }]
    });
    mockHttpClient.prototype.getJson = mockGetJson;

    const result = await setupLiquibase({
      version: 'latest',
      edition: 'pro',
      licenseKey: 'test-license-key',
      cache: true,
      checkLatest: false
    });

    expect(result.version).toBe('4.25.0');
    expect(result.path).toBe('/cache/liquibase');
  });

  it('should throw error when Pro license key is missing', async () => {
    const mockGetJson = jest.fn().mockResolvedValue({
      result: [{ version: '4.25.0' }]
    });
    mockHttpClient.prototype.getJson = mockGetJson;

    await expect(
      setupLiquibase({
        version: 'latest',
        edition: 'pro',
        cache: true,
        checkLatest: false
      })
    ).rejects.toThrow();
  });

  it('should use cached version when available', async () => {
    mockTc.find.mockReturnValue('/cache/liquibase');

    const result = await setupLiquibase({
      version: '4.25.0',
      edition: 'oss',
      cache: true,
      checkLatest: false
    });

    expect(result.path).toBe('/cache/liquibase');
    expect(mockTc.downloadTool).not.toHaveBeenCalled();
    expect(mockCore.info).toHaveBeenCalledWith('Found cached Liquibase oss version 4.25.0');
  });

  it('should handle specific version', async () => {
    const result = await setupLiquibase({
      version: '4.24.0',
      edition: 'oss',
      cache: true,
      checkLatest: false
    });

    expect(result.version).toBe('4.24.0');
    expect(mockTc.downloadTool).toHaveBeenCalledWith(
      'https://github.com/liquibase/liquibase/releases/download/v4.24.0/liquibase-4.24.0.tar.gz'
    );
  });
});