# UAT Testing Guide for Setup Liquibase v1-beta

This document provides comprehensive testing instructions for the setup-liquibase GitHub Action beta release.

## Quick Start for Testers

### Basic Test Workflow

Create a test repository or use an existing one, then add this workflow:

```yaml
# .github/workflows/test-setup-liquibase.yml
name: Test Setup Liquibase Beta

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  test-basic:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Liquibase OSS
      uses: liquibase/setup-liquibase@v1-beta
      with:
        version: '4.32.0'
        edition: 'oss'
        cache: 'true'
    
    - name: Verify Installation
      run: |
        liquibase --version
        which liquibase
```

## Comprehensive Test Matrix

### 1. Basic Installation Tests

#### OSS Edition Tests
```yaml
strategy:
  matrix:
    version: ['4.32.0']
    cache: ['true', 'false']  # String format required for YAML 1.2 Core Schema
    os: [ubuntu-latest, windows-latest, macos-latest]

steps:
- uses: liquibase/setup-liquibase@v1-beta
  with:
    version: ${{ matrix.version }}
    edition: 'oss'
    cache: ${{ matrix.cache }}
```

#### Pro Edition Tests
```yaml
steps:
- uses: liquibase/setup-liquibase@v1-beta
  with:
    version: '4.32.0'
    edition: 'pro'
    cache: 'true'  # String format required
  env:
    LIQUIBASE_LICENSE_KEY: ${{ secrets.PRO_LICENSE_KEY }}
```

### 2. Platform-Specific Tests

#### Cross-Platform Testing
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
runs-on: ${{ matrix.os }}
```

> **Note**: We focus on latest OS versions for optimal performance and support. Older versions may work but are not officially tested in CI.

### 3. Integration Tests

#### Database Operations Test
```yaml
- name: Setup Liquibase
  uses: liquibase/setup-liquibase@v1-beta
  with:
    version: '4.32.0'
    edition: 'oss'

- name: Create Test Changelog
  run: |
    cat > changelog.xml << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
                       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                       xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                       http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">
      <changeSet id="1" author="test">
        <createTable tableName="test_table">
          <column name="id" type="int" autoIncrement="true">
            <constraints primaryKey="true"/>
          </column>
          <column name="name" type="varchar(255)"/>
        </createTable>
      </changeSet>
    </databaseChangeLog>
    EOF

- name: Run Liquibase Update
  run: |
    liquibase update \
      --changelog-file=changelog.xml \
      --url=jdbc:h2:mem:test \
      --username=sa \
      --password=

- name: Run Liquibase Status
  run: |
    liquibase status \
      --changelog-file=changelog.xml \
      --url=jdbc:h2:mem:test \
      --username=sa \
      --password=

- name: Run Liquibase Rollback
  run: |
    liquibase rollback-count 1 \
      --changelog-file=changelog.xml \
      --url=jdbc:h2:mem:test \
      --username=sa \
      --password=
```

### 4. Error Handling Tests

#### Invalid Version Test
```yaml
- name: Test Invalid Version (Should Fail)
  uses: liquibase/setup-liquibase@v1-beta
  continue-on-error: true
  id: invalid-version
  with:
    version: 'invalid-version'
    edition: 'oss'

- name: Verify Failure
  run: |
    if [ "${{ steps.invalid-version.outcome }}" == "success" ]; then
      echo "ERROR: Invalid version should have failed!"
      exit 1
    fi
```

#### Pro Edition Installation Test
```yaml
- name: Test Pro Installation (Should Succeed)
  uses: liquibase/setup-liquibase@v1-beta
  id: pro-install
  with:
    version: '4.32.0'
    edition: 'pro'

- name: Verify Installation Success
  run: |
    if [ "${{ steps.pro-install.outcome }}" != "success" ]; then
      echo "ERROR: Pro installation should succeed without license key!"
      exit 1
    fi
    echo "✅ Pro edition installed successfully (license validation at runtime)"
