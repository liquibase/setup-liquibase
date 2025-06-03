/**
 * Main entry point for the setup-liquibase GitHub Action
 * 
 * This file handles:
 * - Reading and validating input parameters from the workflow
 * - Coordinating the Liquibase installation process
 * - Setting output values for other workflow steps
 * - Error handling and reporting
 */

import * as core from '@actions/core';
import { setupLiquibase } from './installer';

/**
 * Main execution function for the GitHub Action
 * Orchestrates the entire Liquibase setup process
 */
async function run(): Promise<void> {
  try {
    // Extract input parameters from the GitHub Action context
    const version = core.getInput('version') || 'latest';
    const editionInput = core.getInput('edition') || 'oss';
    const licenseKey = core.getInput('liquibase-pro-license-key');
    const cache = core.getBooleanInput('cache');
    const checkLatest = core.getBooleanInput('check-latest');

    // Validate that the edition input is one of the allowed values
    if (editionInput !== 'oss' && editionInput !== 'pro') {
      throw new Error('Edition must be either "oss" or "pro"');
    }

    // Type cast after validation to ensure TypeScript type safety
    const edition = editionInput as 'oss' | 'pro';

    // Log the setup configuration for debugging purposes
    core.info(`Setting up Liquibase ${edition} version ${version}`);

    // Validate Pro edition requirements before proceeding
    if (edition === 'pro' && !licenseKey) {
      throw new Error('License key is required for Liquibase Pro edition');
    }

    // Execute the main installation logic
    const result = await setupLiquibase({
      version,
      edition,
      licenseKey,
      cache,
      checkLatest
    });

    // Set output values that other workflow steps can reference
    core.setOutput('liquibase-version', result.version);
    core.setOutput('liquibase-path', result.path);

    // Log successful completion
    core.info(`Successfully set up Liquibase ${result.version} at ${result.path}`);
  } catch (error) {
    // Handle any errors by failing the action with a descriptive message
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

// Execute the main function when this module is loaded
run();