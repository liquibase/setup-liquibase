/**
 * Liquibase Installation and Setup Module
 * 
 * This module contains the core logic for:
 * - Downloading and installing Liquibase (OSS and Pro editions)
 * - Version resolution and management
 * - Cross-platform support (Linux, Windows, macOS)
 * - Caching for improved performance
 * - License configuration for Pro edition
 * - Installation validation
 */

import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';
import { HttpClient } from '@actions/http-client';
import * as semver from 'semver';

/**
 * Configuration options for setting up Liquibase
 */
export interface LiquibaseSetupOptions {
  /** Version to install (specific version, range, or 'latest') */
  version: string;
  /** Edition to install: 'oss' for Open Source, 'pro' for Professional */
  edition: 'oss' | 'pro';
  /** License key for Pro edition (required when edition is 'pro') */
  licenseKey?: string;
  /** Whether to cache the downloaded installation */
  cache: boolean;
  /** Whether to check for the latest version even if cached version exists */
  checkLatest: boolean;
}

/**
 * Result of a successful Liquibase setup operation
 */
export interface LiquibaseSetupResult {
  /** The actual version that was installed */
  version: string;
  /** The file system path where Liquibase was installed */
  path: string;
}

/**
 * Main function to set up Liquibase in the GitHub Actions environment
 * 
 * This function coordinates the entire installation process:
 * 1. Validates Pro edition requirements
 * 2. Resolves the exact version to install
 * 3. Checks for cached installations
 * 4. Downloads and extracts Liquibase if needed
 * 5. Configures Pro license if applicable
 * 6. Validates the installation
 * 7. Adds Liquibase to the system PATH
 * 
 * @param options - Configuration for the Liquibase setup
 * @returns Promise resolving to the setup result with version and path
 */
export async function setupLiquibase(options: LiquibaseSetupOptions): Promise<LiquibaseSetupResult> {
  const { version, edition, licenseKey, cache, checkLatest } = options;
  
  // Early validation: Pro edition requires a license key
  if (edition === 'pro' && !licenseKey) {
    throw new Error('License key is required for Liquibase Pro edition');
  }
  
  // Resolve the exact version to install (handles 'latest', ranges, etc.)
  const resolvedVersion = await resolveVersion(version, edition, checkLatest);
  
  // Create a unique tool name for caching that includes the edition
  const toolName = `liquibase-${edition}`;
  
  // Check if we already have this version cached
  let toolPath = tc.find(toolName, resolvedVersion);
  
  // Download and install if not cached or caching is disabled
  if (!toolPath || !cache) {
    core.info(`Installing Liquibase ${edition} version ${resolvedVersion}`);
    
    // Get the appropriate download URL for this version and edition
    const downloadUrl = getDownloadUrl(resolvedVersion, edition);
    
    // Download the Liquibase archive
    const downloadPath = await tc.downloadTool(downloadUrl);
    
    // Extract the archive to a temporary directory
    const extractedPath = await extractLiquibase(downloadPath);
    
    // Cache the installation if caching is enabled
    if (cache) {
      toolPath = await tc.cacheDir(extractedPath, toolName, resolvedVersion);
    } else {
      toolPath = extractedPath;
    }
  } else {
    core.info(`Found cached Liquibase ${edition} version ${resolvedVersion}`);
  }
  
  // Construct the path to the Liquibase executable
  const liquibaseBinPath = path.join(toolPath, 'liquibase');
  
  // Add the tool directory to the system PATH so 'liquibase' command is available
  core.addPath(toolPath);
  
  // Configure Pro license if this is a Pro installation
  if (edition === 'pro' && licenseKey) {
    await configureLiquibasePro(toolPath, licenseKey);
  }
  
  // Verify that the installation was successful
  await validateInstallation(liquibaseBinPath);
  
  // Return the results for use by the action
  return {
    version: resolvedVersion,
    path: toolPath
  };
}

/**
 * Resolves a version specification to an exact version number
 * 
 * Handles various version formats:
 * - 'latest': Gets the most recent version
 * - Exact versions: '4.25.0' returns as-is
 * - Version ranges: '^4.20' or '~4.25.0' finds the best matching version
 * 
 * @param version - Version specification from user input
 * @param edition - Liquibase edition ('oss' or 'pro')
 * @param checkLatest - Whether to check for latest version even if not requested
 * @returns Promise resolving to an exact version number
 */
async function resolveVersion(version: string, edition: string, checkLatest: boolean): Promise<string> {
  // Handle 'latest' version or forced latest check
  if (version === 'latest' || checkLatest) {
    return await getLatestVersion(edition);
  }
  
  // If it's already a valid exact version, return as-is
  if (semver.valid(version)) {
    return version;
  }
  
  // For version ranges, find the best matching version from available releases
  const availableVersions = await getAvailableVersions(edition);
  const matchedVersion = semver.maxSatisfying(availableVersions, version);
  
  if (!matchedVersion) {
    throw new Error(`No version matching ${version} found for Liquibase ${edition}`);
  }
  
  return matchedVersion;
}

/**
 * Fetches the latest available version for the specified Liquibase edition
 * 
 * @param edition - Liquibase edition ('oss' or 'pro')
 * @returns Promise resolving to the latest version number
 */
