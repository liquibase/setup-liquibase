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
export declare function getDownloadUrl(version: string, edition: LiquibaseSetupOptions['edition'], customUrlBase?: string): string;
