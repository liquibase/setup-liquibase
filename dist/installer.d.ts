/**
 * Liquibase Installation and Setup Module
 *
 * This module contains the core logic for:
 * - Downloading and installing Liquibase (OSS and Pro editions)
 * - Version resolution and management
 * - Cross-platform support (Linux, Windows, macOS)
 * - Installation validation
 */
/**
 * Configuration options for setting up Liquibase
 */
export interface LiquibaseSetupOptions {
    /** Specific version to install (e.g., "4.32.0") */
    version: string;
    /** Edition to install: 'oss' for Open Source, 'secure' for Secure edition, or 'pro' for backward compatibility */
    edition: 'oss' | 'pro' | 'secure';
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
 * 3. Downloads and extracts Liquibase
 * 4. Validates the installation
 * 5. Adds Liquibase to the system PATH
 *
 * @param options - Configuration for the Liquibase setup
 * @returns Promise resolving to the setup result with version and path
 */
export declare function setupLiquibase(options: LiquibaseSetupOptions): Promise<LiquibaseSetupResult>;
/**
 * Constructs the download URL for a specific Liquibase version and edition
 * Uses official Liquibase download endpoints or a custom URL if provided
 *
 * For Pro and Secure editions (default URLs):
 * - Versions > 4.33.0 use Secure download URLs
 * - Special test version '5-secure-release-test' uses Secure download URLs
 * - Versions <= 4.33.0 use legacy Pro download URLs
 *
 * Custom URL support:
 * - Supports {version} placeholder for version number
 * - Supports {platform} placeholder for 'windows' or 'unix'
 * - Supports {extension} placeholder for 'zip' or 'tar.gz'
 * - Supports {edition} placeholder for 'oss', 'pro', or 'secure'
 *
 * @param version - Exact version number to download
 * @param edition - Edition to download ('oss', 'pro', or 'secure')
 * @param customUrlBase - Optional custom base URL template for downloading from internal repositories
 * @returns Download URL for the specified version
 */
export declare function getDownloadUrl(version: string, edition: LiquibaseSetupOptions['edition'], customUrlBase?: string): string;
