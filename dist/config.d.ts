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
export declare const DOWNLOAD_URLS: {
    /**
     * OSS download URL templates from liquibase.com/download-oss
     * Note: OSS uses 'v' prefix in version path
     */
    readonly OSS_WINDOWS_INSTALLER: "https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-windows-x64-installer-{version}.exe";
    readonly OSS_WINDOWS_ZIP: "https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-{version}.zip";
    readonly OSS_UNIX: "https://package.liquibase.com/downloads/cli/liquibase/releases/download/v{version}/liquibase-{version}.tar.gz";
    /**
     * Pro download URL templates from liquibase.com/download-pro
     * Note: Pro does NOT use 'v' prefix in version path
     */
    readonly PRO_WINDOWS_INSTALLER: "https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-windows-x64-installer-{version}.exe";
    readonly PRO_WINDOWS_ZIP: "https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-{version}.zip";
    readonly PRO_UNIX: "https://package.liquibase.com/downloads/cli/liquibase/releases/pro/{version}/liquibase-pro-{version}.tar.gz";
};
/**
 * Minimum supported version for this action
 */
export declare const MIN_SUPPORTED_VERSION = "4.32.0";
