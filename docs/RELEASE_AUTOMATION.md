# 🚀 Release Automation Guide

This document explains how the improved release automation works for the setup-liquibase GitHub Action.

## 🏗️ Workflow Architecture

### 1. 📝 Release Drafter & Publisher Workflow

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
- **Automatic artifact upload** (dist/index.js, dist/index.js.map)
- **Build verification** for GitHub Actions compatibility
- GitHub App token security
- Professional build summaries

### 2. 🏷️ Release Assets Builder Workflow

**Triggers:**
- Release published events

**Purpose:**
- Builds and uploads distribution files when a release is manually published
- Updates CHANGELOG.md with release notes
- **Commits changes to main branch** (no detached HEAD issues)
- Verifies GitHub Actions compatibility

**Smart Release Logic:**
```yaml
# The workflow will:
1. Triggered when someone publishes a release in GitHub UI
2. Build and verify distribution files (CommonJS compatibility)
3. Upload assets (dist/index.js, dist/index.js.map) to the published release
4. Update CHANGELOG.md with categorized commit history
5. Commit updates to main branch
```

**Important Notes:**
- Runs on the commit that the release points to (no detached HEAD)
- Cleaner git operations compared to tag-triggered workflows
- Works perfectly with draft releases created by Release Drafter

### 3. 🏷️ PR Labeler Workflow

**Purpose:**
- Automatically labels PRs based on file changes and branch patterns
- Feeds into release-drafter categorization
- Ensures consistent release note generation

## 📋 Usage Instructions

### Creating a Release

#### Option 1: 🎯 Manual Release (Recommended)

1. **Trigger via GitHub UI:**
   ```
   Actions → Release Drafter & Publisher → Run workflow
   ```

2. **Specify version (optional):**
   - Version: `1.2.3` (without 'v' prefix)
   - Publish: ☑️ (to publish immediately)

3. **The workflow will:**
   - Run multi-platform tests
   - Build and verify distribution files (CommonJS compatibility)
   - Generate dynamic changelog
   - Create/update draft release
   - **Upload distribution artifacts** (dist/index.js, dist/index.js.map)
   - Publish if requested

#### Option 2: 📝 Draft + Publish Release

1. **Create a draft release:**
   - Use the Release Drafter workflow (manual dispatch)
   - OR let it auto-create from merged PRs

2. **Review and publish:**
   ```bash
   # Go to GitHub Releases page
   # Find your draft release
   # Edit release notes if needed
   # Click "Publish release"
   ```

3. **The workflow will:**
   - Build distribution files
   - Upload assets to the published release
   - Update CHANGELOG.md
   - Commit changes to main branch

### 📝 Draft Release Management

**Automatic Draft Creation:**
- Every merged PR to `main`/`master` updates the draft release
- Release notes are automatically categorized
- Draft releases accumulate changes until published

**Manual Draft Publishing:**
1. Go to GitHub Releases
2. Find the draft release
3. Edit and publish manually → **This triggers the Release Assets Builder workflow**
4. OR use the Release Drafter workflow with "Publish" option

## 📁 File Structure

```
.github/
├── workflows/
│   ├── release-drafter.yml      # Main release automation
│   ├── release.yml              # Release assets builder (on publish)
│   └── pr-labeler.yml           # PR auto-labeling
├── release-drafter.yml          # Release drafter config
└── labeler.yml                  # PR labeler config
```

## 🔒 Security Features

- **GitHub App Tokens**: All workflows use secure app tokens instead of PATs
- **Proper Permissions**: Minimal required permissions for each job
- **Token Scoping**: Different permission sets for different operations

## ⚙️ Configuration

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

## ✅ Best Practices

1. **Use Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`
2. **Label PRs Appropriately**: Helps with release categorization
3. **Test Before Release**: The multi-platform testing catches issues early
4. **Review Draft Releases**: Check generated notes before publishing
5. **Use Semantic Versioning**: `major.minor.patch` format

## 🚨 Troubleshooting

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

**Tag Push Failures (Detached HEAD):**
- **Not applicable**: The Release Assets Builder workflow doesn't use tag triggers
- Uses `release: published` event which avoids detached HEAD issues
- All commits go directly to main branch without git conflicts

**Git Push Conflicts:**
- The workflow includes retry mechanisms with automatic rebasing
- If conflicts persist, manually resolve and re-run the workflow

## 🔄 Recommended Release Process

The two workflows work together to provide a complete release automation system:

### 🎯 **Optimal Workflow:**

1. **Development Phase:**
   - Create feature branches and PRs
   - PR Labeler automatically categorizes changes
   - Release Drafter accumulates changes in draft releases

2. **Pre-Release Phase:**
   - Use Release Drafter workflow (manual dispatch) to:
     - Run multi-platform tests
     - Generate dynamic changelog
     - Create/update draft release with artifacts
   
3. **Release Phase:**
   - Review the draft release in GitHub UI
   - Edit release notes if needed
   - **Publish the release** → Triggers Release Assets Builder
   - Assets are uploaded and CHANGELOG.md is updated

### ✅ **Benefits of This Approach:**
- **Quality Control**: Manual review before publishing
- **No Git Conflicts**: Clean release process without detached HEAD issues
- **Complete Automation**: Once published, everything is handled automatically
- **Flexibility**: Can create releases via manual dispatch OR draft + publish

## 🔄 Example Workflow Run

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

4. OR: Publish a draft release
   → Release Assets Builder workflow triggered
   → Builds and uploads distribution files to the published release
   → Updates CHANGELOG.md and commits to main branch
```

This system provides enterprise-grade release automation while maintaining simplicity for developers.
