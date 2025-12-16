# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the setup-liquibase GitHub Action repository.

## Project Overview

**setup-liquibase** is a production-ready GitHub Action that installs Liquibase for CI/CD workflows. This action **replaces** the legacy `liquibase-github-actions` organization's individual command actions with a single, flexible setup action following GitHub Actions best practices.

### Project Status
- **Status**: Production (v2.x active)
- **Replaces**: `../github-action-generator/` (deprecated)
- **Users**: Public GitHub Actions marketplace + internal Liquibase teams
- **Quality**: 83 comprehensive tests, multi-platform support
- **Current Version**: 2.0.0 (supports Community, Secure editions; OSS and Pro for backward compatibility)

## Build and Development Commands

### Core Commands
- `npm ci` - Install dependencies (use instead of npm install)
- `npm run build` - Build TypeScript to JavaScript bundle (dist/index.js)
- `npm run test` - Run all tests with memory optimization
- `npm run test:ci` - Run tests in CI mode (limited workers, no coverage)
- `npm run lint` - Run ESLint on TypeScript files
- `npm run format` - Format code with Prettier
- `npm run package` - Build and test in one command

### Testing Commands
- Run a single test file: `npm test -- __tests__/unit/installer.test.ts`
- Run tests with pattern: `npm test -- --testNamePattern="should validate"`
- Run tests with debug logging: `npm run test:debug`
- Memory optimization for tests: Use `npm run test:memory` with `--max-old-space-size=4096`
- CI tests use `--maxWorkers=1` to prevent resource exhaustion and cross-platform issues
- Tests run serially by default (`--maxWorkers=1`) with forced exit to avoid hanging processes

## Architecture Overview

### Primary Purpose
Single GitHub Action that installs Liquibase (Community or Secure editions) and adds it to PATH, allowing users to run any Liquibase command. This replaces the previous approach of having individual actions for each command.

### Key Components

1. **Entry Point** (`src/index.ts`)
   - Reads action inputs (version, edition)
   - Validates inputs using type guards
   - Proactively transforms environment variables (path safety)
   - Calls installer and sets outputs

2. **Installer** (`src/installer.ts`)
   - Core installation logic
   - Platform detection (Windows/Unix/macOS)
   - Download URL construction with edition-specific templates
   - Installation validation with timeout protection
   - Cross-platform tar/zip extraction

3. **Configuration** (`src/config.ts`)
   - Central location for all URLs and constants
   - Download URL templates for Community/Pro/Secure editions (Scarf-tracked for analytics)
   - Scarf packages: `liquibase-community-gha`, `liquibase-pro-gha`, `liquibase-secure-gha`
   - Minimum version enforcement (4.32.0)

### Important Implementation Details

- **Minimum Version**: 4.32.0 (enforced due to download endpoint compatibility)
- **Editions**: 'community' (Community edition, formerly OSS), 'secure' (Secure), 'oss' (backward compatibility), or 'pro' (backward compatibility)
- **Secure License**: Required at runtime via `LIQUIBASE_LICENSE_KEY` environment variable (not during installation)
- **Platforms**: Supports Linux (.tar.gz), Windows (.zip), and macOS (.tar.gz)
- **Build Output**: TypeScript compiles to single `dist/index.js` with source maps
- **Path Transformation**: Automatically converts absolute paths in Liquibase environment variables to workspace-relative paths for GitHub Actions compatibility and security
- **URL Selection Logic**: For Pro/Secure editions, versions > 4.33.0 use Secure download URLs; versions <= 4.33.0 use legacy Pro URLs

### Testing Structure

- **Unit Tests** (`__tests__/unit/`): Test individual modules
- **Integration Tests** (`__tests__/integration/`): Test real installations
- **Performance Tests** (`__tests__/performance/`): Verify memory/speed constraints
- **Error Handling Tests**: Validate failure scenarios
- Tests use Jest with ts-jest for TypeScript support
- CI workflow tests across Ubuntu, Windows, and macOS

### GitHub Action Configuration

- **action.yml**: Defines inputs (version, edition) and outputs (liquibase-version, liquibase-path)
- **Node Runtime**: Uses Node.js 20
- **Icon**: Database icon with blue color for marketplace

## Release Automation

### Single Workflow Architecture
**File**: `.github/workflows/release-drafter.yml`

**Process**:
1. **PRs merged** → Draft release updated automatically
2. **Manual dispatch** → Multi-platform tests + Release published
3. **Major tag automation** → v1 points to latest v1.x.x

**Key Features**:
- Multi-platform testing (Ubuntu, Windows, macOS)
- Dynamic changelog generation from commits
- GitHub App token security
- Automatic major version tag updates (v1 → v1.x.x)

### Release Process
1. **Development**: PRs automatically update draft releases
2. **Testing**: Run `npm run lint` and `npm test` before commits
3. **Release**: Manual workflow dispatch creates versioned release
4. **Distribution**: `dist/index.js` automatically built and committed

### Version Strategy
- **v2**: Current production releases (includes Secure edition support)
- **Major tags**: v1, v2, etc. point to latest minor/patch within that major version
- **Semantic Versioning**: Major.Minor.Patch (e.g., 2.0.0)

## Migration Context

### Legacy Replacement
This action replaces the `github-action-generator` approach:

**Old**: Individual actions per command
```yaml
- uses: liquibase-github-actions/update@v4.32.0
  with:
    changelogFile: 'changelog.xml'
```

