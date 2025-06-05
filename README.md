# Setup Liquibase

Set up your GitHub Actions workflow with a specific version of Liquibase.

This action provides the following functionality for GitHub Actions users:
- Download and install a specific version of Liquibase
- Support for both Liquibase OSS and Pro editions
- Add Liquibase to the PATH
- Cache downloaded Liquibase versions for improved performance
- Cross-platform support (Linux, Windows, macOS)

## Quick Start

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: 'latest'
    edition: 'oss'
- run: liquibase --version
```

## Features

- **Version Control**: Install specific versions or use version ranges
- **Edition Support**: Works with both OSS and Pro editions
- **Caching**: Optional caching for faster workflow runs
- **Cross-Platform**: Supports Linux, Windows, and macOS runners
- **Environment Variables**: Supports LIQUIBASE_LICENSE_KEY environment variable for Pro edition

## Usage Examples

### Basic Usage

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: 'latest'
    edition: 'oss'
- run: liquibase --version
```

### Liquibase OSS with Specific Version

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.25.0'
    edition: 'oss'
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

### Liquibase Pro with License Key

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: 'latest'
    edition: 'pro'
  env:
    LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

### Version Range with Caching

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: '^4.20'
    cache: true
- run: liquibase --version
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Version of Liquibase to install. Supports specific versions (e.g., "4.25.0"), version ranges (e.g., "^4.20"), or "latest" | No | `latest` |
| `edition` | Edition to install: "oss" (Open Source) or "pro" (Professional) | Yes | |
| `license-key` | License key for Liquibase Pro. Required when edition is "pro". Can be provided via this input or LIQUIBASE_LICENSE_KEY environment variable. Store this securely in GitHub Secrets. | No | |
| `cache` | Enable caching of downloaded Liquibase installations to improve workflow performance on subsequent runs | No | `false` |
| `check-latest` | Check for the latest available version that satisfies the version specification, even if a cached version exists. Note: This will bypass the cache if enabled. | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `liquibase-version` | The actual version of Liquibase that was installed (useful when using "latest" or version ranges) |
| `liquibase-path` | The file system path where Liquibase was installed and added to PATH |

## Version Support

This action supports:
- Specific versions: `4.25.0`, `4.24.1`, etc.
- Version ranges: `^4.20`, `~4.25.0`, etc.
- Latest version: `latest`

When using version ranges or `latest`, you can set `check-latest: true` to ensure you get the most recent version that satisfies your requirements.

## Platform Support

- Linux (ubuntu-latest, ubuntu-20.04, ubuntu-22.04)
- Windows (windows-latest, windows-2019, windows-2022)
- macOS (macos-latest, macos-11, macos-12, macos-13)

The action automatically detects the platform and uses the appropriate archive format (`.zip` for Windows, `.tar.gz` for Linux/macOS).

## Caching

When `cache: true` is set, the action will cache the downloaded Liquibase installation. This can significantly improve workflow performance for subsequent runs.

The cache is unique per:
- Version
- Edition (OSS vs Pro)

If you want to ensure you're always using the latest version that satisfies your requirements, you can set `check-latest: true`. This will bypass the cache and download the latest version.

```yaml
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.25.0'
    cache: true
    # check-latest: true  # Only use this if you want to bypass the cache
```

## Pro Edition Support

The action supports both Liquibase OSS and Pro editions. The Pro edition requires a valid license key and must be explicitly specified using `edition: 'pro'`.

The license key can be provided in two ways:
1. Using the `license-key` input parameter
2. Using the `LIQUIBASE_LICENSE_KEY` environment variable (recommended)

```yaml
# Using license-key input
- uses: liquibase/setup-liquibase@v1
  with:
    version: 'latest'
    edition: 'pro'
    license-key: ${{ secrets.LIQUIBASE_LICENSE_KEY }}

# Using environment variable (recommended)
- uses: liquibase/setup-liquibase@v1
  with:
    version: 'latest'
    edition: 'pro'
  env:
    LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
```

## Complete Workflow Examples

### Simple Database Migration

```yaml
name: Database Migration
on: [push, pull_request]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - uses: liquibase/setup-liquibase@v1
      with:
        version: 'latest'
        edition: 'oss'
        cache: true
    
    - name: Run Liquibase Update
      run: |
        liquibase update \
          --changelog-file=db/changelog/db.changelog-master.xml \
          --url=jdbc:h2:mem:test \
          --username=sa \
          --password=
```

### Liquibase Pro with Multiple Commands

```yaml
name: Pro Database Operations
on: [push]

jobs:
  database-operations:
    runs-on: ubuntu-latest
    env:
      LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
    steps:
    - uses: actions/checkout@v4
    
    - uses: liquibase/setup-liquibase@v1
      with:
        version: '4.25.0'
        edition: 'pro'
        cache: true
    
    - name: Validate Changelog
      run: liquibase validate --changelog-file=changelog.xml
    
    - name: Generate Diff Report
      run: |
        liquibase diff-changelog \
          --reference-url=jdbc:postgresql://localhost/reference_db \
          --url=jdbc:postgresql://localhost/target_db \
          --changelog-file=diff.xml
    
    - name: Run Quality Checks
      run: liquibase checks run --changelog-file=changelog.xml
```

### Matrix Testing Across Versions

```yaml
name: Test Multiple Liquibase Versions
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        liquibase-version: ['4.23.0', '4.24.0', '4.25.0', 'latest']
    
    steps:
    - uses: actions/checkout@v4
    
    - uses: liquibase/setup-liquibase@v1
      with:
        version: ${{ matrix.liquibase-version }}
        edition: 'oss'
        cache: true
    
    - name: Test Migration
      run: |
        liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
        liquibase rollback-count 1 --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

## Security Considerations

- Store sensitive information like license keys in GitHub Secrets
- Use `license-key: ${{ secrets.LIQUIBASE_LICENSE_KEY }}` or `LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}`
- Never commit license keys directly to your repository

## Migration from Legacy Actions

If you're migrating from the official Liquibase GitHub Actions, here's how to convert:

### Before (Legacy)
```yaml
- uses: liquibase-github-actions/update@v4.32.0
  with:
    changelogFile: 'changelog.xml'
    url: 'jdbc:h2:mem:test'
    username: 'sa'
    password: ''
```

### After (setup-liquibase)
```yaml
- uses: liquibase/setup-liquibase@v1
  with:
    version: 'latest'
    edition: 'oss'
- run: liquibase update \
    --changelog-file=changelog.xml \
    --url=jdbc:h2:mem:test \
    --username=sa \
    --password=
```

Note: The legacy actions (like `liquibase-github-actions/update`) are specialized actions for specific Liquibase commands. Our `setup-liquibase` action provides more flexibility by installing Liquibase and allowing you to run any Liquibase command directly.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.