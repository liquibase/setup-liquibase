# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

### Core Commands
- `npm ci` - Install dependencies (use instead of npm install)
- `npm run build` - Build TypeScript to JavaScript bundle (dist/index.js)
- `npm run test` - Run all tests with memory optimization
- `npm run test:ci` - Run tests in CI mode (limited workers, no coverage)
- `npm run lint` - Run ESLint on TypeScript files
- `npm run format` - Format code with Prettier
- `npm run package` - Build and test in one command

### Testing
- Run a single test file: `npm test -- __tests__/unit/installer.test.ts`
- Run tests with pattern: `npm test -- --testNamePattern="should validate"`
- Memory optimization for tests: Tests are configured with `--max-old-space-size=4096`
- CI tests use `--maxWorkers=2` to prevent resource exhaustion

## Architecture Overview

This is a GitHub Action that downloads and installs Liquibase (OSS or Pro editions) for use in CI/CD workflows.

### Key Components

1. **Entry Point** (`src/index.ts`)
   - Reads action inputs (version, edition, cache)
   - Validates inputs
   - Calls installer and sets outputs

2. **Installer** (`src/installer.ts`)
   - Core installation logic
   - Platform detection (Windows/Unix)
   - Download URL construction
   - Caching support via GitHub's tool-cache
   - License key handling for Pro edition

3. **Version Resolver** (`src/version-resolver.ts`)
   - Validates semantic versions
   - Ensures version >= 4.32.0
   - Constructs download URLs based on edition/platform

4. **Configuration** (`src/config.ts`)
   - Central location for all URLs and constants
   - Download URL templates for OSS/Pro editions
   - Note: OSS URLs use 'v' prefix, Pro URLs do not

### Important Implementation Details

- **Minimum Version**: 4.32.0 (enforced due to download endpoint compatibility)
- **Editions**: 'oss' (Open Source) or 'pro' (Professional)
- **Pro License**: Must be provided via `LIQUIBASE_LICENSE_KEY` environment variable
- **Caching**: Uses GitHub's tool-cache, keyed by version+edition
- **Platforms**: Supports Linux (.tar.gz), Windows (.zip), and macOS (.tar.gz)
- **Build Output**: TypeScript compiles to single `dist/index.js` with source maps

### Testing Structure

- **Unit Tests** (`__tests__/unit/`): Test individual modules
- **Integration Tests** (`__tests__/integration/`): Test real installations
- **Performance Tests** (`__tests__/performance/`): Verify memory/speed constraints
- **Error Handling Tests**: Validate failure scenarios
- Tests use Jest with ts-jest for TypeScript support
- CI workflow tests across Ubuntu, Windows, and macOS

### GitHub Action Configuration

- **action.yml**: Defines inputs (version, edition, cache) and outputs (liquibase-version, liquibase-path)
- **Node Runtime**: Uses Node.js 20
- **Icon**: Database icon with blue color for marketplace

### Release Process

When preparing for production:
1. Run `npm run lint` to check code style
2. Run `npm test` to verify all tests pass
3. Run `npm run build` to generate dist/index.js
4. Commit both source and dist changes
5. Create GitHub release with semantic version tag