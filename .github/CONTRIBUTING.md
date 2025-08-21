# Contributing to Setup Liquibase

We love your input! We want to make contributing to Setup Liquibase as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with GitHub

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the Apache 2.0 License

In short, when you submit code changes, your submissions are understood to be under the same [Apache 2.0 License](http://choosealicense.com/licenses/apache-2.0/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/liquibase/setup-liquibase/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/liquibase/setup-liquibase/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm (comes with Node.js)

### Setup Instructions

1. Fork the repository and clone your fork
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Build the action:
   ```bash
   npm run build
   ```
4. Run tests:
   ```bash
   npm test
   ```

### Running Tests

This repository has comprehensive test coverage that external contributors can run:

#### ✅ **Tests External Contributors Can Run**
- **Unit tests**: Core functionality validation
- **OSS Edition tests**: Installation and integration testing
- **Error handling tests**: Invalid input validation
- **Performance tests**: Baseline performance validation
- **Cross-platform tests**: Ubuntu, Windows, macOS compatibility

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=unit
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=performance
```

#### ⚠️ **Secure License Tests (Maintainer Only)**

Secure edition tests require a Liquibase Secure license and will be **automatically skipped** for external contributors:

- Secure edition installation
- Secure feature validation
- Secure license verification

**For External Contributors**: This is expected behavior. Your PRs will be fully validated using OSS tests, which cover 95%+ of the action's functionality.

**For Maintainers**: Secure tests run automatically when the `PRO_LICENSE_KEY` repository secret is available.

### Continuous Integration

When you create a pull request:

1. **✅ All core tests run** - No secrets required
2. **⏩ Secure tests skip gracefully** - Expected for external PRs
3. **✅ Cross-platform validation** - Ubuntu, Windows, macOS
4. **✅ Integration testing** - Real Liquibase installation and commands

Your contribution will be fully validated even without Secure license access.

## Use a Consistent Coding Style

* Use TypeScript for all new code
* 2 spaces for indentation rather than tabs
* Run `npm run lint` for style verification
* Run `npm run build` before committing to ensure distribution files are updated

## Testing Your Changes

Before submitting a PR:

1. **Run the full test suite**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

2. **Test your changes manually** (optional but recommended):
   - Create a test workflow in a fork
   - Use your action with `uses: your-username/setup-liquibase@your-branch`
   - Validate OSS edition functionality

3. **Check that all tests pass in CI** - Secure tests may show as skipped, this is expected

## Getting Help

- **Questions about development**: Open a discussion in the repository
- **Bug reports**: Use the issue template
- **Feature requests**: Open an issue with detailed use case
- **Secure license testing**: Only maintainers can fully test Secure features

## License

By contributing, you agree that your contributions will be licensed under its Apache 2.0 License. 