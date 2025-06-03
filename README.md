# Setup Liquibase

Set up your GitHub Actions workflow with a specific version of Liquibase.

This action provides the following functionality for GitHub Actions users:
- Download and install a specific version of Liquibase
- Support for both Liquibase OSS and Pro editions
- Add Liquibase to the PATH
- Cache downloaded Liquibase versions for improved performance
- Cross-platform support (Linux, Windows, macOS)

## Usage

### Basic Usage

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: 'latest'
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
    license-key: ${{ secrets.LICENSE_KEY }}
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

### Version Range and Caching

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: '^4.20'
    cache: true
    check-latest: true
- run: liquibase --version
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Version of Liquibase to install. Use "latest" for the most recent version. | No | `latest` |
| `edition` | Edition to install: "oss" or "pro" | No | `oss` |
| `license-key` | License key for Liquibase Pro. Required when edition is "pro". | No | |
| `cache` | Used to specify whether caching is needed. Set to true, if you want to enable caching | No | `false` |
| `check-latest` | Set this option if you want the action to check for the latest available version that satisfies the version spec | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `liquibase-version` | The actual version of Liquibase that was installed |
| `liquibase-path` | The path where Liquibase was installed |

## Version Support

This action supports:
- Specific versions: `4.25.0`, `4.24.1`, etc.
- Version ranges: `^4.20`, `~4.25.0`, etc.
- Latest version: `latest`

## Supported Platforms

- Linux (ubuntu-latest, ubuntu-20.04, ubuntu-22.04)
- Windows (windows-latest, windows-2019, windows-2022)
- macOS (macos-latest, macos-11, macos-12, macos-13)

## Caching

When `cache: true` is set, the action will cache the downloaded Liquibase installation. This can significantly improve workflow performance for subsequent runs.

```yaml
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.25.0'
    cache: true
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
    steps:
    - uses: actions/checkout@v4
    
    - uses: liquibase/setup-liquibase@v1
      with:
        version: '4.25.0'
        edition: 'pro'
        license-key: ${{ secrets.LICENSE_KEY }}
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
        cache: true
    
    - name: Test Migration
      run: |
        liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
        liquibase rollback-count 1 --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

## Security Considerations

- Store sensitive information like license keys in GitHub Secrets
- Use `license-key: ${{ secrets.LICENSE_KEY }}`
- Never commit license keys directly to your repository

## Migration from Legacy Actions

If you're migrating from individual Liquibase actions, here's how to convert:

### Before (Legacy)
```yaml
- uses: liquibase/liquibase-update-action@v1
  with:
    changeLogFile: 'changelog.xml'
    url: 'jdbc:h2:mem:test'
```

### After (setup-liquibase)
```yaml
- uses: liquibase/setup-liquibase@v1
  with:
    version: 'latest'
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.