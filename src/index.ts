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
export async function transformLiquibaseEnvironmentVariables(): Promise<void> {
  // Dynamically find all Liquibase environment variables that likely contain file/directory paths
  const pathIndicators = [
    'FILE', 'PATH', 'DIR', 'DIRECTORY', 'CLASSPATH', 'OUTPUT', 
    'SQL', 'DEFAULTS', 'PROPERTIES', 'CHANGELOG', 'SCHEMA'
  ];
  
  const liquibaseFilePathEnvVars = Object.keys(process.env)
    .filter(key => {
      // Must start with LIQUIBASE_
      if (!key.startsWith('LIQUIBASE_')) return false;
      
      // Must contain path-like indicators
      return pathIndicators.some(indicator => key.includes(indicator));
    })
    .sort(); // Sort for consistent processing order

  // Debug: Show which Liquibase environment variables are being processed
  if (liquibaseFilePathEnvVars.length > 0) {
    core.debug(`Detected ${liquibaseFilePathEnvVars.length} Liquibase environment variable(s) with potential file paths: ${liquibaseFilePathEnvVars.join(', ')}`);
  }

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
          // Handle both Unix and Windows style paths consistently
          const normalizedPath = processedPath.replace(/\\/g, '/');
          const rootParts = normalizedPath.split('/').filter(part => part.length > 0);
          if (rootParts.length > 0) {
            const rootDir = rootParts[0];
            
            if (restrictedRootDirs.includes(rootDir)) {
              // Create a proper workspace-relative path using Node.js path module
              const relativePath = path.join('.', processedPath.substring(1)); // Remove leading slash and join with '.'
              processedPath = relativePath;
              wasTransformed = true;
              
              transformedPaths.push(`${envVarName}: '${singlePath}' → '${relativePath}'`);
              
              // Create directory if this looks like a file path
              const isFilePath = envVarName.includes('FILE') || envVarName.includes('OUTPUT') || 
                                (path.extname(processedPath) !== '' && !fs.existsSync(processedPath)) || 
                                (fs.existsSync(processedPath) && fs.statSync(processedPath).isFile());
              
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
    core.startGroup('🔄 Path Transformation (Security & Compatibility)');
    core.info(`   Transformed ${transformedPaths.length} variable(s) to workspace-relative paths`);
    core.info('   This ensures compatibility with GitHub Actions runners and prevents permission issues');
    transformedPaths.forEach(transformation => core.info(`   📝 ${transformation}`));
    core.info('💡 Tip: Use relative paths (e.g., "logs/file.log") to avoid transformation');
    core.endGroup();
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

    // Execute the main installation logic
    const result = await setupLiquibase({
      version,
      edition,
      cache
    });

    // Set output values that other workflow steps can reference
    core.setOutput('liquibase-version', result.version);
    core.setOutput('liquibase-path', result.path);

    core.info(`✅ setup-liquibase completed successfully!`);
  } catch (error) {
    // Handle any errors by failing the action with a descriptive message
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

// Execute the main function when this module is loaded
run();