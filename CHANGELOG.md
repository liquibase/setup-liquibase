# Changelog

## What's Changed in v1-beta

### 🚀 Features
- feat: Implement release automation with Release Drafter, PR Labeler, and Tag-based workflows

### 🐛 Bug Fixes
- fix: Update permissions in GitHub workflows to ensure proper access for actions and pull requests

### 📚 Documentation
- No documentation changes in this release

### 🔧 Maintenance
- chore: Update release automation documentation and improve Jest configuration for better performance and cross-platform compatibility

### 🔄 Other Changes
- Remove beta tag exclusion from release trigger in workflow
- Update release.yml to include git-branch and skip-on-empty options for CHANGELOG generation
- Merge pull request #20 from liquibase/DAT-20276
- Update .github/workflows/release.yml
- Update .github/workflows/release.yml
- Merge branch 'main' into DAT-20276
- Add sourcemap register functionality with comprehensive source map support
- Fix Liquibase version handling: ensure default version is used if no input is provided
- Enhance path validation in performance tests: add checks for fresh and cached install paths, and improve logging for path consistency and existence.
- Allow Liquibase version input override in UAT workflow
- Refactor Liquibase version handling: use default version directly and allow input override
- Enhance UAT Testing Workflow: Introduce flexible test scopes, version inputs, and comprehensive performance checks
- Simplify UAT workflow by removing input options - always run complete test suite
- Implement optimized hybrid UAT workflow - 50% fewer jobs with same coverage
- Optimize UAT testing workflow for QA engineer workflow validation
- Improve platform tests: add real Liquibase functionality testing
- Fix UAT basic tests cache matrix: add both true and false values
- Simplify UAT integration tests: use existing changelog.xml
- Fix UAT integration tests: revert to file-based H2 database
- Fix UAT workflow issues: clear job naming and integration test improvements
- Implement external contributor support and fix Pro license secret mapping (#19)
- Implement external contributor support and fix Pro license secret mapping
- Clean up repository for public release
- Rebuild distribution files to address security alerts
- Fix GitHub Actions failures and warnings
- Add comprehensive UAT testing documentation and workflow
- Prepare v1-beta release
- npm(deps-dev): bump @typescript-eslint/parser from 8.33.1 to 8.34.0 (#17)
- npm(deps-dev): bump eslint from 9.28.0 to 9.29.0 (#16)
- npm(deps-dev): bump jest and @types/jest (#18)
- npm(deps-dev): bump ts-jest from 29.3.4 to 29.4.0 (#15)
- npm(deps-dev): bump @types/node from 22.15.29 to 24.0.1 (#13)
- npm(deps-dev): bump eslint-plugin-jest from 28.12.0 to 28.14.0 (#12)
- npm(deps-dev): bump @typescript-eslint/eslint-plugin (#11)
- DAT-20276 DevOps :: Create new setup-liquibase Github Action (#10)
- update examples
- Update pro-usage example to use liquibase organization
- Remove check-latest and license-key inputs (#7)
- Remove auto detection feature (#5)
- Merge pull request #4 from jnewton03/remove-auto-detection-feature
- Fix integration test workflow to include required edition parameter
- Remove auto-detection and require explicit edition input
- Merge pull request #3 from jnewton03/dependabot/github_actions/TriPSs/conventional-changelog-action-6
- Merge pull request #2 from jnewton03/dependabot/github_actions/softprops/action-gh-release-2
- Merge pull request #1 from jnewton03/dependabot/github_actions/github/codeql-action-3
- github-actions(deps): bump TriPSs/conventional-changelog-action
- github-actions(deps): bump softprops/action-gh-release from 1 to 2
- github-actions(deps): bump github/codeql-action from 2 to 3
- Add initial configuration files for GitHub Actions workflows and changelog
- Update README to clarify migration instructions from legacy Liquibase actions and include username and password parameters
- Update README to enhance quick start guide and clarify usage examples for Liquibase action
- Specify bash shell for Liquibase update and history verification steps in GitHub Actions workflow
- Update Liquibase test database URL to use a local path
- Remove changelog-file argument from Liquibase history verification in GitHub Actions workflow
- Add Liquibase changelog and update GitHub Actions workflow for database updates
- Enhance README and installer to support check-latest option and Pro edition detection
- Add tests for setupLiquibase function and mock dependencies in installer tests
- Add TEST_VERSIONS constant and update getDownloadUrl function to accept extension parameter
- Refactor getDownloadUrl function to simplify download URL logic and remove commented Pro-specific code
- Refactor getDownloadUrl function to remove edition parameter and simplify download URL logic
- Refactor download URL logic to use OSS endpoint for both editions until Pro endpoint is fully supported
- Refactor Jest configuration to use ES module syntax and enhance TypeScript support
- Refactor installer and version resolver by removing unused imports and updating devDependencies
- Refactor version resolution in VersionResolver class
- Refactor version resolution logic in installer.ts
- Enhance GitHub Actions workflow by adding GITHUB_TOKEN for improved authentication
- Refactor license key parameter naming for consistency across documentation and code
- Implement engineering feedback improvements
- Add comprehensive documentation and improve workflow naming
- Fix TypeScript build errors and npm deprecation warnings
- Fix tests and validation logic
- Fix ESLint configuration and remove unused import
- Add package-lock.json for reproducible builds
- Fix integration tests by building action before use
- Remove .claude directory and add to .gitignore

### 📖 Usage Example
```yaml
steps:
  - name: Setup Liquibase
    uses: liquibase-github-actions/setup-liquibase@v1-beta
    with:
      liquibase-version: "latest"
```

---
**Build Information:**
- **Commit**: 4cefbcb58d9c09afc27f683559d02e48a82728bf
- **Branch**: main
- **Build**: #9
- **Timestamp**: 2025-06-23 08:14:56 UTC


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-beta.1] - 2025-06-20

### Added
- Comprehensive test suite with performance, integration, and error handling tests
- CI/CD optimizations for GitHub Actions with memory management
- Test setup with automatic garbage collection and resource cleanup
- Performance benchmarks with CI-environment tolerances
- Complete dependency updates (Jest 30.0.2, TypeScript ESLint 8.34.0, ESLint 9.29.0)

### Enhanced
- Jest configuration with 30-second timeouts and force exit for CI reliability
- Memory management with Node.js optimization flags (`--max-old-space-size=4096 --expose-gc`)
- Test worker limits (2 workers in CI) to prevent resource exhaustion
- Performance tests with realistic tolerances for CI environment variability
- Updated all development dependencies to latest versions

### Fixed
- GitHub Actions test timeout issues in CI environments
- Memory usage tests adjusted for CI environment variability (10MB → 20MB tolerance)
- Performance consistency tests with appropriate CI tolerance (CV < 250%)
- Integration tests to properly handle success cases instead of expecting failures
- Test resource cleanup to prevent hanging processes

### Testing
- 83 comprehensive tests covering all functionality
- Cross-platform testing on Ubuntu, Windows, and macOS
- Performance benchmarks: URL generation < 1ms, memory usage < 20MB increase
- Error handling tests for all failure scenarios
- Real-world integration scenarios with actual Liquibase installations

### Dependencies Updated
- `@types/jest`: ^29.5.12 → ^30.0.0
- `@types/node`: ^22.15.29 → ^24.0.1
- `@typescript-eslint/eslint-plugin`: ^8.33.1 → ^8.34.0
- `@typescript-eslint/parser`: ^8.33.1 → ^8.34.1
- `eslint`: ^9.28.0 → ^9.29.0
- `eslint-plugin-jest`: ^28.12.0 → ^28.14.0
- `jest`: ^29.7.0 → ^30.0.2
- `ts-jest`: ^29.3.4 → ^29.4.0

## [1.0.0] - 2024-03-19

### Added
- Initial release of the setup-liquibase action
- Support for both OSS and Pro editions
- Version support: specific versions (4.32.0+) and 'latest'
- Caching support for improved workflow performance
- Cross-platform support (Linux, Windows, macOS)
- Auto-detection of Pro edition when license key is provided
- Dual license key input support (environment variable + input parameter)
- Comprehensive error handling with descriptive messages
- PATH integration for seamless command execution
- Output variables for version and installation path