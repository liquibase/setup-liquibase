/**
 * Configuration constants for the setup-liquibase GitHub Action
 * 
 * This file centralizes all URLs and configuration values that might need
 * to be updated or customized for different environments.
 */


/**
 * Download URL templates for Liquibase distributions
 * Using Scarf-tracked endpoints for analytics (DAT-21375)
 *
 * Scarf packages:
 * - liquibase-community-gha: Community edition downloads
 * - liquibase-pro-gha: Pro edition downloads (legacy, versions ≤4.33.0)
 * - liquibase-secure-gha: Secure edition downloads
 */
export const DOWNLOAD_URLS = {
  /**
   * Community edition download URL templates (Scarf-tracked)
   * Used by 'community' edition (primary) and 'oss' edition (backward compatibility alias)
   */
  OSS_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/community/gha/liquibase-{version}.zip',
  OSS_UNIX: 'https://package.liquibase.com/downloads/community/gha/liquibase-{version}.tar.gz',

  /**
   * Legacy Pro download URL templates (Scarf-tracked)
   * Used only for 'pro' edition (backward compatibility) with versions <= 4.33.0
   */
  PRO_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/pro/gha/liquibase-pro-{version}.zip',
  PRO_UNIX: 'https://package.liquibase.com/downloads/pro/gha/liquibase-pro-{version}.tar.gz',

  /**
   * Secure edition download URL templates (Scarf-tracked)
   * Used by 'secure' edition (primary) and 'pro' edition (backward compatibility) with versions > 4.33.0
   */
  SECURE_WINDOWS_ZIP: 'https://package.liquibase.com/downloads/secure/gha/liquibase-secure-{version}.zip',
  SECURE_UNIX: 'https://package.liquibase.com/downloads/secure/gha/liquibase-secure-{version}.tar.gz'
} as const;

/**
 * Minimum supported version for this action
 */
export const MIN_SUPPORTED_VERSION = '4.32.0';
