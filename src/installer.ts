/**
 * Liquibase Installation and Setup Module
 *
 * This module contains the core logic for:
 * - Downloading and installing Liquibase (Community and Secure editions)
 * - Backward compatibility support for 'oss' and 'pro' edition aliases
 * - Version resolution and management
 * - Cross-platform support (Linux, Windows, macOS)
 * - Installation validation
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { downloadTool, extractZip, cacheDir, find } from '@actions/tool-cache';
import { DOWNLOAD_URLS, MIN_SUPPORTED_VERSION } from './config';
import * as semver from 'semver';

/**
 * Configuration options for setting up Liquibase
 */
export interface LiquibaseSetupOptions {
  /** Specific version to install (e.g., "4.32.0") */
  version: string;
  /** Edition to install: 'community' for Community edition (OSS), 'secure' for Secure edition, 'pro' for backward compatibility, or 'oss' for backward compatibility */
  edition: 'community' | 'oss' | 'pro' | 'secure';
  /** Optional custom base URL for downloading Liquibase from internal repositories */
  downloadUrlBase?: string;
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
 * 3. Checks the tool cache for existing installation (cache hit = instant setup)
 * 4. Downloads and extracts Liquibase (cache miss only)
 * 5. Caches the installation for subsequent runs
 * 6. Validates the installation
 * 7. Adds Liquibase to the system PATH
 *
 * The tool cache provides significant performance improvements on self-hosted runners:
 * - First run: Downloads and caches Liquibase (~10-30 seconds)
 * - Subsequent runs: Instant retrieval from cache (<1 second)
 * - Prevents disk space exhaustion from accumulated temp directories
 *
 * @param options - Configuration for the Liquibase setup
 * @returns Promise resolving to the setup result with version and path
 */
export async function setupLiquibase(options: LiquibaseSetupOptions): Promise<LiquibaseSetupResult> {
  const { version, edition, downloadUrlBase } = options;

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
  const validEditions: readonly LiquibaseSetupOptions['edition'][] = ['community', 'oss', 'pro', 'secure'] as const;
  if (!validEditions.includes(edition)) {
    throw new Error(`Invalid edition: ${edition}. Must be 'community', 'secure', 'oss' (backward compatibility), or 'pro' (backward compatibility)`);
  }

  // Use the specified version directly (no resolution needed since we only support specific versions)
  const resolvedVersion = version;

  core.info(`🚀 Setting up Liquibase ${edition.toUpperCase()} ${resolvedVersion}`);

  let toolPath: string;

  // Check if Liquibase is already cached (only when not using custom URL)
  // Include edition in tool name for proper cache key isolation
  const toolName = `liquibase-${edition}`;
  const cachedPath = downloadUrlBase ? null : find(toolName, resolvedVersion);

  if (cachedPath) {
    // Cache hit - use existing installation
    core.info(`✨ Using cached Liquibase ${edition.toUpperCase()} ${resolvedVersion} from tool cache`);
    core.debug(`Cache location: ${cachedPath}`);
    toolPath = cachedPath;
  } else {
    // Cache miss - download and install
    if (!downloadUrlBase) {
      core.info(`💾 Liquibase not found in cache, proceeding with fresh installation`);
    }

    try {
      // Get the appropriate download URL for this version and edition
      const downloadUrl = getDownloadUrl(resolvedVersion, edition, downloadUrlBase);
      core.info(`📥 Downloading from: ${downloadUrl}`);

      // Download the Liquibase archive with error handling
      const downloadPath = await downloadTool(downloadUrl);
      core.info(`📦 Extracting Liquibase archive...`);

      // Extract the archive to a temporary directory
      const extractPath = await extractLiquibase(downloadPath);

      // Cache the extracted directory for future runs (only when not using custom URL)
      if (!downloadUrlBase) {
        core.info(`💾 Caching Liquibase installation for future workflow runs...`);
        toolPath = await cacheDir(extractPath, toolName, resolvedVersion);
        core.debug(`Cached at: ${toolPath}`);
      } else {
        toolPath = extractPath;
      }

      core.info(`✅ Installation completed successfully`);
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
  }

  // Construct the path to the Liquibase executable
  const liquibaseBinPath = path.join(toolPath, 'liquibase');

  // Add the tool directory to the system PATH so 'liquibase' command is available
  core.addPath(toolPath);
  core.info(`🔧 Added Liquibase to system PATH`);

  // Verify that the installation was successful
  await validateInstallation(liquibaseBinPath);

  // Display comprehensive setup information following popular GitHub Actions patterns
  core.startGroup('🎯 Liquibase configuration');
  core.info(` Edition: ${edition.toUpperCase()}`);
  core.info(` Version: ${resolvedVersion}`);
  core.info(` Install Path: ${toolPath}`);
  core.info(` Execution Context: ${process.cwd()}`);
  core.endGroup();

  // Add helpful migration information with cross-platform path handling
  core.startGroup('💡 Migration Guidance');
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const currentDir = process.cwd();
  const workspaceInfo = path.relative(workspace, currentDir) || 'repository';

  core.info(`Migration from liquibase-github-actions:`);
  core.info(`   • Liquibase installs to: temporary directory (not /liquibase/)`);
  core.info(`   • Liquibase executes from: ${workspaceInfo}/`);
  core.info(`   • Use relative paths: --changelog-file=changelog.xml`);
  core.info(`   • Absolute paths are auto-transformed for security`);
  core.endGroup();

  // Return the results for use by the action
  return {
    version: resolvedVersion,
    path: toolPath
  };
}

/**
 * Validates a custom download URL template
 *
 * @param urlTemplate - The custom URL template to validate
 * @throws Error if the URL template is invalid
 */
function validateCustomUrl(urlTemplate: string): void {
  // Ensure URL uses HTTPS for security
  if (!urlTemplate.startsWith('https://') && !urlTemplate.startsWith('http://')) {
    throw new Error('Custom download URL must start with https:// or http://');
  }

  // Warn if not using HTTPS
  if (!urlTemplate.startsWith('https://')) {
    core.warning('Custom download URL is not using HTTPS. Consider using a secure connection.');
  }

  // Ensure URL contains version placeholder
  if (!urlTemplate.includes('{version}')) {
    throw new Error('Custom download URL must contain {version} placeholder');
  }

  // Validate URL format
  try {
    const testUrl = urlTemplate
      .replace(/\{version\}/g, '4.32.0')
      .replace(/\{platform\}/g, 'unix')
      .replace(/\{extension\}/g, 'tar.gz')
      .replace(/\{edition\}/g, 'oss');
    new URL(testUrl);
  } catch (error) {
    throw new Error(`Invalid custom download URL format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Constructs the download URL for a specific Liquibase version and edition
 * Uses official Liquibase download endpoints or a custom URL if provided
 *
 * For Pro and Secure editions (default URLs):
 * - Versions > 4.33.0 use Secure download URLs
 * - Special test version '5-secure-release-test' uses Secure download URLs
 * - Versions <= 4.33.0 use legacy Pro download URLs
 *
 * For Community and OSS editions:
 * - Both 'community' and 'oss' use the same OSS download URLs for backward compatibility
 *
 * Custom URL support:
 * - Supports {version} placeholder for version number
 * - Supports {platform} placeholder for 'windows' or 'unix'
 * - Supports {extension} placeholder for 'zip' or 'tar.gz'
 * - Supports {edition} placeholder for 'community', 'oss', 'pro', or 'secure'
 *
 * @param version - Exact version number to download
 * @param edition - Edition to download ('community', 'oss', 'pro', or 'secure')
 * @param customUrlBase - Optional custom base URL template for downloading from internal repositories
 * @returns Download URL for the specified version
 */
export function getDownloadUrl(
  version: string,
  edition: LiquibaseSetupOptions['edition'],
  customUrlBase?: string
): string {
  const isWindows = process.platform === 'win32';
  const platform = isWindows ? 'windows' : 'unix';
  const extension = isWindows ? 'zip' : 'tar.gz';

  // If custom URL is provided, validate and use it
  if (customUrlBase && customUrlBase.trim() !== '') {
    const trimmedUrlBase = customUrlBase.trim();
    validateCustomUrl(trimmedUrlBase);

    core.info(`🔧 Using custom download URL for internal/alternative repository`);

    // Replace all placeholders in the custom URL
    const customUrl = trimmedUrlBase
      .replace(/\{version\}/g, version)
      .replace(/\{platform\}/g, platform)
      .replace(/\{extension\}/g, extension)
      .replace(/\{edition\}/g, edition);

    return customUrl;
  }

  // Default behavior: use official Liquibase download endpoints
  // For Pro and Secure editions, use Secure URLs if version > 4.33.0
  if (edition === 'pro' || edition === 'secure') {
    const useSecureUrls = version === '5-secure-release-test' || semver.gt(version, '4.33.0');

    if (useSecureUrls) {
      const template = isWindows ? DOWNLOAD_URLS.SECURE_WINDOWS_ZIP : DOWNLOAD_URLS.SECURE_UNIX;
      return template.replace(/\{version\}/g, version);
    } else {
      const template = isWindows ? DOWNLOAD_URLS.PRO_WINDOWS_ZIP : DOWNLOAD_URLS.PRO_UNIX;
      return template.replace(/\{version\}/g, version);
    }
  } else {
    // For both 'community' and 'oss' editions, use OSS download URLs
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
      // Workaround for PowerShell 5.1 requiring .zip extension
      // See: https://github.com/actions/toolkit/issues/1287
      const zipPath = `${downloadPath}.zip`;
      await fs.promises.rename(downloadPath, zipPath);
      return await extractZip(zipPath);
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

    core.info('✅ Liquibase installation validated successfully');
    core.debug(`Version output: ${stdoutOutput.trim()}`);
  } catch (error) {
    // Pass through our detailed error messages, or wrap generic ones
    if (error instanceof Error && error.message.includes('Liquibase validation failed with exit code')) {
      throw error; // Already has detailed error info
    }
    throw new Error(`Failed to validate Liquibase installation: ${error instanceof Error ? error.message : String(error)}`);
  }
}
