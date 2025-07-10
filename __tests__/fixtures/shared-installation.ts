/**
 * Shared Liquibase installation fixtures for integration tests
 * 
 * This module provides shared Liquibase installations that can be reused
 * across multiple integration tests to reduce download overhead.
 */

import { setupLiquibase, LiquibaseSetupResult } from '../../src/installer';
import * as path from 'path';
import * as fs from 'fs';

// Shared installation cache
const installationCache = new Map<string, LiquibaseSetupResult>();

export interface TestInstallationOptions {
  version?: string;
  edition?: 'oss' | 'pro';
  useCache?: boolean;
}

/**
 * Gets a shared Liquibase installation for integration tests
 * This function caches installations to avoid repeated downloads
 */
export async function getSharedLiquibaseInstallation(
  options: TestInstallationOptions = {}
): Promise<LiquibaseSetupResult> {
  const {
    version = '4.32.0',
    edition = 'oss',
    useCache = true
  } = options;
  
  const cacheKey = `${edition}-${version}`;
  
  // Check if we already have this installation cached
  if (useCache && installationCache.has(cacheKey)) {
    const cached = installationCache.get(cacheKey)!;
    console.log(`[TEST FIXTURE] Reusing cached ${edition} ${version} installation at ${cached.path}`);
    return cached;
  }
  
  console.log(`[TEST FIXTURE] Creating new ${edition} ${version} installation...`);
  
  // Create new installation with caching enabled to leverage GitHub Actions cache
  const result = await setupLiquibase({
    version,
    edition,
    cache: true // Enable caching for better performance
  });
  
  // Cache the result for other tests
  if (useCache) {
    installationCache.set(cacheKey, result);
    console.log(`[TEST FIXTURE] Cached ${edition} ${version} installation for reuse`);
  }
  
  return result;
}

/**
 * Gets a shared OSS Liquibase installation (most common case)
 */
export async function getSharedOSSInstallation(): Promise<LiquibaseSetupResult> {
  return getSharedLiquibaseInstallation({
    version: '4.32.0',
    edition: 'oss',
    useCache: true
  });
}

/**
 * Gets a shared Pro Liquibase installation (if license is available)
 */
export async function getSharedProInstallation(): Promise<LiquibaseSetupResult> {
  return getSharedLiquibaseInstallation({
    version: '4.32.0',
    edition: 'pro',
    useCache: true
  });
}

/**
 * Validates that a Liquibase installation is working
 * This is a lightweight check that doesn't reinstall
 */
export function validateInstallationExists(installation: LiquibaseSetupResult): boolean {
  const executable = process.platform === 'win32' 
    ? path.join(installation.path, 'liquibase.bat')
    : path.join(installation.path, 'liquibase');
    
  const exists = fs.existsSync(executable);
  
  if (!exists) {
    console.warn(`[TEST FIXTURE] Installation validation failed: ${executable} not found`);
  }
  
  return exists;
}

/**
 * Clears the installation cache (useful for test cleanup)
 */
export function clearInstallationCache(): void {
  installationCache.clear();
  console.log('[TEST FIXTURE] Installation cache cleared');
}

/**
 * Gets cache statistics for debugging
 */
export function getCacheStats(): { count: number; keys: string[] } {
  return {
    count: installationCache.size,
    keys: Array.from(installationCache.keys())
  };
}