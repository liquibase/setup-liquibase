/**
 * Configuration constants for the setup-liquibase GitHub Action
 * 
 * This file centralizes all URLs and configuration values that might need
 * to be updated or customized for different environments.
 */

/**
 * API endpoints for fetching Liquibase version information
 */
export const API_ENDPOINTS = {
  /** GitHub API endpoint for Liquibase OSS releases */
  OSS_RELEASES: 'https://api.github.com/repos/liquibase/liquibase/releases',
  
  /** GitHub API endpoint for the latest Liquibase OSS release */
  OSS_LATEST: 'https://api.github.com/repos/liquibase/liquibase/releases/latest',
  
  /** Liquibase Pro releases endpoint */
  PRO_RELEASES: 'https://download.liquibase.org/pro/releases.json'
} as const;

/**
 * Download URL templates for Liquibase distributions
 * Using official Liquibase download endpoints
 */
export const DOWNLOAD_URLS = {
  /** 
   * OSS download URL templates from liquibase.com/download-oss
   * Note: OSS uses 'v' prefix in version path
   */
  OSS_WINDOWS_INSTALLER: 'https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-windows-x64-installer-{version}.exe',
  OSS_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-{version}.zip',
  OSS_UNIX: 'https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-{version}.tar.gz',
  
  /** 
   * Pro download URL templates from liquibase.com/download-pro
   * Note: Pro does NOT use 'v' prefix in version path
   */
  PRO_WINDOWS_INSTALLER: 'https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-windows-x64-installer-{version}.exe',
  PRO_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-{version}.zip',
  PRO_UNIX: 'https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-{version}.tar.gz'
} as const;


/**
 * Archive file extensions by platform
 */
export const ARCHIVE_EXTENSIONS = {
  'win32': 'zip',
  'unix': 'tar.gz'
} as const;

/**
 * Minimum supported version for this action
 */
export const MIN_SUPPORTED_VERSION = '4.32.0';

export const TEST_VERSIONS = {
  OSS: '4.32.0',
  // Add more as needed
};