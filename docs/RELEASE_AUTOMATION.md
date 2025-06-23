# Release Automation Guide

This document explains how the improved release automation works for the setup-liquibase GitHub Action.

## Workflow Architecture

### 1. Release Drafter & Publisher Workflow

**Triggers:**
- Push to `main`/`master` (creates/updates draft releases)
- Pull request events (updates draft releases)
- Manual dispatch (creates actual releases)

**Jobs:**
- **build-and-test**: Multi-platform build matrix (Ubuntu, Windows, macOS)
- **draft-release**: Updates draft releases from PR merges
- **create-release**: Creates/publishes releases (manual dispatch only)

**Key Features:**
- Multi-platform testing for reliability
- Dynamic changelog generation from commit history
- Intelligent draft release management
- GitHub App token security
- Professional build summaries

### 2. Tag-based Release Workflow

**Triggers:**
- Push to tags matching `v*` pattern

**Purpose:**
- Builds and uploads distribution files to existing draft releases
- Publishes draft releases that match the tag
- Handles fallback release creation if no draft exists
- Updates CHANGELOG.md with release notes

**Smart Release Logic:**
```yaml
# The workflow will:
1. Look for existing draft release with the tag
2. If found: Upload assets and publish the draft
3. If already published: Add/update assets
4. If no release exists: Create new release with generated notes
```

### 3. PR Labeler Workflow

**Purpose:**
- Automatically labels PRs based on file changes and branch patterns
- Feeds into release-drafter categorization
- Ensures consistent release note generation

## Usage Instructions

### Creating a Release

#### Option 1: Manual Release (Recommended)

1. **Trigger via GitHub UI:**
   ```
   Actions → Release Drafter & Publisher → Run workflow
   ```

2. **Specify version (optional):**
   - Version: `1.2.3` (without 'v' prefix)
   - Publish: ☑️ (to publish immediately)

3. **The workflow will:**
   - Run multi-platform tests
   - Generate dynamic changelog
   - Create/update draft release
   - Publish if requested

#### Option 2: Tag-based Release

1. **Create and push a tag:**
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

2. **The workflow will:**
   - Build distribution files
   - Find existing draft release for `v1.2.3`
   - Upload assets and publish the release
   - Update CHANGELOG.md

### Draft Release Management

**Automatic Draft Creation:**
- Every merged PR to `main`/`master` updates the draft release
- Release notes are automatically categorized
- Draft releases accumulate changes until published

**Manual Draft Publishing:**
1. Go to GitHub Releases
2. Find the draft release
3. Edit and publish manually, OR
4. Use the Release Drafter workflow with "Publish" option

## File Structure

```
.github/
├── workflows/
│   ├── release-drafter.yml      # Main release automation
│   ├── release.yml              # Tag-triggered builds
│   └── pr-labeler.yml           # PR auto-labeling
├── release-drafter.yml          # Release drafter config
└── labeler.yml                  # PR labeler config
```

## Security Features

- **GitHub App Tokens**: All workflows use secure app tokens instead of PATs
- **Proper Permissions**: Minimal required permissions for each job
- **Token Scoping**: Different permission sets for different operations

## Configuration

### Release Drafter Config (`.github/release-drafter.yml`)

```yaml
# Customize categories, version resolution, and templates
categories:
  - title: '🚀 New Features'
    labels: ['feature', 'enhancement', 'feat']
  - title: '🐛 Bug Fixes'
    labels: ['bug', 'bugfix', 'fix']
  # ... more categories
```

### PR Labeler Config (`.github/labeler.yml`)

```yaml
# Auto-label PRs based on file changes
documentation:
  - '*.md'
  - 'docs/**/*'
feature:
  - 'src/**/*'
  - head-branch: ['^feature', '^feat']
```

## Best Practices

1. **Use Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`
2. **Label PRs Appropriately**: Helps with release categorization
3. **Test Before Release**: The multi-platform testing catches issues early
4. **Review Draft Releases**: Check generated notes before publishing
5. **Use Semantic Versioning**: `major.minor.patch` format

## Troubleshooting

### Common Issues

**Draft Release Not Found:**
- Ensure Release Drafter has run on recent PR merges
- Check that the tag matches the expected format (`v1.2.3`)
- Manually create a draft release if needed

**Build Failures:**
- Check the multi-platform test matrix results
- Ensure all tests pass before attempting release
- Review the build summary for specific error details

**Asset Upload Failures:**
- Verify that `dist/` files are built correctly
- Check GitHub App token permissions
- Ensure the release exists and is accessible

## Example Workflow Run

```
1. Developer merges PR with label "feature"
   → Release Drafter updates draft release with feature note

2. Multiple PRs merged with various labels
   → Draft release accumulates categorized changes

3. Ready to release: Run "Release Drafter & Publisher" workflow
   → Multi-platform tests run
   → Dynamic changelog generated
   → Draft release updated with latest changes
   → Release published (if requested)

4. OR: Push tag v1.2.3
   → Tag-based workflow finds draft release
   → Builds distribution files
   → Uploads assets to existing draft
   → Publishes the release
```

This system provides enterprise-grade release automation while maintaining simplicity for developers.
