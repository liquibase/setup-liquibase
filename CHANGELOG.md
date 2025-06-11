# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Support for selecting 'latest' version of Liquibase
- Comprehensive test suite with performance, integration, and error handling tests
- CI/CD optimizations for GitHub Actions with memory management
- Test setup with automatic garbage collection and resource cleanup
- Performance benchmarks with CI-environment tolerances

### Enhanced
- Version resolver to support automatic resolution of latest Liquibase release
- Jest configuration with 30-second timeouts and force exit for CI reliability
- Memory management with Node.js optimization flags (`--max-old-space-size=4096 --expose-gc`)
- Test worker limits (2 workers in CI) to prevent resource exhaustion
- Performance tests with realistic tolerances for CI environment variability

### Fixed
- GitHub Actions test timeout issues in CI environments
- Memory usage tests adjusted for CI environment variability (10MB → 20MB tolerance)
- Performance consistency tests with appropriate CI tolerance (CV < 250%)
- Integration tests to properly handle success cases instead of expecting failures
- Test resource cleanup to prevent hanging processes

### Testing
- 83 comprehensive tests covering all functionality
- Tests for 'latest' version resolution and installation
- Cross-platform testing on Ubuntu, Windows, and macOS
- Performance benchmarks: URL generation < 1ms, memory usage < 20MB increase
- Error handling tests for all failure scenarios
- Real-world integration scenarios with actual Liquibase installations

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