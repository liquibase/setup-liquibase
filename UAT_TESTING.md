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
        cache: true
    
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
    version: ['4.32.0', '4.33.0']
    cache: [true, false]
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
    cache: true
  env:
    LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
```

### 2. Platform-Specific Tests

#### Ubuntu Testing
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, ubuntu-20.04, ubuntu-22.04]
runs-on: ${{ matrix.os }}
```

#### Windows Testing
```yaml
strategy:
  matrix:
    os: [windows-latest, windows-2019, windows-2022]
runs-on: ${{ matrix.os }}
```

#### macOS Testing
```yaml
strategy:
  matrix:
    os: [macos-latest, macos-11, macos-12, macos-13]
runs-on: ${{ matrix.os }}
```

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

#### Missing License Test
```yaml
- name: Test Pro Without License (Should Fail)
  uses: liquibase/setup-liquibase@v1-beta
  continue-on-error: true
  id: pro-no-license
  with:
    version: '4.32.0'
    edition: 'pro'

- name: Verify Failure
  run: |
    if [ "${{ steps.pro-no-license.outcome }}" == "success" ]; then
      echo "ERROR: Pro without license should have failed!"
      exit 1
    fi
```

### 5. Performance Tests

#### Caching Performance
```yaml
- name: First Install (No Cache)
  uses: liquibase/setup-liquibase@v1-beta
  with:
    version: '4.32.0'
    edition: 'oss'
    cache: true

- name: Second Install (With Cache)
  uses: liquibase/setup-liquibase@v1-beta
  with:
    version: '4.32.0'
    edition: 'oss'
    cache: true
```

## Test Checklist

### Basic Functionality ✅
- [ ] OSS edition installs successfully
- [ ] Pro edition installs with valid license
- [ ] Action outputs are set correctly (liquibase-version, liquibase-path)
- [ ] Liquibase binary is added to PATH
- [ ] `liquibase --version` command works

### Platform Compatibility ✅
- [ ] Works on Ubuntu (latest, 20.04, 22.04)
- [ ] Works on Windows (latest, 2019, 2022)
- [ ] Works on macOS (latest, 11, 12, 13)

### Version Support ✅
- [ ] Version 4.32.0 installs correctly
- [ ] Version 4.33.0 installs correctly
- [ ] Minimum version validation works

### Caching ✅
- [ ] Caching improves subsequent install performance
- [ ] Cache works across different workflow runs
- [ ] Cache is specific to version and edition

### Error Handling ✅
- [ ] Invalid versions are rejected
- [ ] Pro edition without license fails appropriately
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

## Reporting Issues

When reporting issues during UAT, please include:

1. **Platform Information**: OS, runner version
2. **Action Configuration**: version, edition, cache setting
3. **Error Details**: Full error message and logs
4. **Expected vs Actual Behavior**
5. **Reproducible Test Case**: Minimal workflow that demonstrates the issue

### Issue Template
```
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
```

## Success Criteria

The v1-beta release is ready for v1.0.0 promotion when:

- [ ] All basic functionality tests pass
- [ ] All platform compatibility tests pass
- [ ] No critical bugs are found
- [ ] Performance is acceptable (< 2 minutes for fresh install, < 30 seconds for cached)
- [ ] Error handling works as expected
- [ ] Integration tests with real databases work
- [ ] Documentation is accurate and complete

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