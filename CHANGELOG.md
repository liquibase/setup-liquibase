# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1-beta] - 2025-06-23

### 🚀 Features
- feat: Simplify release automation to single workflow
- feat: Add automatic major version tag updates (v1 → v1.x.x)
- feat: Enhance release workflow to commit changes to main branch and handle detached HEAD state
- feat: Enhance release workflow with asset verification and improved upload handling
- feat: Update release template to include changes summary
- feat: Add build output verification and artifact upload steps to release workflow
- feat: Enhance Jest configuration for improved performance and memory management
- feat: Implement release automation with Release Drafter, PR Labeler, and Tag-based workflows

### 🐛 Bug Fixes
- fix: Update dependabot.yml to resolve labeling conflicts
- fix: Remove duplicate code block in README Pro edition example
- fix: Add missing permissions for issues in PR labeler workflow
- fix: Update permissions in GitHub workflows to ensure proper access for actions and pull requests

### 📚 Documentation
- docs: Update RELEASE_AUTOMATION.md to reflect simplified single workflow approach
- docs: Remove outdated dual-workflow documentation
- docs: update changelog for v1-beta [skip ci]

### 🔧 Maintenance
- chore: Remove redundant release.yml workflow
- chore: Update release automation documentation and improve Jest configuration for better performance and cross-platform compatibility
- chore: update changelog for v1-beta

### 🔄 Other Changes
- Merge pull request #26 from liquibase/DAT-20276
- Merge pull request #25 from liquibase/DAT-20276-release-workflows
- npm(deps-dev): bump @typescript-eslint/eslint-plugin from 8.34.0 to 8.34.1
- npm(deps-dev): bump prettier from 3.5.3 to 3.6.0
- npm(deps-dev): bump eslint-plugin-jest from 28.14.0 to 29.0.1
- npm(deps-dev): bump @types/node from 24.0.1 to 24.0.3
- Merge branch 'main' into DAT-20276-release-workflows
- Remove beta tag exclusion from release trigger in workflow
- Update release.yml to include git-branch and skip-on-empty options for CHANGELOG generation
- Merge pull request #20 from liquibase/DAT-20276
- Update .github/workflows/release.yml
- Merge branch 'main' into DAT-20276
- Add sourcemap register functionality with comprehensive source map support
- Fix Liquibase version handling: ensure default version is used if no input is provided
- Enhance path validation in performance tests: add checks for fresh and cached install paths, and improve logging for path consistency and existence
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
- Clean up repository for public release
- Rebuild distribution files to address security alerts
- Fix GitHub Actions failures and warnings
- Add comprehensive UAT testing documentation and workflow
- Prepare v1-beta release

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
- **Commit**: 54c8d98b08c8a0565347ec6dac71a793dc33fe1a
- **Branch**: main
- **Build**: #27
- **Timestamp**: 2025-06-23 11:17:30 UTC

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