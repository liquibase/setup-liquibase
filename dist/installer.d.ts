/**
 * Liquibase Installation and Setup Module
 *
 * This module contains the core logic for:
 * - Downloading and installing Liquibase (OSS and Pro editions)
 * - Version resolution and management
 * - Cross-platform support (Linux, Windows, macOS)
 * - Caching for improved performance
 * - License configuration for Pro edition
 * - Installation validation
 */
/**
 * Configuration options for setting up Liquibase
 */
export interface LiquibaseSetupOptions {
    /** Specific version to install (e.g., "4.32.0") */
    version: string;
    /** Edition to install: 'oss' for Open Source, 'pro' for Professional */
    edition: 'oss' | 'pro';
    /** License key for Pro edition from LIQUIBASE_LICENSE_KEY environment variable */
    licenseKey?: string;
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
 * 1. Validates Pro edition requirements
 * 2. Resolves the exact version to install
 * 3. Checks for cached installations
 * 4. Downloads and extracts Liquibase if needed
 * 5. Configures Pro license if applicable
 * 6. Validates the installation
 * 7. Adds Liquibase to the system PATH
 *
 * @param options - Configuration for the Liquibase setup
 * @returns Promise resolving to the setup result with version and path
 */
export declare function setupLiquibase(options: LiquibaseSetupOptions): Promise<LiquibaseSetupResult>;
/**
 * Constructs the download URL for a specific Liquibase version and edition
 * Uses official Liquibase download endpoints
 *
 * @param version - Exact version number to download
 * @param edition - Edition to download ('oss' or 'pro')
 * @returns Download URL for the specified version from official Liquibase endpoints
 */
export declare function getDownloadUrl(version: string, edition: 'oss' | 'pro'): string;
