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
import { DOWNLOAD_URLS, MIN_SUPPORTED_VERSION } from './config';
import * as semver from 'semver';
import { VersionResolver } from './version-resolver';

/**
 * Configuration options for setting up Liquibase
 */
export interface LiquibaseSetupOptions {
  /** Specific version to install (e.g., "4.32.0") or "latest" for the latest version */
  version: string;
  /** Edition to install: 'oss' for Open Source, 'pro' for Professional */
  edition: 'oss' | 'pro';
  /** License key for Pro edition from LIQUIBASE_LICENSE_KEY environment variable */
  licenseKey?: string;
  /** Whether to cache the downloaded installation */
  cache: boolean;
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
  const { version, edition, licenseKey, cache } = options;
  
  // Enhanced version validation
  if (!version) {
    throw new Error('Version is required');
  }
  
  // Allow 'latest' or valid semantic versions
  if (version !== 'latest' && !semver.valid(version)) {
    throw new Error(`Invalid version format: ${version}. Must be a valid semantic version (e.g., "4.32.0") or "latest"`);
  }
  
  // Only validate minimum version for specific versions (not 'latest')
  if (version !== 'latest' && semver.lt(version, MIN_SUPPORTED_VERSION)) {
    throw new Error(`Version ${version} is not supported. Minimum supported version is ${MIN_SUPPORTED_VERSION}`);
  }
  
  // Enhanced edition validation
  if (!['oss', 'pro'].includes(edition)) {
    throw new Error(`Invalid edition: ${edition}. Must be either 'oss' or 'pro'`);
  }
  
  // Enhanced Pro license validation
  if (edition === 'pro' && !licenseKey) {
    throw new Error('License key is required for Liquibase Pro edition. Provide it via the liquibase-pro-license-key input or LIQUIBASE_LICENSE_KEY environment variable');
  }
  
  // Resolve the version (handles 'latest' and specific versions)
  const versionResolver = VersionResolver.getInstance();
  const resolvedVersion = await versionResolver.resolveVersion(version, edition, false);
  
  // Validate the resolved version meets minimum requirements
  if (semver.lt(resolvedVersion, MIN_SUPPORTED_VERSION)) {
    throw new Error(`Resolved version ${resolvedVersion} is not supported. Minimum supported version is ${MIN_SUPPORTED_VERSION}`);
  }
  
  // Create a unique tool name for caching that includes the edition
  const toolName = `liquibase-${edition}`;
  
  // Check if we already have this version cached
  let toolPath = tc.find(toolName, resolvedVersion);
  
  // Download and install if not cached or caching is disabled
  if (!toolPath || !cache) {
    core.info(`Installing Liquibase ${edition} version ${resolvedVersion}`);
    
    try {
      // Get the appropriate download URL for this version and edition
      const downloadUrl = getDownloadUrl(resolvedVersion, edition);
      core.info(`Downloading from: ${downloadUrl}`);
      
      // Download the Liquibase archive with error handling
      const downloadPath = await tc.downloadTool(downloadUrl);
      
      // Extract the archive to a temporary directory
      const extractedPath = await extractLiquibase(downloadPath);
      
      // Cache the installation if caching is enabled
      if (cache) {
        toolPath = await tc.cacheDir(extractedPath, toolName, resolvedVersion);
      } else {
        toolPath = extractedPath;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          throw new Error(`Liquibase ${edition} version ${resolvedVersion} not found. Please check that this version exists and is available for download.`);
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
          throw new Error(`Network error downloading Liquibase. Please check your internet connection and try again.`);
        } else if (error.message.includes('EACCES') || error.message.includes('permission')) {
          throw new Error(`Permission denied while installing Liquibase. Please check that the runner has sufficient permissions.`);
        }
      }
      throw new Error(`Failed to download and install Liquibase: ${error instanceof Error ? error.message : String(error)}`);
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
 * Constructs the download URL for a specific Liquibase version and edition
 * Uses official Liquibase download endpoints
 * 
 * @param version - Exact version number to download
 * @param edition - Edition to download ('oss' or 'pro')
 * @returns Download URL for the specified version from official Liquibase endpoints
 */
export function getDownloadUrl(version: string, edition: 'oss' | 'pro'): string {
  const isWindows = process.platform === 'win32';
  
  if (edition === 'pro') {
    const template = isWindows ? DOWNLOAD_URLS.PRO_WINDOWS_ZIP : DOWNLOAD_URLS.PRO_UNIX;
    return template.replace(/\{version\}/g, version);
  } else {
    const template = isWindows ? DOWNLOAD_URLS.OSS_WINDOWS_ZIP : DOWNLOAD_URLS.OSS_UNIX;
    return template.replace(/\{version\}/g, version);
  }
}


/**
 * Extracts a downloaded Liquibase archive to a temporary directory
 * 
 * @param downloadPath - Path to the downloaded archive file
 * @returns Promise resolving to the path of the extracted directory
 */
async function extractLiquibase(downloadPath: string): Promise<string> {
  const platform = process.platform;
  
  try {
    if (platform === 'win32') {
      // Extract ZIP archives (Windows)
      return await tc.extractZip(downloadPath);
    } else {
      // Extract tar.gz archives (Linux, macOS)
      return await tc.extractTar(downloadPath, undefined, 'xz');
    }
  } catch (error) {
    throw new Error(`Failed to extract Liquibase archive: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Configures Liquibase Pro by creating a properties file with the license key
 * 
 * @param toolPath - Directory where Liquibase is installed
 * @param licenseKey - Pro license key to configure
 */
async function configureLiquibasePro(toolPath: string, licenseKey: string): Promise<void> {
  try {
    // Validate license key format (basic validation)
    if (!licenseKey.trim()) {
      throw new Error('License key cannot be empty');
    }
    
    // Create liquibase.properties file in the installation directory
    const propertiesPath = path.join(toolPath, 'liquibase.properties');
    const propertiesContent = `liquibase.licenseKey=${licenseKey.trim()}\n`;
    
    await fs.promises.writeFile(propertiesPath, propertiesContent);
    core.info('Configured Liquibase Pro license key');
  } catch (error) {
    throw new Error(`Failed to configure Liquibase Pro license: ${error instanceof Error ? error.message : String(error)}`);
  }
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
    
    // Check if the executable exists
    if (!fs.existsSync(executable)) {
      throw new Error(`Liquibase executable not found at ${executable}`);
    }
    
    // Run 'liquibase --version' to verify the installation works
    let output = '';
    
    await exec.exec(executable, ['--version'], {
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          // Log stderr but don't fail if there's only warnings
          core.debug(`Liquibase stderr: ${data.toString()}`);
        }
      }
    });
    
    // Check if version output contains expected content
    if (!output.toLowerCase().includes('liquibase')) {
      throw new Error(`Unexpected version output: ${output}`);
    }
    
    core.info('Liquibase installation validated successfully');
    core.debug(`Version output: ${output}`);
  } catch (error) {
    throw new Error(`Failed to validate Liquibase installation: ${error instanceof Error ? error.message : String(error)}`);
  }
}