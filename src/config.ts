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
   * Community edition download URL templates from liquibase.com/download-oss
   * Used by 'community' edition (primary) and 'oss' edition (backward compatibility alias)
   * Note: Community/OSS URLs use 'v' prefix in version path
   */
  OSS_WINDOWS_INSTALLER: 'https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-windows-x64-installer-{version}.exe',
  OSS_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-{version}.zip',
  OSS_UNIX: 'https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-{version}.tar.gz',
  
  /**
   * Legacy Pro download URL templates from liquibase.com/download-pro
   * Used only for 'pro' edition (backward compatibility) with versions <= 4.33.0
   * Note: Pro URLs do NOT use 'v' prefix in version path
   */
  PRO_WINDOWS_INSTALLER: 'https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-windows-x64-installer-{version}.exe',
  PRO_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-{version}.zip',
  PRO_UNIX: 'https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-{version}.tar.gz',

  /**
   * Secure edition download URL templates
   * Used by 'secure' edition (primary) and 'pro' edition (backward compatibility) with versions > 4.33.0
   * Note: Secure URLs do NOT use 'v' prefix in version path
   */
  SECURE_WINDOWS_INSTALLER: 'https://package.liquibase.com/downloads/cli/liquibase/releases/secure/{version}/liquibase-secure-windows-x64-installer-{version}.exe',
  SECURE_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/cli/liquibase/releases/secure/{version}/liquibase-secure-{version}.zip',
  SECURE_UNIX: 'https://package.liquibase.com/downloads/cli/liquibase/releases/secure/{version}/liquibase-secure-{version}.tar.gz'
} as const;

/**
 * Minimum supported version for this action
 */
export const MIN_SUPPORTED_VERSION = '4.32.0';
