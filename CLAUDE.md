# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the setup-liquibase GitHub Action repository.

## Project Overview

**setup-liquibase** is a production-ready GitHub Action that installs Liquibase for CI/CD workflows. This action **replaces** the legacy `liquibase-github-actions` organization's individual command actions with a single, flexible setup action following GitHub Actions best practices.

### Project Status
- **Status**: Production (v1-beta in UAT, v1 for production)
- **Replaces**: `../github-action-generator/` (being deprecated)
- **Users**: Public GitHub Actions marketplace + internal Liquibase teams
- **Quality**: 83 comprehensive tests, multi-platform support

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
- Memory optimization for tests: Tests are configured with `--max-old-space-size=4096`
- CI tests use `--maxWorkers=2` to prevent resource exhaustion

## Architecture Overview

### Primary Purpose
Single GitHub Action that installs Liquibase (OSS or Pro) and adds it to PATH, allowing users to run any Liquibase command. This replaces the previous approach of having individual actions for each command.

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
- **v1-beta**: UAT testing phase
- **v1**: Production releases
- **Major tags**: v1, v2, etc. point to latest minor/patch

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
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.32.0'
    edition: 'oss'
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