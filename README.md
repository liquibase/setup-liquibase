# Setup Liquibase

Set up your GitHub Actions workflow with a specific version of Liquibase.

> [!IMPORTANT]
> **Liquibase 5.0+ Community Edition Changes**: Starting with Liquibase 5.0, the Community edition (formerly known as OSS) no longer includes database drivers and extensions. You'll need to use the Liquibase Package Manager (LPM) to install required drivers.
>
> **Want drivers and extensions included?** Upgrade to the **Secure edition** which includes most drivers (except non-redistributable ones like MySQL), extensions, and additional enterprise features. See [Secure Edition Support](#secure-edition-support) for details.
>
> For complete guidance on using LPM with the Community edition, see the [Liquibase 5.0 Getting Started Guide](https://docs.liquibase.com/secure/get-started-5-0) and [Using LPM with Community Edition](#using-lpm-with-community-edition) section below.

This action provides the following functionality for GitHub Actions users:
- Download and install a specific version of Liquibase
- Support for both Liquibase Community and Secure editions
- Add Liquibase to the PATH
- Simple, reliable Liquibase installation for CI/CD workflows
- Cross-platform support (Linux, Windows, macOS)

## Quick Start

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
    edition: 'community'
- run: liquibase --version
```

## Features

- **Version Control**: Install specific versions (4.32.0+) with exact version specification
- **Edition Support**: Works with both Community and Secure editions
- **Intelligent Caching**: Automatic tool caching for instant setup on subsequent runs (see [Caching Behavior](#caching-behavior))
- **Custom Download Sources**: Download from internal artifact repositories (Nexus, Artifactory) for firewall-protected environments
- **Enhanced Logging**: Clear progress indicators, path transparency, and migration guidance
- **Path Safety**: Automatic transformation of absolute paths for GitHub Actions compatibility
- **Performance**: Optimized installation for faster workflow runs
- **Cross-Platform**: Supports Linux, Windows, and macOS runners
- **Environment Variables**: Supports LIQUIBASE_LICENSE_KEY environment variable for Secure edition
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

## Caching Behavior

This action automatically caches Liquibase installations using the `@actions/tool-cache` API, providing significant performance improvements especially on self-hosted runners.

### How It Works

1. **First Run** (Cache Miss):
   - Downloads Liquibase from official sources (~10-30 seconds)
   - Extracts and validates the installation
   - Caches the installation in the GitHub Actions tool cache
   - Total time: ~10-30 seconds depending on network speed

2. **Subsequent Runs** (Cache Hit):
   - Retrieves Liquibase from the tool cache instantly
   - Skips download and extraction steps entirely
   - Total time: <1 second

### Cache Key Strategy

Liquibase installations are cached with unique keys based on:
- **Tool name**: `liquibase-<edition>` (e.g., `liquibase-community`, `liquibase-secure`)
- **Version**: Exact version number (e.g., `4.32.0`)

This ensures that different versions and editions are cached separately, allowing you to use multiple versions across different workflows without conflicts.

**Example cache keys:**
- `liquibase-community/4.32.0/x64`
- `liquibase-secure/4.33.0/x64`
- `liquibase-community/4.34.0/x64`

### Benefits

- **Performance**: 10-30 seconds saved per workflow run after the first installation
- **Bandwidth**: Reduces network usage by avoiding repeated downloads
- **Reliability**: Eliminates download failures on subsequent runs
- **Disk Space**: Prevents accumulation of temporary directories (especially important for self-hosted runners)

### Cache Management

**GitHub-hosted runners**: Caches are automatically cleaned up when runners are destroyed after each job. No manual intervention needed.

**Self-hosted runners**: Caches persist across runs and are managed by the GitHub Actions runner. The tool cache is located in:
- Linux/macOS: `$RUNNER_TOOL_CACHE` or `$HOME/.runner-tool-cache`
- Windows: `%RUNNER_TOOL_CACHE%` or `%USERPROFILE%\.runner-tool-cache`

To clear the cache manually on self-hosted runners if needed:
```bash
rm -rf $RUNNER_TOOL_CACHE/liquibase
```

### Example Workflow Output

**First run:**
```
🚀 Setting up Liquibase COMMUNITY 4.32.0
💾 Liquibase not found in cache, proceeding with fresh installation
📥 Downloading from: https://package.liquibase.com/...
📦 Extracting Liquibase archive...
💾 Caching Liquibase installation for future workflow runs...
✅ Installation completed successfully
```

**Subsequent runs:**
```
🚀 Setting up Liquibase COMMUNITY 4.32.0
✨ Using cached Liquibase COMMUNITY 4.32.0 from tool cache
✅ Liquibase installation validated successfully
```

## Usage Examples

### Basic Usage

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
    edition: 'community'
- run: liquibase --version
```

### Liquibase Community Edition with Specific Version

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
    edition: 'community'
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

### Liquibase Secure with License Key

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
    edition: 'secure'
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
  env:
    LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
```

### Production Usage

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
- run: liquibase --version
```

### Custom Download Source (For Internal/Firewall-Protected Environments)

If your self-hosted runners are behind a firewall and need to download Liquibase from an internal repository (like Nexus or Artifactory), you can specify a custom download URL:

#### Using Action Input

```yaml
steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
    edition: 'oss'
    download-url-base: 'https://nexus.company.com/repository/liquibase/{version}/liquibase-{version}.{extension}'
- run: liquibase --version
```

#### Using Environment Variable

```yaml
env:
  LIQUIBASE_DOWNLOAD_URL_BASE: 'https://artifactory.company.com/libs-release/liquibase/{version}/liquibase-{version}.{extension}'

steps:
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
    edition: 'oss'
- run: liquibase --version
```

#### Supported Placeholders

The custom URL template supports the following placeholders:

- `{version}` - **Required**. The Liquibase version (e.g., "4.32.0")
- `{platform}` - Platform identifier: "windows" or "unix"
- `{extension}` - File extension: "zip" (Windows) or "tar.gz" (Unix/macOS)
- `{edition}` - Edition identifier: "oss", "pro", or "secure"

#### Examples for Popular Artifact Repositories

**Nexus Repository:**
```yaml
download-url-base: 'https://nexus.company.com/repository/raw-hosted/liquibase/{version}/liquibase-{version}.{extension}'
```

**Artifactory:**
```yaml
download-url-base: 'https://artifactory.company.com/artifactory/libs-release/liquibase/{version}/liquibase-{version}.{extension}'
```

**With Edition and Platform:**
```yaml
download-url-base: 'https://internal-repo.company.com/{platform}/liquibase-{edition}-{version}.{extension}'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Specific version of Liquibase to install (e.g., "4.32.0"). Must be 4.32.0 or higher. | Yes | |
| `edition` | Edition to install: "community" (Community edition, formerly OSS) or "secure" (Secure edition). "oss" and "pro" are supported for backward compatibility. For Secure edition, set LIQUIBASE_LICENSE_KEY environment variable when running Liquibase commands. | Yes | |
| `download-url-base` | Optional custom base URL for downloading Liquibase binaries from internal or alternative sources (e.g., Nexus, Artifactory). Use `{version}` as placeholder for version number, `{platform}` for platform (windows/unix), `{extension}` for file extension (zip/tar.gz), and `{edition}` for edition (community/oss/pro/secure). Can also be set via `LIQUIBASE_DOWNLOAD_URL_BASE` environment variable. Example: `https://internal-repo.company.com/liquibase/{version}/liquibase-{version}.{extension}`. Note: Caching is disabled when using custom URLs. | No | (uses official Liquibase download URLs) |

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

**Important for Liquibase 5.0+ with Community edition**: Starting with version 5.0.0, the Community edition requires the Liquibase Package Manager (LPM) to install database drivers and extensions. See the [Liquibase 5.0+ Community Edition Changes](#liquibase-50-community-edition-changes) section below for details.

## Liquibase 5.0+ Community Edition Changes

**Important for Community Edition Users**: Starting with Liquibase 5.0, the Community edition (formerly known as OSS) ships without database drivers and extensions to provide a lighter, more modular experience.

If you're using Liquibase 5.0+ with `edition: 'community'` (or `edition: 'oss'` for backwards compatibility), you'll need to use the **Liquibase Package Manager (LPM)** to install required drivers and extensions for your specific database.

### What This Means for GitHub Actions

When using `edition: 'community'` with Liquibase 5.0 or later:
- ✅ Liquibase core is installed and ready to use
- ❌ Database drivers (PostgreSQL, MySQL, Oracle, etc.) are **not included**
- ❌ Extensions are **not included**
- 🔧 You must use `liquibase lpm add` to install drivers before running migrations

### Quick Example

```yaml
steps:
- uses: liquibase/setup-liquibase@v2
  with:
    version: '5.0.0'
    edition: 'community'

# Install PostgreSQL driver using LPM
- name: Install PostgreSQL Driver
  run: liquibase lpm add postgresql --global

# Now you can run Liquibase commands
- run: liquibase update --changelog-file=changelog.xml --url=jdbc:postgresql://...
```

For complete guidance on using LPM, see:
- 📚 [Liquibase 5.0 Getting Started Guide](https://docs.liquibase.com/secure/get-started-5-0)
- 📦 [Liquibase Package Manager Repository](https://github.com/liquibase/liquibase-package-manager)

See the [Using LPM with Community Edition](#using-lpm-with-community-edition) section below for detailed examples.

## Action Versioning

This action follows [semantic versioning](https://semver.org/):

- **Major version tags** (e.g., `@v1`): Automatically updated to the latest compatible release
  - Recommended for most users to receive non-breaking updates automatically
- **Specific version tags** (e.g., `@v1.0.0`): Pin to an exact release
  - Use when you need reproducible builds

### Version Updates

- **v2.0.x** → Patch releases: Bug fixes only (backward compatible)
- **v2.x.0** → Minor releases: New features (backward compatible)
- **v3.0.0** → Major releases: Breaking changes

### Recommended Usage

```yaml
# Recommended: Use major version tag for automatic non-breaking updates
- uses: liquibase/setup-liquibase@v2

# Alternative: Pin to specific version for reproducibility
- uses: liquibase/setup-liquibase@v2.0.0
```

## Platform Support

- Linux (ubuntu-latest, ubuntu-20.04, ubuntu-22.04)
- Windows (windows-latest, windows-2019, windows-2022)
- macOS (macos-latest, macos-11, macos-12, macos-13)

The action automatically detects the platform and uses the appropriate archive format (`.zip` for Windows, `.tar.gz` for Linux/macOS).

## Self-Hosted Runner Requirements

**Self-hosted runners require Java 8+ to be installed** since Liquibase is a Java application. GitHub-hosted runners have Java pre-installed, but self-hosted runners may not.

Add this step before setup-liquibase on self-hosted runners:

```yaml
jobs:
  liquibase-job:
    runs-on: [self-hosted, linux, x64]  # or your self-hosted runner labels
    steps:
    - uses: actions/checkout@v4
    
    # Required for self-hosted runners
    - uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - uses: liquibase/setup-liquibase@v2
      with:
        version: '4.32.0'
        edition: 'community'
    
    - run: liquibase --version
```

**Note**: GitHub-hosted runners (ubuntu-latest, windows-latest, macos-latest) already have Java installed and do not need the setup-java step.

## Using LPM with Community Edition

The Liquibase Package Manager (LPM) is integrated into Liquibase 5.0+ and is essential for Community edition users to manage database drivers and extensions. LPM is accessible via the `liquibase lpm` command.

### Basic Example

```yaml
steps:
- uses: actions/checkout@v4

- uses: liquibase/setup-liquibase@v2
  with:
    version: '5.0.0'
    edition: 'community'

- name: Install PostgreSQL Driver
  run: liquibase lpm add postgresql --global

- name: Run Database Migration
  run: |
    liquibase update \
      --changelog-file=changelog.xml \
      --url=jdbc:postgresql://localhost:5432/mydb \
      --username=dbuser \
      --password=${{ secrets.DB_PASSWORD }}
```

### Learn More

For complete documentation on using LPM, including:
- Available database drivers and extensions
- Advanced LPM commands and usage
- Configuration and best practices
- Troubleshooting guides

Visit the official **[Liquibase 5.0 Getting Started Guide](https://docs.liquibase.com/secure/get-started-5-0)**

Additional resources:
- [Liquibase Package Manager Repository](https://github.com/liquibase/liquibase-package-manager)
- [Liquibase 5.0 Release Notes](https://github.com/liquibase/liquibase/releases/tag/v5.0.0)

## Secure Edition Support

The action supports both Liquibase Community and Secure editions. The Secure edition can be installed by specifying `edition: 'secure'`. Note that `edition: 'oss'` and `edition: 'pro'` are still supported for backward compatibility.

### Secure License Management

**The setup action installs Secure binaries without validating the license.** License validation occurs when you run Secure-specific commands. You can provide your license key using several methods:

#### Option 1: GitHub Secrets (Simple)
```yaml
jobs:
  secure-operations:
    runs-on: ubuntu-latest
    env:
      LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
    steps:
    - uses: liquibase/setup-liquibase@v2
      with:
        version: '4.32.0'
        edition: 'secure'
    - run: liquibase update --changelog-file=changelog.xml
    - run: liquibase checks run --changelog-file=changelog.xml
```

#### Option 2: AWS Secrets Manager (Enterprise)

> **Liquibase 5.0+**: AWS extensions are included by default in the Secure edition. For versions prior to 5.0, manual extension installation is required (see Pre-5.0 example below).

**Liquibase 5.0+ Secure Edition** (AWS extensions included):
```yaml
jobs:
  secure-operations:
    runs-on: ubuntu-latest
    steps:
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${{ secrets.AWS_ROLE }}
        aws-region: us-east-1
    - uses: liquibase/setup-liquibase@v2
      with:
        version: '5.0.0'
        edition: 'secure'
    - run: |
        liquibase \
          --license-key=aws-secrets,my-liquibase-secrets,license-key \
          update --changelog-file=changelog.xml
```

**Pre-5.0 Secure Edition** (requires manual extension installation):
```yaml
jobs:
  secure-operations:
    runs-on: ubuntu-latest
    steps:
    - uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${{ secrets.AWS_ROLE }}
        aws-region: us-east-1
    - uses: liquibase/setup-liquibase@v2
      with:
        version: '4.32.0'
        edition: 'secure'
    - name: Install AWS Secrets Manager Extension
      run: |
        wget -O liquibase-aws-secretsmanager.jar https://repo1.maven.org/maven2/org/liquibase/ext/liquibase-secretsmanager-aws/1.0.6/liquibase-secretsmanager-aws-1.0.6.jar
    - run: |
        liquibase \
          --classpath=liquibase-aws-secretsmanager.jar \
          --license-key=aws-secrets,my-liquibase-secrets,license-key \
          update --changelog-file=changelog.xml
```

#### Option 3: Liquibase Properties File
```yaml
    - name: Configure Liquibase Properties
      run: |
        echo "liquibase.licenseKey=aws-secrets,my-liquibase-secrets,license-key" > liquibase.properties
    - run: liquibase update --changelog-file=changelog.xml
```

> **Enterprise Note**: Liquibase 5.0+ Secure edition includes AWS Secrets Manager and other vault integrations by default. For versions prior to 5.0, manual extension installation is required (as shown in the Pre-5.0 example above).

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
    
    - uses: liquibase/setup-liquibase@v2
      with:
        version: '4.32.0'
        edition: 'community'
        
    - name: Run Liquibase Update
      run: |
        liquibase update \
          --changelog-file=db/changelog/db.changelog-master.xml \
          --url=jdbc:h2:mem:test \
          --username=sa \
          --password=
```

### Liquibase Secure with Multiple Commands

```yaml
name: Secure Database Operations
on: [push]

jobs:
  database-operations:
    runs-on: ubuntu-latest
    env:
      LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
    steps:
    - uses: actions/checkout@v4
    
    - uses: liquibase/setup-liquibase@v2
      with:
        version: '4.32.0'
        edition: 'secure'
        
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

### Using Liquibase Flow Files (Secure Edition)

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
    
    - uses: liquibase/setup-liquibase@v2
      with:
        version: '4.32.0'
        edition: 'secure'
        
    - name: Execute Flow from Template
      run: |
        liquibase --search-path=flow-templates/resources,. flow \
          --flow-file=flow-templates/flows/production-deployment.flowfile.yaml \
          --url=jdbc:postgresql://localhost/mydb \
          --username=dbuser \
          --password=${{ secrets.DB_PASSWORD }}
```

#### Example 2: Flow Files from S3

> **Liquibase 5.0+**: AWS S3 extension is included by default in the Secure edition. For versions prior to 5.0, manual extension installation is required (see Pre-5.0 example below).

**Liquibase 5.0+ Secure Edition** (AWS extensions included):
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

    - uses: liquibase/setup-liquibase@v2
      with:
        version: '5.0.0'
        edition: 'secure'

    - name: Execute Flow from S3
      run: |
        liquibase --search-path=s3://my-bucket/liquibase/resources,. flow \
          --flow-file=s3://my-bucket/liquibase/flows/production-deployment.flowfile.yaml \
          --url=jdbc:postgresql://localhost/mydb \
          --username=dbuser \
          --password=${{ secrets.DB_PASSWORD }}

    # Alternative: Using environment variable for search path
    - name: Execute Flow with Environment Variable
      env:
        LIQUIBASE_SEARCH_PATH: s3://my-bucket/liquibase/resources,.
      run: |
        liquibase flow \
          --flow-file=s3://my-bucket/liquibase/flows/staging-deployment.flowfile.yaml \
          --url=jdbc:postgresql://localhost/mydb \
          --username=dbuser \
          --password=${{ secrets.DB_PASSWORD }}
```

**Pre-5.0 Secure Edition** (requires manual extension installation):

**Note**: For Liquibase versions prior to 5.0, S3 integration requires the `liquibase-aws-extension` JAR file to be available in Liquibase's classpath. Download the extension from [Maven Central](https://mvnrepository.com/artifact/org.liquibase.ext/liquibase-aws-extension) and include it using the `--classpath` parameter.

```yaml
name: Database Deployment with S3 Flow (Pre-5.0)
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

    - uses: liquibase/setup-liquibase@v2
      with:
        version: '4.32.0'
        edition: 'secure'

    - name: Download AWS Extension
      run: |
        wget -O liquibase-aws-extension.jar https://repo1.maven.org/maven2/org/liquibase/ext/liquibase-aws-extension/1.0.1/liquibase-aws-extension-1.0.1.jar

    - name: Execute Flow from S3
      run: |
        liquibase --classpath=liquibase-aws-extension.jar --search-path=s3://my-bucket/liquibase/resources,. flow \
          --flow-file=s3://my-bucket/liquibase/flows/production-deployment.flowfile.yaml \
          --url=jdbc:postgresql://localhost/mydb \
          --username=dbuser \
          --password=${{ secrets.DB_PASSWORD }}

    # Alternative: Using environment variable for search path
    - name: Execute Flow with Environment Variable
      env:
        LIQUIBASE_SEARCH_PATH: s3://my-bucket/liquibase/resources,.
      run: |
        liquibase --classpath=liquibase-aws-extension.jar flow \
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
    
    - uses: liquibase/setup-liquibase@v2
      with:
        version: ${{ matrix.liquibase-version }}
        edition: 'community'
        
    - name: Test Migration
      run: |
        liquibase update --changelog-file=changelog.xml --url=jdbc:h2:mem:test
        liquibase rollback-count 1 --changelog-file=changelog.xml --url=jdbc:h2:mem:test
```

## Security Considerations

- Store sensitive information like license keys in GitHub Secrets
- Use `LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}` in the environment
- Never commit license keys directly to your repository

## Troubleshooting

### Common Issues

#### "The process '/tmp/liquibase-extract-xxx/liquibase' failed with exit code 1"

This error typically occurs on self-hosted runners that don't have Java installed. Liquibase requires Java 8+ to run.

**Solution**: Add a setup-java step before setup-liquibase (see [Self-Hosted Runner Requirements](#self-hosted-runner-requirements) above).

#### "Cannot find java in your path"

This error means Java is not installed or not available in the PATH environment variable.

**Solution**: 
- For GitHub-hosted runners: This shouldn't happen as Java is pre-installed
- For self-hosted runners: Install Java or use the setup-java action as shown above


## Enhanced Logging & Path Handling

The action provides comprehensive logging and automatic path transformation for GitHub Actions compatibility:

### What You'll See
```
🚀 Setting up Liquibase COMMUNITY 4.32.0
📥 Downloading from: https://github.com/liquibase/liquibase/releases/...
📦 Extracting Liquibase archive...
📦 Installing Liquibase to temporary directory...
✅ Installation completed successfully
🔧 Added Liquibase to system PATH

🎯 Liquibase configuration:
 Edition: COMMUNITY
 Version: 4.32.0
 Install Path: /tmp/liquibase-extract-abc123
 Execution Context: /actions-runner/_work/your-repo/your-repo

💡 Migration from liquibase-github-actions:
   • Liquibase installs to: temporary directory (not /liquibase/)
   • Liquibase executes from: your-repo/your-repo/
   • Use relative paths: --changelog-file=changelog.xml
   • Absolute paths are auto-transformed for security
```

### Path Transformation
When you use absolute paths in environment variables (e.g., `LIQUIBASE_LOG_FILE=/liquibase/logs/file.log`), the action automatically transforms them to workspace-relative paths for GitHub Actions compatibility:

```
🔄 Path Transformation (Security & Compatibility):
   📝 LIQUIBASE_LOG_FILE: '/liquibase/logs/file.log' → './liquibase/logs/file.log'
💡 Tip: Use relative paths (e.g., "logs/file.log") to avoid transformation
```

### Migration Guidance
The action provides specific guidance for users migrating from Docker workflows or the legacy `liquibase-github-actions` organization, helping you understand the execution context and path differences.

For comprehensive documentation, see [docs/PATH_HANDLING.md](docs/PATH_HANDLING.md).

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
- uses: liquibase/setup-liquibase@v2
  with:
    version: '4.32.0'
    edition: 'community'
- run: liquibase update \
    --changelog-file=changelog.xml \
    --url=jdbc:h2:mem:test \
    --username=sa \
    --password=
```

Note: The legacy actions (like `liquibase-github-actions/update`) are specialized actions for specific Liquibase commands. Our `setup-liquibase` action provides more flexibility by installing Liquibase and allowing you to run any Liquibase command directly.

## Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.