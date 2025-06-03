import * as core from '@actions/core';
import { HttpClient } from '@actions/http-client';
import * as semver from 'semver';
import { API_ENDPOINTS } from './config';

export class VersionResolver {
  private static instance: VersionResolver;
  private http: HttpClient;
  private versionCache: Map<string, string[]> = new Map();
  private latestVersionCache: Map<string, string> = new Map();

  private constructor() {
    this.http = new HttpClient('setup-liquibase');
  }

  public static getInstance(): VersionResolver {
    if (!VersionResolver.instance) {
      VersionResolver.instance = new VersionResolver();
    }
    return VersionResolver.instance;
  }

  public async resolveVersion(version: string, edition: string, checkLatest: boolean): Promise<string> {
    // Handle 'latest' version or forced latest check
    if (version === 'latest' || checkLatest) {
      return await this.getLatestVersion(edition);
    }

    // If it's already a valid exact version, return as-is
    if (semver.valid(version)) {
      return version;
    }

    // For version ranges, find the best matching version from available releases
    const availableVersions = await this.getAvailableVersions(edition);
    const matchedVersion = semver.maxSatisfying(availableVersions, version);

    if (!matchedVersion) {
      throw new Error(`No version matching ${version} found for Liquibase ${edition}`);
    }

    return matchedVersion;
  }

  private async getLatestVersion(edition: string): Promise<string> {
    // Check cache first
    const cachedVersion = this.latestVersionCache.get(edition);
    if (cachedVersion) {
      return cachedVersion;
    }

    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      if (edition === 'oss') {
        const response = await this.http.getJson<{ tag_name: string }>(API_ENDPOINTS.OSS_LATEST, headers);
        if (response.result?.tag_name) {
          const version = response.result.tag_name.replace(/^v/, '');
          this.latestVersionCache.set(edition, version);
          return version;
        }
      } else {
        const response = await this.http.getJson<Array<{ version: string }>>(API_ENDPOINTS.PRO_RELEASES);
        if (response.result && response.result.length > 0) {
          const version = response.result[0].version;
          this.latestVersionCache.set(edition, version);
          return version;
        }
      }
    } catch (error) {
      // If we hit rate limit without token, try with a hardcoded latest version
      if (!token && error.message?.includes('rate limit')) {
        core.warning('GitHub API rate limit exceeded. Using hardcoded latest version.');
        const fallbackVersion = edition === 'oss' ? '4.25.0' : '4.25.0';
        this.latestVersionCache.set(edition, fallbackVersion);
        return fallbackVersion;
      }
      throw error;
    }

    throw new Error(`Could not determine latest version for Liquibase ${edition}`);
  }

  private async getAvailableVersions(edition: string): Promise<string[]> {
    // Check cache first
    const cachedVersions = this.versionCache.get(edition);
    if (cachedVersions) {
      return cachedVersions;
    }

    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      if (edition === 'oss') {
        const response = await this.http.getJson<Array<{ tag_name: string }>>(API_ENDPOINTS.OSS_RELEASES, headers);
        if (response.result) {
          const versions = response.result.map(release => release.tag_name.replace(/^v/, ''));
          this.versionCache.set(edition, versions);
          return versions;
        }
      } else {
        const response = await this.http.getJson<Array<{ version: string }>>(API_ENDPOINTS.PRO_RELEASES);
        if (response.result) {
          const versions = response.result.map(release => release.version);
          this.versionCache.set(edition, versions);
          return versions;
        }
      }
    } catch (error) {
      // If we hit rate limit without token, return a reasonable set of recent versions
      if (!token && error.message?.includes('rate limit')) {
        core.warning('GitHub API rate limit exceeded. Using hardcoded version list.');
        const fallbackVersions = ['4.25.0', '4.24.0', '4.23.0', '4.22.0', '4.21.0'];
        this.versionCache.set(edition, fallbackVersions);
        return fallbackVersions;
      }
      throw error;
    }

    return [];
  }
} 