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
import * as path from 'path';
import * as fs from 'fs';
import * as io from '@actions/io';

/**
 * Proactively transforms any problematic Liquibase environment variables 
 * immediately when the action starts, regardless of how they're set in the workflow
 */
async function transformLiquibaseEnvironmentVariables(): Promise<void> {
  const liquibaseFilePathEnvVars = [
    'LIQUIBASE_LOG_FILE',
    'LIQUIBASE_CHANGELOG_FILE', 
    'LIQUIBASE_PROPERTIES_FILE',
    'LIQUIBASE_CLASSPATH',
    'LIQUIBASE_DRIVER_PROPERTIES_FILE',
    'LIQUIBASE_DEFAULTS_FILE',
    'LIQUIBASE_SEARCH_PATH',
    'LIQUIBASE_LIQUIBASE_CATALOG_NAME',
    'LIQUIBASE_LIQUIBASE_SCHEMA_NAME',
    'LIQUIBASE_OUTPUT_FILE',
    'LIQUIBASE_REPORT_PATH',
    'LIQUIBASE_REPORTS_PATH',
    'LIQUIBASE_SQL_FILE',
    'LIQUIBASE_REFERENCE_DEFAULTS_FILE',
    'LIQUIBASE_HUB_CONNECTION_ID_FILE',
    'LIQUIBASE_MIGRATION_SQL_OUTPUT_FILE'
  ];

  const restrictedRootDirs = [
    'liquibase', 'usr', 'bin', 'sbin', 'lib', 'var', 'etc', 'opt', 'root', 
    'boot', 'sys', 'proc', 'dev', 'run', 'srv', 'media', 'mnt'
  ];

  const transformedPaths: string[] = [];

  for (const envVarName of liquibaseFilePathEnvVars) {
    const originalPath = process.env[envVarName];
    
    if (!originalPath) {
      continue;
    }

    try {
      const pathSeparator = process.platform === 'win32' ? ';' : ':';
      const paths = originalPath.includes(pathSeparator) 
        ? originalPath.split(pathSeparator) 
        : [originalPath];
      
      const transformedPathsList: string[] = [];
      let wasTransformed = false;
      
      for (const singlePath of paths) {
        let processedPath = singlePath.trim();
        
        if (path.isAbsolute(processedPath)) {
          const rootParts = processedPath.split(path.sep).filter(part => part.length > 0);
          if (rootParts.length > 0) {
            const rootDir = rootParts[0];
            
            if (restrictedRootDirs.includes(rootDir)) {
              const relativePath = `.${processedPath}`;
              processedPath = relativePath;
              wasTransformed = true;
              
              transformedPaths.push(`${envVarName}: '${singlePath}' → '${relativePath}'`);
              
              // Create directory if this looks like a file path
              const isFilePath = envVarName.includes('FILE') || envVarName.includes('OUTPUT') || 
                                path.extname(processedPath) !== '' || envVarName === 'LIQUIBASE_REPORT_PATH' ||
                                envVarName === 'LIQUIBASE_REPORTS_PATH';
              
              if (isFilePath) {
                const absolutePath = path.resolve(processedPath);
                const directory = path.dirname(absolutePath);
                
                if (!fs.existsSync(directory)) {
                  await io.mkdirP(directory);
                  core.info(`Created directory for ${envVarName}: ${directory}`);
                }
              }
            }
          }
        }
        
        transformedPathsList.push(processedPath);
      }
      
      if (wasTransformed) {
        const finalPath = transformedPathsList.join(pathSeparator);
        process.env[envVarName] = finalPath;
        core.exportVariable(envVarName, finalPath);
      }
      
    } catch (error) {
      core.warning(`Failed to transform ${envVarName} path '${originalPath}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  if (transformedPaths.length > 0) {
    core.info(`Transformed ${transformedPaths.length} Liquibase environment variable(s) to workspace-relative paths:`);
    transformedPaths.forEach(transformation => core.info(`  ${transformation}`));
  }
}

/**
 * Main execution function for the GitHub Action
 * Orchestrates the entire Liquibase setup process
 */
async function run(): Promise<void> {
  try {
    // Transform any problematic environment variables immediately at startup
    await transformLiquibaseEnvironmentVariables();
    // Extract input parameters from the GitHub Action context
    const version = core.getInput('version');
    const editionInput = core.getInput('edition');
    const cache = core.getBooleanInput('cache');

    // Validate required version input
    if (!version) {
      throw new Error('Version input is required. Must be a specific version (e.g., "4.32.0")');
    }

    // Validate required edition input
    if (!editionInput) {
      throw new Error('Edition input is required. Must be either "oss" or "pro"');
    }
    if (editionInput !== 'oss' && editionInput !== 'pro') {
      throw new Error('Edition must be either "oss" or "pro"');
    }
    const edition = editionInput as 'oss' | 'pro';

    // Log the setup configuration for debugging purposes
    core.info(`Setting up Liquibase version ${version} (${edition} edition)`);

    // Execute the main installation logic
    const result = await setupLiquibase({
      version,
      edition,
      cache
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