import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';
import { HttpClient } from '@actions/http-client';
import * as semver from 'semver';

export interface LiquibaseSetupOptions {
  version: string;
  edition: 'oss' | 'pro';
  licenseKey?: string;
  cache: boolean;
  checkLatest: boolean;
}

export interface LiquibaseSetupResult {
  version: string;
  path: string;
}

export async function setupLiquibase(options: LiquibaseSetupOptions): Promise<LiquibaseSetupResult> {
  const { version, edition, licenseKey, cache, checkLatest } = options;
  
  const resolvedVersion = await resolveVersion(version, edition, checkLatest);
  const toolName = `liquibase-${edition}`;
  
  let toolPath = tc.find(toolName, resolvedVersion);
  
  if (!toolPath || !cache) {
    core.info(`Installing Liquibase ${edition} version ${resolvedVersion}`);
    const downloadUrl = getDownloadUrl(resolvedVersion, edition);
    const downloadPath = await tc.downloadTool(downloadUrl);
    
    const extractedPath = await extractLiquibase(downloadPath);
    
    if (cache) {
      toolPath = await tc.cacheDir(extractedPath, toolName, resolvedVersion);
    } else {
      toolPath = extractedPath;
    }
  } else {
    core.info(`Found cached Liquibase ${edition} version ${resolvedVersion}`);
  }
  
  const liquibaseBinPath = path.join(toolPath, 'liquibase');
  
  core.addPath(toolPath);
  
  if (edition === 'pro' && licenseKey) {
    await configureLiquibasePro(toolPath, licenseKey);
  }
  
  await validateInstallation(liquibaseBinPath);
  
  return {
    version: resolvedVersion,
    path: toolPath
  };
}

async function resolveVersion(version: string, edition: string, checkLatest: boolean): Promise<string> {
  if (version === 'latest' || checkLatest) {
    return await getLatestVersion(edition);
  }
  
  if (semver.valid(version)) {
    return version;
  }
  
  const availableVersions = await getAvailableVersions(edition);
  const matchedVersion = semver.maxSatisfying(availableVersions, version);
  
  if (!matchedVersion) {
    throw new Error(`No version matching ${version} found for Liquibase ${edition}`);
  }
  
  return matchedVersion;
}

async function getLatestVersion(edition: string): Promise<string> {
  const http = new HttpClient('setup-liquibase');
  
  if (edition === 'oss') {
    const response = await http.getJson<{ tag_name: string }>('https://api.github.com/repos/liquibase/liquibase/releases/latest');
    if (response.result?.tag_name) {
      return response.result.tag_name.replace(/^v/, '');
    }
  } else {
    const response = await http.getJson<Array<{ version: string }>>('https://download.liquibase.org/pro/releases.json');
    if (response.result && response.result.length > 0) {
      return response.result[0].version;
    }
  }
  
  throw new Error(`Could not determine latest version for Liquibase ${edition}`);
}

async function getAvailableVersions(edition: string): Promise<string[]> {
  const http = new HttpClient('setup-liquibase');
  
  if (edition === 'oss') {
    const response = await http.getJson<Array<{ tag_name: string }>>('https://api.github.com/repos/liquibase/liquibase/releases');
    if (response.result) {
      return response.result.map(release => release.tag_name.replace(/^v/, ''));
    }
  } else {
    const response = await http.getJson<Array<{ version: string }>>('https://download.liquibase.org/pro/releases.json');
    if (response.result) {
      return response.result.map(release => release.version);
    }
  }
  
  return [];
}

function getDownloadUrl(version: string, edition: string): string {
  const platform = getPlatform();
  
  if (edition === 'oss') {
    return `https://github.com/liquibase/liquibase/releases/download/v${version}/liquibase-${version}.${getArchiveExtension()}`;
  } else {
    return `https://download.liquibase.org/pro/liquibase-pro-${version}-${platform}.${getArchiveExtension()}`;
  }
}

function getPlatform(): string {
  const platform = process.platform;
  switch (platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    case 'linux':
      return 'linux';
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function getArchiveExtension(): string {
  return process.platform === 'win32' ? 'zip' : 'tar.gz';
}

async function extractLiquibase(downloadPath: string): Promise<string> {
  const isZip = downloadPath.endsWith('.zip');
  
  if (isZip) {
    return await tc.extractZip(downloadPath);
  } else {
    return await tc.extractTar(downloadPath, undefined, 'xz');
  }
}

async function configureLiquibasePro(toolPath: string, licenseKey: string): Promise<void> {
  const propertiesPath = path.join(toolPath, 'liquibase.properties');
  const propertiesContent = `liquibase.licenseKey=${licenseKey}\n`;
  
  await fs.promises.writeFile(propertiesPath, propertiesContent);
  core.info('Configured Liquibase Pro license key');
}

async function validateInstallation(liquibasePath: string): Promise<void> {
  try {
    const executable = process.platform === 'win32' ? `${liquibasePath}.bat` : liquibasePath;
    await exec.exec(executable, ['--version'], { silent: true });
    core.info('Liquibase installation validated successfully');
  } catch (error) {
    throw new Error(`Failed to validate Liquibase installation: ${error}`);
  }
}