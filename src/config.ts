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
   * OSS download URL template from liquibase.com/download-oss
   * Template variables: {version}, {platform}, {arch}
   * Example: https://package.liquibase.com/downloads/cli/liquibase/releases/download/v4.32.0/liquibase-windows-x64-installer-4.32.0.exe
   */
  OSS_TEMPLATE: 'https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-{platform}-{arch}-installer-{version}.{extension}',
  
  /** 
   * Pro download URL template from liquibase.com/download-pro
   * Template variables: {version}, {platform}, {arch}
   * Example: https://package.liquibase.com/downloads/cli/liquibase/releases/pro/4.32.0/liquibase-pro-windows-x64-installer-4.32.0.exe
   */
  PRO_TEMPLATE: 'https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-{platform}-{arch}-installer-{version}.{extension}'
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