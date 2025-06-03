import * as core from '@actions/core';
import { HttpClient } from '@actions/http-client';
import * as semver from 'semver';
import { API_ENDPOINTS } from './config';

interface GitHubRelease {
  tag_name: string;
}

interface ProVersion {
  version: string;
}

export class VersionResolver {
  private static instance: VersionResolver;
  private http: HttpClient;
  private versionCache: Map<string, string[]> = new Map();
  private latestVersionCache: Map<string, string> = new Map();
  private readonly FALLBACK_VERSION = '4.25.0';

  private constructor() {
    this.http = new HttpClient('setup-liquibase');
  }

  public static getInstance(): VersionResolver {
    if (!VersionResolver.instance) {
      VersionResolver.instance = new VersionResolver();
    }
    return VersionResolver.instance;
  }

  private isRateLimitError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('rate limit');
  }

  public async resolveVersion(version: string, edition: string, checkLatest: boolean): Promise<string> {
    // Handle 'latest' version or forced latest check
    if (version === 'latest' || checkLatest) {
      return await this.getLatestVersion();
    }

    // If it's already a valid exact version, return as-is
    if (semver.valid(version)) {
      return version;
    }

    // For version ranges, find the best matching version from available releases
    const availableVersions = await this.getAvailableVersions();
    const matchedVersion = semver.maxSatisfying(availableVersions, version);

    if (!matchedVersion) {
      throw new Error(`No version matching ${version} found for Liquibase ${edition}`);
    }

    return matchedVersion;
  }

  private async getLatestVersion(): Promise<string> {
    // Check cache first
    const cachedVersion = this.latestVersionCache.get('oss'); // Use 'oss' as the cache key for both
    if (cachedVersion) {
      return cachedVersion;
    }

    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Use GitHub releases endpoint for both OSS and Pro
      const response = await this.http.getJson<{ tag_name: string }>(API_ENDPOINTS.OSS_LATEST, headers);
      if (response.result?.tag_name) {
        const version = response.result.tag_name.replace(/^v/, '');
        this.latestVersionCache.set('oss', version);
        return version;
      }
    } catch (error) {
      if (!token && this.isRateLimitError(error)) {
        core.warning('GitHub API rate limit exceeded. Using fallback version.');
        const fallbackVersion = this.FALLBACK_VERSION;
        this.latestVersionCache.set('oss', fallbackVersion);
        return fallbackVersion;
      }
      throw error;
    }

    throw new Error(`Could not determine latest version for Liquibase`);
  }

  private async getAvailableVersions(): Promise<string[]> {
    // Check cache first
    const cachedVersions = this.versionCache.get('oss'); // Use 'oss' as the cache key for both
    if (cachedVersions) {
      return cachedVersions;
    }

    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Use GitHub releases endpoint for both OSS and Pro
      const response = await this.http.getJson<Array<{ tag_name: string }>>(API_ENDPOINTS.OSS_RELEASES, headers);
      if (response.result) {
        const versions = response.result.map(release => release.tag_name.replace(/^v/, ''));
        this.versionCache.set('oss', versions);
        return versions;
      }
    } catch (error) {
      if (!token && this.isRateLimitError(error)) {
        core.warning('GitHub API rate limit exceeded. Using fallback version.');
        const fallbackVersions = [
          this.FALLBACK_VERSION,
          '4.24.0',
          '4.23.0',
          '4.22.0',
          '4.21.0',
        ];
        this.versionCache.set('oss', fallbackVersions);
        return fallbackVersions;
      }
      throw error;
    }

    return [];
  }
} 