**New**: Single setup + flexible commands
```yaml
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
    edition: 'community'
- run: liquibase update --changelog-file=changelog.xml
```

### Related Projects
- **Deprecating**: `../github-action-generator/` - Legacy action generator
- **Documentation**: See `../github-action-generator/CLAUDE.md` for deprecation context

## DevOps Team Notes

### Repository Management
- **Visibility**: Public repository on GitHub Marketplace
- **Team Access**: Liquibase DevOps team maintains this repository
- **CI/CD**: Automated testing and release workflows
- **Security**: Uses GitHub App tokens, not PATs

### Quality Standards
- **Testing**: 83 comprehensive tests across platforms
- **Performance**: <1ms URL generation, <20MB memory usage
- **Compatibility**: Node.js 20, GitHub Actions runtime
- **Documentation**: Production-ready README and examples

### Maintenance Notes
- Always run linting and tests before commits
- All changes require dist/ rebuild via `npm run build`
- Major releases need coordination due to public marketplace presence
- Keep this CLAUDE.md updated for team knowledge sharing

## Path Transformation Feature

### Overview
The action includes automatic path transformation to ensure compatibility and security when using Liquibase environment variables in GitHub Actions.

### How It Works
At action startup, the entry point (`src/index.ts`) proactively scans and transforms all `LIQUIBASE_*` environment variables that likely contain file paths:

1. **Detection**: Identifies environment variables with path indicators (FILE, PATH, DIR, CLASSPATH, OUTPUT, etc.)
2. **Transformation**: Converts absolute paths starting with restricted root directories (e.g., `/liquibase/`, `/usr/`, `/var/`) to workspace-relative paths
3. **Safety**: Prevents permission issues and ensures paths work correctly in GitHub Actions execution context
4. **Directory Creation**: Automatically creates parent directories for file paths when needed

### Example
```yaml
env:
  LIQUIBASE_LOG_FILE: /liquibase/logs/output.log
```

Gets transformed to:
```
./liquibase/logs/output.log
```

### Implementation Details
- Function: `transformLiquibaseEnvironmentVariables()` in `src/index.ts`
- Runs proactively before installation begins
- Handles both colon-separated (Unix) and semicolon-separated (Windows) path lists
- Creates necessary directories for output files
- Provides detailed logging of transformations in GitHub Actions UI

## Edition-Specific Download Logic

### Current Implementation (v2.0.0+)
The installer uses Scarf-tracked download URLs for analytics (DAT-21375). URLs route through `package.liquibase.com` with Scarf package tracking.

**Scarf Packages:**
- `liquibase-community-gha`: Community edition downloads
- `liquibase-pro-gha`: Pro edition downloads (legacy, versions ≤4.33.0)
- `liquibase-secure-gha`: Secure edition downloads

**For 'community' and 'oss' editions:**
- Both use Community Scarf-tracked URLs (treated as aliases for backward compatibility)
- Example: `https://package.liquibase.com/downloads/community/gha/liquibase-4.32.0.tar.gz`

**For 'pro' and 'secure' editions:**
- Versions > 4.33.0: Use Secure Scarf-tracked URLs
- Versions <= 4.33.0: Use legacy Pro Scarf-tracked URLs
- Special handling for test version '5-secure-release-test'
- Example (Pro): `https://package.liquibase.com/downloads/pro/gha/liquibase-pro-4.32.0.tar.gz`
- Example (Secure): `https://package.liquibase.com/downloads/secure/gha/liquibase-secure-4.34.0.tar.gz`

### Code Reference
See `getDownloadUrl()` function in `src/installer.ts:193` for the complete logic.

## Troubleshooting Common Development Issues

### Test Hangs or Memory Issues
- **Problem**: Tests hang or run out of memory during execution
- **Solution**: Tests are configured with `--maxWorkers=1` and `--forceExit` flags. Use `npm run test:memory` for increased heap space
- **Root Cause**: Cross-platform subprocess management can cause hanging handles, especially on Windows

### Build Verification for GitHub Actions
- **Problem**: Action fails with ES module errors in GitHub Actions runtime
- **Solution**: Verify `dist/index.js` contains CommonJS `require()` statements, not ES6 `import` statements
- **Check**: The release workflow includes automated verification in the "Verify build output" step
- **Why**: GitHub Actions Node.js 20 runtime requires CommonJS format

### Extraction Failures on macOS/Linux
- **Problem**: Tar extraction fails with cryptic errors
- **Solution**: The installer includes fallback extraction logic with different tar flags for macOS vs Linux
- **Code**: See `extractLiquibase()` function in `src/installer.ts:189` with platform-specific fallback

### License Validation Timeout
- **Problem**: Pro/Secure edition validation hangs during `liquibase --version` check
- **Solution**: Validation includes 30-second timeout wrapper to prevent hanging
- **Code**: See `validateInstallation()` function in `src/installer.ts:249` with timeout promise race

## Key Files and Their Purpose

- **`dist/index.js`**: Bundled action entry point (committed to repository, built via `@vercel/ncc`)
- **`action.yml`**: GitHub Action metadata defining inputs, outputs, and runtime
- **`jest.config.js`**: Jest configuration with memory management and cross-platform settings
- **`tsconfig.json`**: TypeScript compiler configuration targeting ES2019/Node.js 20
- **`.github/workflows/release-drafter.yml`**: Single workflow handling draft updates and releases
- **`.github/workflows/test.yml`**: PR validation testing across multiple platforms
- **`CHANGELOG.md`**: Auto-generated from commit history during releases