import * as semver from 'semver';

export class VersionResolver {
  private static instance: VersionResolver;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): VersionResolver {
    if (!VersionResolver.instance) {
      VersionResolver.instance = new VersionResolver();
    }
    return VersionResolver.instance;
  }

  public async resolveVersion(version: string): Promise<string> {
    // For our simplified version, we only support exact semantic versions
    // No need to resolve "latest" or version ranges anymore
    if (semver.valid(version)) {
      return version;
    }

    throw new Error(`Invalid version: ${version}. Must be a valid semantic version (e.g., "4.32.0")`);
  }
} 