/**
 * Configuration constants for the setup-liquibase GitHub Action
 * 
 * This file centralizes all URLs and configuration values that might need
 * to be updated or customized for different environments.
 */


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
  PRO_UNIX: 'https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-{version}.tar.gz',

  /**
   * Secure download URL templates
   * Note: Secure does NOT use 'v' prefix in version path
   */
  SECURE_WINDOWS_INSTALLER: 'https://package.liquibase.com/downloads/cli/liquibase/releases/secure/{version}/liquibase-secure-windows-x64-installer-{version}.exe',
  SECURE_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/cli/liquibase/releases/secure/{version}/liquibase-secure-{version}.zip',
  SECURE_UNIX: 'https://package.liquibase.com/downloads/cli/liquibase/releases/secure/{version}/liquibase-secure-{version}.tar.gz'
} as const;

/**
 * Minimum supported version for this action
 */
export const MIN_SUPPORTED_VERSION = '4.32.0';
