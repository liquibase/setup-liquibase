# Path Handling in setup-liquibase Action

This document explains how paths work in the setup-liquibase GitHub Action, addressing common questions from users transitioning from Docker-based workflows.

## Executive Summary

- **Liquibase Installation**: Installed in a temporary temporary directory location and added to PATH
- **Execution Context**: Liquibase runs from your checked-out repository's root directory
- **Path Handling**: Absolute paths are automatically transformed to workspace-relative paths for security
- **Transparency**: All path transformations are logged for user awareness

## Installation vs Execution Context

### Where Liquibase Gets Installed
```
# Ubuntu/macOS Example
/opt/hostedtoolcache/liquibase/4.32.0/x64/

# Windows Example  
C:\hostedtoolcache\windows\liquibase\4.32.0\x64\
```

### Where Liquibase Executes From
```
# Your repository is checked out to:
/actions-runner/_work/your-repo/your-repo/

# Liquibase runs from this directory, so relative paths work as expected:
liquibase update --changelog-file=changelog.xml  # ✅ Works
liquibase update --changelog-file=./db/changelog.xml  # ✅ Works
```

## Path Transformation (Security Feature)

### The Problem
When users specify absolute paths like `/liquibase/changelog/file.log`, Liquibase tries to create directories in system locations where GitHub Actions runners don't have write permissions.

### The Solution
The action automatically transforms absolute paths to workspace-relative paths:

```yaml
# User specifies:
env:
  LIQUIBASE_LOG_FILE: /liquibase/changelog/liquibase.log

# Action transforms to:
# LIQUIBASE_LOG_FILE: ./liquibase/changelog/liquibase.log
```

### Logging Transparency
When path transformation occurs, you'll see clear logging:
```
🔄 Path Transformation (Security & Compatibility):
   Absolute paths have been converted to workspace-relative paths
   This ensures compatibility with GitHub Actions runners and prevents permission issues

   📝 LIQUIBASE_LOG_FILE: '/liquibase/changelog/liquibase.log' → './liquibase/changelog/liquibase.log'

💡 Tip: Use relative paths (e.g., "logs/file.log") to avoid transformation
```

## Docker vs GitHub Actions Comparison

| Aspect | Docker | GitHub Actions setup-liquibase |
|--------|---------|--------------------------------|
| **Liquibase Location** | `/liquibase/` (in container) | Tool cache (varies by runner) |
| **Execution Context** | Container root or mounted dir | Repository root directory |
| **File Permissions** | Container filesystem | Runner workspace only |
| **Path `/liquibase/file`** | Works (container path) | Transformed to `./liquibase/file` |
| **Relative Paths** | Work from context | Work from repo root |
| **Custom JARs** | Mount to `/liquibase/lib/` | Download to workspace, use CLASSPATH |

## Common Migration Patterns

### Changelog Files
```yaml
# Docker approach
docker run -v $(pwd):/liquibase/changelog liquibase/liquibase:4.32.0 \
  update --changelog-file=/liquibase/changelog/changelog.xml

# GitHub Actions approach  
- uses: liquibase/setup-liquibase@v1
- run: liquibase update --changelog-file=changelog.xml
```

### Custom JARs
```yaml
# Docker approach (mount)
docker run -v /path/to/driver.jar:/liquibase/lib/driver.jar

# GitHub Actions approach (download + classpath)
- name: Download Custom Driver
  run: wget https://example.com/driver.jar -O lib/driver.jar
- uses: liquibase/setup-liquibase@v1
  env:
    LIQUIBASE_CLASSPATH: lib/driver.jar
```

### Log Files
```yaml
# Docker approach
docker run -e LIQUIBASE_LOG_FILE=/liquibase/logs/app.log

# GitHub Actions approach (automatic transformation)
- uses: liquibase/setup-liquibase@v1
  env:
    LIQUIBASE_LOG_FILE: /liquibase/logs/app.log  # Becomes ./liquibase/logs/app.log
```

## Best Practices

### 1. Use Relative Paths When Possible
```yaml
# Recommended ✅
env:
  LIQUIBASE_LOG_FILE: logs/liquibase.log
  
# Works but gets transformed ⚠️  
env:
  LIQUIBASE_LOG_FILE: /liquibase/logs/liquibase.log
```

### 2. Understand Your Working Directory
```yaml
- uses: actions/checkout@v4
- uses: liquibase/setup-liquibase@v1
- run: |
    pwd  # Shows: /actions-runner/_work/your-repo/your-repo
    ls   # Shows your repository files
    liquibase update --changelog-file=changelog.xml  # Works!
```

### 3. Persist Important Files
```yaml
# Files are lost when runner terminates - save important outputs
- name: Upload Reports
  uses: actions/upload-artifact@v4
  with:
    name: liquibase-reports
    path: reports/
```

### 4. Environment Variable Strategy
```yaml
# Set at job level for all steps
jobs:
  database:
    env:
      LIQUIBASE_LICENSE_KEY: ${{ secrets.LIQUIBASE_LICENSE_KEY }}
      LIQUIBASE_LOG_FILE: logs/liquibase.log
    steps:
      - uses: liquibase/setup-liquibase@v1
      - run: liquibase update --changelog-file=changelog.xml
```

## Troubleshooting

### Problem: "Permission denied" writing to `/liquibase/`
**Solution**: This is expected. Use relative paths or let the action transform absolute paths.

### Problem: "Cannot find changelog file"
**Solution**: Ensure you understand the execution context (repository root) and use paths relative to that.

### Problem: "Files disappear after job"
**Solution**: GitHub Actions runners are ephemeral. Use `actions/upload-artifact` to persist files.

### Problem: Path transformation unexpected
**Solution**: Check the action logs for transformation messages. Consider using relative paths for more predictable behavior.

## Technical Details

### Path Transformation Algorithm
1. Detect absolute paths in environment variables (starting with `/`)
2. Convert to workspace-relative paths (prepend `./`)
3. Log the transformation for user awareness
4. Create necessary parent directories
5. Set the transformed path in the environment

### Supported Environment Variables
The following environment variables undergo path transformation:
- `LIQUIBASE_LOG_FILE`
- `LIQUIBASE_OUTPUTFILE` 
- Any variable containing absolute paths to files/directories

### Security Rationale
Path transformation prevents:
- Writing to system directories
- Permission denied errors
- Security violations in runner environments
- Conflicts with other jobs on shared runners

---

*For more examples and advanced usage, see the `/examples` directory in this repository.*