```

### 5. Performance Tests

#### Caching Performance
```yaml
- name: First Install (No Cache)
  uses: liquibase/setup-liquibase@v1-beta
  with:
    version: '4.32.0'
    edition: 'oss'
    cache: 'true'

- name: Second Install (With Cache)
  uses: liquibase/setup-liquibase@v1-beta
  with:
    version: '4.32.0'
    edition: 'oss'
    cache: 'true'
```

### 6. Enhanced Logging & Path Transformation Tests

#### Path Transformation Test
```yaml
- name: Test Path Transformation (Enhanced Logging)
  uses: liquibase/setup-liquibase@v1-beta
  with:
    version: '4.32.0'
    edition: 'oss'
    cache: 'true'
  env:
    # These absolute paths will trigger transformation logging
    LIQUIBASE_LOG_FILE: /liquibase/changelog/test.log
    LIQUIBASE_OUTPUTFILE: /liquibase/reports/output.txt

- name: Verify Path Transformation
  run: |
    echo "Checking transformed paths..."
    echo "LIQUIBASE_LOG_FILE: $LIQUIBASE_LOG_FILE"
    echo "LIQUIBASE_OUTPUTFILE: $LIQUIBASE_OUTPUTFILE"
    
    # Verify paths were transformed to relative
    if [[ "$LIQUIBASE_LOG_FILE" == /liquibase/* ]]; then
      echo "❌ Path transformation failed"
      exit 1
    fi
    echo "✅ Path transformation successful"
    
    # Verify directories were created
    ls -la liquibase/changelog/ liquibase/reports/
```

#### Migration Guidance Test
```yaml
- name: Test Enhanced Logging Output
  uses: liquibase/setup-liquibase@v1-beta
  with:
    version: '4.32.0'
    edition: 'oss'
    cache: 'true'
  # Look for these enhanced logging messages in the action output:
  # 🚀 Setting up Liquibase OSS 4.32.0
  # 🎯 Liquibase configuration:
  # 💡 Migration from liquibase-github-actions:
  # 🔄 Path Transformation (Security & Compatibility):
```

## Test Checklist

### Basic Functionality ✅
- [ ] OSS edition installs successfully
- [ ] Pro edition installs successfully (license validation at runtime)
- [ ] Action outputs are set correctly (liquibase-version, liquibase-path)
- [ ] Liquibase binary is added to PATH
- [ ] `liquibase --version` command works

### Platform Compatibility ✅
- [ ] Works on Ubuntu (latest)
- [ ] Works on Windows (latest)
- [ ] Works on macOS (latest)

### Version Support ✅
- [ ] Version 4.32.0 installs correctly
- [ ] Minimum version validation works (4.32.0+)
- [ ] Invalid versions are properly rejected

### Caching ✅
- [ ] Caching improves subsequent install performance
- [ ] Cache works across different workflow runs
- [ ] Cache is specific to version and edition

### Error Handling ✅
- [ ] Invalid versions are rejected
- [ ] Pro edition installation succeeds without license (separation of concerns)
- [ ] Network failures are handled gracefully
- [ ] Clear error messages are provided

### Integration Testing ✅
- [ ] Liquibase update command works
- [ ] Liquibase status command works
- [ ] Liquibase rollback command works
- [ ] Commands work with H2 database
- [ ] Commands work with PostgreSQL (if available)

### Output Validation ✅
- [ ] `liquibase-version` output contains correct version
- [ ] `liquibase-path` output contains valid path
- [ ] Outputs can be used in subsequent steps

### Enhanced Logging & Path Transformation ✅
- [ ] Installation progress shows clear visual indicators (🚀, 📥, 📦, etc.)
- [ ] Configuration summary displays correctly with edition, version, paths
- [ ] Migration guidance appears for liquibase-github-actions users
- [ ] Path transformation logging shows when absolute paths are converted
- [ ] Transformed paths work correctly (relative to workspace)
- [ ] Directory creation happens automatically for file paths
- [ ] Boolean inputs use string format ('true'/'false') per YAML 1.2 Core Schema

## Reporting Issues

When reporting issues during UAT, please include:

1. **Platform Information**: OS, runner version
2. **Action Configuration**: version, edition, cache setting
3. **Error Details**: Full error message and logs
4. **Expected vs Actual Behavior**
5. **Reproducible Test Case**: Minimal workflow that demonstrates the issue

### Issue Template

Copy and paste this template when reporting UAT issues:

---

## UAT Issue Report

**Platform**: ubuntu-latest / windows-latest / macos-latest  
**Liquibase Version**: 4.32.0  
**Edition**: oss / pro  
**Cache Enabled**: true / false  

**Expected Behavior**:  
[Describe what should happen]

**Actual Behavior**:  
[Describe what actually happened]

**Error Message**:  
```
[Paste error message here]
```

**Test Workflow**:  
```yaml
[Paste minimal workflow that reproduces the issue]
```

**Additional Context**:  
[Any other relevant information]

---

## Success Criteria

The v1-beta release is ready for v1.0.0 promotion when:

- [ ] All basic functionality tests pass
- [ ] All platform compatibility tests pass
- [ ] No critical bugs are found
- [ ] Performance is acceptable (< 3 minutes for fresh install, < 45 seconds for cached)
- [ ] Error handling works as expected
- [ ] Integration tests with real databases work
- [ ] Documentation is accurate and complete

## Security & Quality Assurance

The v1-beta release has undergone security scanning and quality checks:

- ✅ **CodeQL Security Scanning**: Automated security analysis completed
- ✅ **Dependency Updates**: All dependencies updated to latest versions
- ✅ **Vulnerability Scanning**: npm audit completed with no critical issues
- ⚠️ **Third-party Alerts**: One minor alert in bundled source-map-support (false positive)

## Automated Testing

The repository includes automated UAT testing via GitHub Actions:

- **Manual Trigger**: Go to Actions → "UAT Testing" → "Run workflow"
- **Test Scenarios**: Choose from all, basic, platform, integration, or error-handling
- **Comprehensive Coverage**: Tests across all supported platforms and configurations

### External Contributor Notes

For external contributors testing this action:

- ✅ **OSS Edition Tests**: Full access to all OSS functionality testing
- ✅ **Integration Tests**: Database operations with H2 (no license required)
- ✅ **Error Handling Tests**: Complete validation of error scenarios
- ✅ **Performance Tests**: Caching and performance validation
- ⏩ **Pro Edition Tests**: Installation tests run successfully (runtime license validation not tested)

**This is expected behavior** - OSS tests provide comprehensive validation of 95%+ of the action's functionality. See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for detailed development guidance.

## Troubleshooting Common Issues

### Performance Issues
- **Slow installs**: Ensure `cache: true` is set for repeated runs
- **CI timeouts**: Latest OS runners are recommended for optimal performance

### Platform-Specific Issues
- **Windows path issues**: Action handles Windows paths automatically
- **macOS permissions**: No additional setup required, action handles permissions
- **Ubuntu dependency issues**: Action includes all required dependencies

### License Issues
- **Pro edition fails**: Ensure `PRO_LICENSE_KEY` repository secret is set with valid license
- **License validation**: Check that license is valid and not expired
- **External contributors**: Pro edition tests will skip automatically (expected behavior)

### Version Issues
- **Unsupported versions**: Only versions 4.32.0+ are supported
- **Version format**: Use exact version numbers (e.g., '4.32.0', not 'latest')

## Contact

For questions or issues during UAT testing:
- Create an issue in the repository with label `uat-testing`
- Include the UAT issue template above

## Next Steps

After successful UAT completion:
1. Address any found issues
2. Create v1.0.0 release
3. Publish to GitHub Marketplace
4. Update documentation with marketplace availability