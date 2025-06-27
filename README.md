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
    version: '4.32.0'
    edition: 'oss'
- run: liquibase --version
```

## Features

- **Version Control**: Install specific versions (4.32.0+) with exact version specification
- **Edition Support**: Works with both OSS and Pro editions
- **Caching**: Optional caching for faster workflow runs
- **Cross-Platform**: Supports Linux, Windows, and macOS runners
- **Environment Variables**: Supports LIQUIBASE_LICENSE_KEY environment variable for Pro edition
- **Production Ready**: Comprehensive testing with 83 test cases covering all scenarios
- **CI Optimized**: Memory management and performance optimizations for GitHub Actions

## Quality & Reliability

This action is production-ready with comprehensive testing and CI optimizations:

- **83 comprehensive tests** covering functionality, performance, and error handling
- **Cross-platform validation** on Ubuntu, Windows, and macOS
- **Performance benchmarks**: < 1ms URL generation, < 20MB memory usage
- **CI/CD optimized** with memory management and timeout handling
- **Real-world scenarios** tested with actual Liquibase installations
- **Error handling** with descriptive messages for all failure cases

## Usage Examples

### Basic Usage

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.32.0'
    edition: 'oss'
- run: liquibase --version
```

### Liquibase OSS with Specific Version

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.32.0'
    edition: 'oss'
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

### Liquibase Pro with License Key (Environment Variable)

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.32.0'
    edition: 'pro'
  env:
    LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

### With Caching

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.32.0'
    cache: true
- run: liquibase --version
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Specific version of Liquibase to install (e.g., "4.32.0"). Must be 4.32.0 or higher. | Yes | |
| `edition` | Edition to install: "oss" (Open Source) or "pro" (Professional). For Pro edition, set LIQUIBASE_LICENSE_KEY environment variable. | Yes | |
| `cache` | Enable caching of downloaded Liquibase installations to improve workflow performance on subsequent runs | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `liquibase-version` | The version of Liquibase that was installed |
| `liquibase-path` | The file system path where Liquibase was installed and added to PATH |

## Version Support

This action supports Liquibase versions 4.32.0 and higher:
- Specific versions only: `4.32.0`, `4.33.0`, `5.0.0`, etc.
- Must be a valid semantic version (e.g., "4.32.0")

The minimum supported version is `4.32.0` to ensure compatibility with the official Liquibase download endpoints used by this action.

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

```yaml
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.32.0'
    cache: true
```

## Pro Edition Support

The action supports both Liquibase OSS and Pro editions. The Pro edition requires a valid license key and must be explicitly specified using `edition: 'pro'`.

The license key must be provided using the `LIQUIBASE_LICENSE_KEY` environment variable:

```yaml
- uses: liquibase/setup-liquibase@v1
  with:
    version: '4.32.0'
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
        version: '4.32.0'
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
        version: '4.32.0'
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

### Using Liquibase Flow Files (Pro Edition)

Flow files enable portable, platform-independent Liquibase workflows. Best practice is to store Flow files in centralized locations like template repositories or S3 for version control, reusability, and governance.

**Important**: The `--search-path` parameter is a global flag and must be specified before the command (e.g., `liquibase --search-path=... flow`). This parameter affects `--flow-file` and `--changelog-file` path resolution, but does not affect `--defaults-file` which requires an absolute path.

#### Example 1: Flow Files from Template Repository

```yaml
name: Database Deployment with Template Flow
on: [push]

jobs:
  deploy-with-flow:
    runs-on: ubuntu-latest
    env:
      LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
    steps:
    - uses: actions/checkout@v4
    
    # Checkout template repository containing Flow files
    - uses: actions/checkout@v4
      with:
        repository: my-org/liquibase-flow-templates
        path: flow-templates
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - uses: liquibase/setup-liquibase@v1
      with:
        version: '4.32.0'
        edition: 'pro'
        cache: true
    
    - name: Execute Flow from Template
      run: |
        liquibase --search-path=flow-templates/resources flow \
          --flow-file=flow-templates/flows/production-deployment.flowfile.yaml \
          --url=jdbc:postgresql://localhost/mydb \
          --username=dbuser \
          --password=${{ secrets.DB_PASSWORD }}
```

#### Example 2: Flow Files from S3

**Note**: S3 integration requires the `liquibase-aws-extension` JAR file to be available in Liquibase's classpath. Download the extension from [Maven Central](https://mvnrepository.com/artifact/org.liquibase.ext/liquibase-aws-extension) and include it using the `--classpath` parameter. Extensions can be also installed using [lpm](https://github.com/liquibase/liquibase-package-manager)

```yaml
name: Database Deployment with S3 Flow
on: [push]

jobs:
  deploy-with-s3-flow:
    runs-on: ubuntu-latest
    env:
      LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_REGION: us-east-1
    steps:
    - uses: actions/checkout@v4
    
    - uses: liquibase/setup-liquibase@v1
      with:
        version: '4.32.0'
        edition: 'pro'
        cache: true
    
    - name: Download AWS Extension (Direct JAR)
      run: |
        wget -O liquibase-aws-extension.jar https://repo1.maven.org/maven2/org/liquibase/ext/liquibase-aws-extension/1.0.1/liquibase-aws-extension-1.0.1.jar
        
    - name: Execute Flow from S3 (Direct JAR)
      run: |
        liquibase --classpath=liquibase-aws-extension.jar --search-path=s3://my-bucket/liquibase/resources,. flow \
          --flow-file=s3://my-bucket/liquibase/flows/production-deployment.flowfile.yaml \
          --url=jdbc:postgresql://localhost/mydb \
          --username=dbuser \
          --password=${{ secrets.DB_PASSWORD }}
          
    # Alternative: Using extensions installed via Package Manager
    - name: Install AWS Extension via Package Manager
      run: |
        # Install the Liquibase Package Manager
        wget -O lpm.zip https://github.com/liquibase/liquibase-package-manager/releases/download/v0.2.9/lpm-0.2.9-linux.zip
        unzip lpm.zip
        # Install the AWS extension
        ./lpm add liquibase-aws-extension
        
    # Alternative: Using extensions installed via Package Manager
    - name: Execute Flow from S3 (Package Manager)
      run: |
        liquibase --search-path=s3://my-bucket/liquibase/resources,. flow \
          --flow-file=s3://my-bucket/liquibase/flows/production-deployment.flowfile.yaml \
          --url=jdbc:postgresql://localhost/mydb \
          --username=dbuser \
          --password=${{ secrets.DB_PASSWORD }}
    
    # Using environment variable for search path
    - name: Execute Flow with Environment Variable
      env:
        LIQUIBASE_SEARCH_PATH: s3://my-bucket/liquibase/resources
      run: |
        liquibase flow \
          --flow-file=s3://my-bucket/liquibase/flows/staging-deployment.flowfile.yaml \
          --url=jdbc:postgresql://localhost/mydb \
          --username=dbuser \
          --password=${{ secrets.DB_PASSWORD }}
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
        liquibase-version: ['4.32.0', '4.33.0']
    
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
- Use `LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}` in the environment
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
    version: '4.32.0'
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