/**
 * Liquibase Installation and Setup Module
 * 
 * This module contains the core logic for:
 * - Downloading and installing Liquibase (OSS and Pro editions)
 * - Version resolution and management
 * - Cross-platform support (Linux, Windows, macOS)
 * - Caching for improved performance
 * - Installation validation
 */

import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { DOWNLOAD_URLS, MIN_SUPPORTED_VERSION } from './config';
import * as semver from 'semver';

/**
 * Configuration options for setting up Liquibase
 */
export interface LiquibaseSetupOptions {
  /** Specific version to install (e.g., "4.32.0") */
  version: string;
  /** Edition to install: 'oss' for Open Source, 'pro' for Professional */
  edition: 'oss' | 'pro';
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
 * 1. Validates version and edition requirements
 * 2. Resolves the exact version to install
 * 3. Checks for cached installations
 * 4. Downloads and extracts Liquibase if needed
 * 5. Validates the installation
 * 6. Adds Liquibase to the system PATH
 * 
 * @param options - Configuration for the Liquibase setup
 * @returns Promise resolving to the setup result with version and path
 */
export async function setupLiquibase(options: LiquibaseSetupOptions): Promise<LiquibaseSetupResult> {
  const { version, edition, cache } = options;
  
  // Enhanced version validation
  if (!version) {
    throw new Error('Version is required');
  }
  
  // Validate version format - only specific versions allowed
  if (!semver.valid(version)) {
    throw new Error(`Invalid version format: ${version}. Must be a valid semantic version (e.g., "4.32.0")`);
  }
  
  // Validate minimum version requirement
  if (semver.lt(version, MIN_SUPPORTED_VERSION)) {
    throw new Error(`Version ${version} is not supported. Minimum supported version is ${MIN_SUPPORTED_VERSION}`);
  }
  
  // Enhanced edition validation with type guard
  const validEditions: readonly LiquibaseSetupOptions['edition'][] = ['oss', 'pro'] as const;
  if (!validEditions.includes(edition)) {
    throw new Error(`Invalid edition: ${edition}. Must be either 'oss' or 'pro'`);
  }
  
  
  // Use the specified version directly (no resolution needed since we only support specific versions)
  const resolvedVersion = version;
  
  
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
export function getDownloadUrl(version: string, edition: LiquibaseSetupOptions['edition']): string {
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
      // For both macOS and Linux, use a direct exec approach instead of tool-cache
      // Create a temporary directory for extraction
      const tempDir = path.join(os.tmpdir(), `liquibase-extract-${Math.random().toString(36).substring(2, 15)}`);
      await io.mkdirP(tempDir);
      core.debug(`Created temp directory for extraction: ${tempDir}`);
      
      // Use direct tar command execution that works on both macOS and Linux
      core.debug(`Extracting ${downloadPath} to ${tempDir}`);
      await exec.exec('tar', ['xzf', downloadPath, '-C', tempDir]);
      
      return tempDir;
    }
  } catch (error) {
    // Add debug information to help diagnose extraction issues
    core.debug(`Extraction error details: ${error instanceof Error ? error.stack : String(error)}`);
    core.debug(`Platform: ${platform}, Download path: ${downloadPath}`);
    
    // If direct extraction failed, try one more approach as fallback
    try {
      core.debug('First extraction method failed, trying fallback extraction method');
      
      if (platform === 'win32') {
        throw error; // No fallback for Windows
      }
      
      // Different tar flags for fallback attempt
      const tempDir = path.join(os.tmpdir(), `liquibase-extract-fallback-${Math.random().toString(36).substring(2, 15)}`);
      await io.mkdirP(tempDir);
      
      if (platform === 'darwin') {
        // macOS fallback
        await exec.exec('tar', ['-xf', downloadPath, '-C', tempDir]);
      } else {
        // Linux fallback
        await exec.exec('tar', ['--extract', '--file', downloadPath, '--directory', tempDir]);
      }
      
      return tempDir;
    } catch (fallbackError) {
      core.debug(`Fallback extraction also failed: ${fallbackError instanceof Error ? fallbackError.stack : String(fallbackError)}`);
      throw new Error(`Failed to extract Liquibase archive: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    
    // Note: Environment variable path validation and transformation 
    // is now handled in index.ts at action startup
    
    // Run 'liquibase --version' to verify the installation works
    let stdoutOutput = '';
    let stderrOutput = '';
    let exitCode: number | null = null;
    
    // Add timeout wrapper to prevent hanging
    const execPromise = exec.exec(executable, ['--version'], {
      silent: true,
      ignoreReturnCode: true, // Don't throw on non-zero exit codes, we'll handle them
      env: {
        ...process.env
      } as { [key: string]: string },
      listeners: {
        stdout: (data: Buffer) => {
          stdoutOutput += data.toString();
        },
        stderr: (data: Buffer) => {
          stderrOutput += data.toString();
        }
      }
    }).then((code) => {
      exitCode = code;
      return code;
    });

    let timeoutHandle: NodeJS.Timeout | undefined;
    const VALIDATION_TIMEOUT_MS = 30000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(`Liquibase validation timed out after ${VALIDATION_TIMEOUT_MS / 1000} seconds`)), VALIDATION_TIMEOUT_MS);
    });

    try {
      await Promise.race([execPromise, timeoutPromise]);
    } finally {
      // Clean up the timeout to prevent open handles
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
    
    // If we got a non-zero exit code, include the actual error output
    if (exitCode !== 0) {
      let errorMessage = `Liquibase validation failed with exit code ${exitCode}`;
      
      if (stderrOutput.trim()) {
        errorMessage += `\n\nLiquibase error output:\n${stderrOutput.trim()}`;
      }
      
      if (stdoutOutput.trim()) {
        errorMessage += `\n\nLiquibase stdout:\n${stdoutOutput.trim()}`;
      }
      
      throw new Error(errorMessage);
    }
    
    // Check if version output contains expected content
    if (!stdoutOutput.toLowerCase().includes('liquibase')) {
      throw new Error(`Unexpected version output: ${stdoutOutput}`);
    }
    
    core.info('Liquibase installation validated successfully');
    core.debug(`Version output: ${stdoutOutput}`);
  } catch (error) {
    // Pass through our detailed error messages, or wrap generic ones
    if (error instanceof Error && error.message.includes('Liquibase validation failed with exit code')) {
      throw error; // Already has detailed error info
    }
    throw new Error(`Failed to validate Liquibase installation: ${error instanceof Error ? error.message : String(error)}`);
  }
}