async function getLatestVersion(edition: string): Promise<string> {
  const http = new HttpClient('setup-liquibase');
  
  if (edition === 'oss') {
    // For OSS, query GitHub releases API
    const response = await http.getJson<{ tag_name: string }>('https://api.github.com/repos/liquibase/liquibase/releases/latest');
    if (response.result?.tag_name) {
      // Remove 'v' prefix from tag name (e.g., 'v4.25.0' -> '4.25.0')
      return response.result.tag_name.replace(/^v/, '');
    }
  } else {
    // For Pro, query Liquibase's Pro releases endpoint
    const response = await http.getJson<Array<{ version: string }>>('https://download.liquibase.org/pro/releases.json');
    if (response.result && response.result.length > 0) {
      // Return the first (latest) version from the sorted list
      return response.result[0].version;
    }
  }
  
  throw new Error(`Could not determine latest version for Liquibase ${edition}`);
}

/**
 * Fetches all available versions for the specified Liquibase edition
 * Used for version range resolution
 * 
 * @param edition - Liquibase edition ('oss' or 'pro')
 * @returns Promise resolving to array of available version numbers
 */
async function getAvailableVersions(edition: string): Promise<string[]> {
  const http = new HttpClient('setup-liquibase');
  
  if (edition === 'oss') {
    // For OSS, get all GitHub releases
    const response = await http.getJson<Array<{ tag_name: string }>>('https://api.github.com/repos/liquibase/liquibase/releases');
    if (response.result) {
      // Remove 'v' prefix from all tag names and return as array
      return response.result.map(release => release.tag_name.replace(/^v/, ''));
    }
  } else {
    // For Pro, get all versions from Liquibase's releases endpoint
    const response = await http.getJson<Array<{ version: string }>>('https://download.liquibase.org/pro/releases.json');
    if (response.result) {
      return response.result.map(release => release.version);
    }
  }
  
  // Return empty array if no versions found (will cause error in resolution)
  return [];
}

/**
 * Constructs the download URL for a specific Liquibase version and edition
 * 
 * @param version - Exact version number to download
 * @param edition - Liquibase edition ('oss' or 'pro')
 * @returns Download URL for the specified version and platform
 */
function getDownloadUrl(version: string, edition: string): string {
  const platform = getPlatform();
  
  if (edition === 'oss') {
    // OSS releases are hosted on GitHub with a consistent naming pattern
    return `https://github.com/liquibase/liquibase/releases/download/v${version}/liquibase-${version}.${getArchiveExtension()}`;
  } else {
    // Pro releases are hosted on Liquibase's download server with platform-specific naming
    return `https://download.liquibase.org/pro/liquibase-pro-${version}-${platform}.${getArchiveExtension()}`;
  }
}

/**
 * Maps Node.js platform names to Liquibase download platform names
 * 
 * @returns Platform string used in Liquibase download URLs
 * @throws Error if the current platform is not supported
 */
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

/**
 * Determines the appropriate archive file extension for the current platform
 * 
 * @returns 'zip' for Windows, 'tar.gz' for Unix-like systems
 */
function getArchiveExtension(): string {
  return process.platform === 'win32' ? 'zip' : 'tar.gz';
}

/**
 * Extracts a downloaded Liquibase archive to a temporary directory
 * 
 * @param downloadPath - Path to the downloaded archive file
 * @returns Promise resolving to the path of the extracted directory
 */
async function extractLiquibase(downloadPath: string): Promise<string> {
  const isZip = downloadPath.endsWith('.zip');
  
  if (isZip) {
    // Extract ZIP archives (Windows)
    return await tc.extractZip(downloadPath);
  } else {
    // Extract tar.gz archives (Linux, macOS) with xz compression
    return await tc.extractTar(downloadPath, undefined, 'xz');
  }
}

/**
 * Configures Liquibase Pro by creating a properties file with the license key
 * 
 * @param toolPath - Directory where Liquibase is installed
 * @param licenseKey - Pro license key to configure
 */
async function configureLiquibasePro(toolPath: string, licenseKey: string): Promise<void> {
  // Create liquibase.properties file in the installation directory
  const propertiesPath = path.join(toolPath, 'liquibase.properties');
  const propertiesContent = `liquibase.licenseKey=${licenseKey}\n`;
  
  await fs.promises.writeFile(propertiesPath, propertiesContent);
  core.info('Configured Liquibase Pro license key');
}

/**
 * Validates that Liquibase was installed correctly by running --version command
 * 
 * @param liquibasePath - Path to the Liquibase executable (without extension)
 * @throws Error if the validation fails
 */
async function validateInstallation(liquibasePath: string): Promise<void> {
  try {
    // On Windows, Liquibase uses .bat extension; Unix systems use the binary directly
    const executable = process.platform === 'win32' ? `${liquibasePath}.bat` : liquibasePath;
    
    // Run 'liquibase --version' to verify the installation works
    await exec.exec(executable, ['--version'], { silent: true });
    core.info('Liquibase installation validated successfully');
  } catch (error) {
    throw new Error(`Failed to validate Liquibase installation: ${error}`);
  }
}