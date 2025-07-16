/**
 * Main entry point for the setup-liquibase GitHub Action
 *
 * This file handles:
 * - Reading and validating input parameters from the workflow
 * - Coordinating the Liquibase installation process
 * - Setting output values for other workflow steps
 * - Error handling and reporting
 */
/**
 * Proactively transforms any problematic Liquibase environment variables
 * immediately when the action starts, regardless of how they're set in the workflow
 */
export declare function transformLiquibaseEnvironmentVariables(): Promise<void>;
