# Release Workflow Documentation

This document explains how to use the automated release and publishing workflows for the `@distri/core` and `@distri/react` packages.

## Overview

Two GitHub Actions workflows have been created to handle different release scenarios:

1. **`release.yml`** - Automated versioning and publishing on push to main
2. **`publish.yml`** - Manual publishing with full control over version and tags

## Setup Requirements

### 1. NPM Token Configuration

Before the workflows can publish to npm, you need to set up an npm authentication token:

1. Go to [npmjs.com](https://www.npmjs.com/) and log into your account
2. Click your profile → "Access Tokens" → "Generate New Token"
3. Choose "Automation" token type
4. Copy the generated token
5. In your GitHub repository, go to Settings → Secrets and Variables → Actions
6. Add a new repository secret named `NPM_TOKEN` with your token value

### 2. Package Access

Make sure both packages are configured for public access:
- `@distri/core` - ✅ Already configured with `"access": "public"`
- `@distri/react` - ✅ Already configured with `"access": "public"`

## Workflow 1: Automated Release (`release.yml`)

### Triggers

- **Push to main branch**: Automatically determines version bump and publishes
- **Manual trigger**: Allows you to specify the version bump type

### Automatic Version Determination

When triggered by a push to main, the version bump is determined by commit messages:
- `[major]` in commit message → major version bump (1.0.0 → 2.0.0)
- `[minor]` in commit message → minor version bump (1.0.0 → 1.1.0)
- Default → patch version bump (1.0.0 → 1.0.1)

### Manual Trigger

1. Go to Actions → "Release and Publish"
2. Click "Run workflow"
3. Select the branch (usually main)
4. Choose release type: `patch`, `minor`, or `major`
5. Click "Run workflow"

### What it does

1. ✅ Builds and tests the packages
2. ✅ Automatically bumps version in both packages
3. ✅ Updates the workspace dependency (`@distri/core`) in the react package
4. ✅ Publishes `@distri/core` first, then `@distri/react`
5. ✅ Creates a git tag (e.g., `v1.0.0`)
6. ✅ Commits version changes to the repository
7. ✅ Creates a GitHub release with changelog

## Workflow 2: Manual Publishing (`publish.yml`)

### Triggers

- **Manual only**: Accessible via GitHub Actions interface

### Usage

1. Go to Actions → "Publish Packages"
2. Click "Run workflow"
3. Configure options:
   - **Version**: Specify exact version (e.g., `1.0.0`, `1.0.0-beta.1`)
   - **Tag**: Choose npm tag (`latest`, `beta`, `alpha`, `next`)
   - **Dry run**: Check this to preview without actually publishing
4. Click "Run workflow"

### What it does

1. ✅ Builds and tests the packages
2. ✅ Sets the specified version in both packages
3. ✅ Updates workspace dependencies
4. ✅ Publishes with the specified npm tag
5. ✅ Creates git tag (only for `latest` tag)
6. ✅ Provides detailed summary of what was published

## Publishing Order

Both workflows respect the dependency order:
1. **`@distri/core`** is published first
2. **`@distri/react`** is published second (depends on core)

## Version Synchronization

Both packages are always published with the same version number to maintain consistency. The workspace dependency in the react package is automatically updated to reference the exact version being published.

## Examples

### Example 1: Automatic Release
```bash
# Commit with automatic patch version
git commit -m "fix: resolve stream connection issue"

# Commit with minor version bump
git commit -m "feat: add new chat features [minor]"

# Commit with major version bump
git commit -m "feat: breaking API changes [major]"
```

### Example 2: Beta Release
Use the manual publish workflow:
- Version: `1.0.0-beta.1`
- Tag: `beta`
- Dry run: `false`

Users can then install with:
```bash
npm install @distri/core@beta
npm install @distri/react@beta
```

### Example 3: Testing Before Publishing
Use the manual publish workflow:
- Version: `1.0.0`
- Tag: `latest`
- Dry run: `true`

This will show you exactly what would be published without actually doing it.

## Troubleshooting

### Common Issues

1. **NPM_TOKEN not set**: Ensure the secret is properly configured
2. **Permission denied**: Make sure your npm token has publish permissions
3. **Version already exists**: npm doesn't allow republishing the same version
4. **Dependency issues**: The core package must be published successfully before react

### Checking Package Status

After publishing, verify on npm:
- [@distri/core](https://www.npmjs.com/package/@distri/core)
- [@distri/react](https://www.npmjs.com/package/@distri/react)

## Security Notes

- The workflows use `--access public` to ensure packages are publicly available
- Only repository maintainers can trigger manual workflows
- NPM tokens are securely stored in GitHub Secrets
- All commits are made by the `github-actions[bot]` user

## Rollback

If you need to rollback a release:
1. Use `npm unpublish @distri/core@version` and `npm unpublish @distri/react@version`
2. Delete the git tag: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`
3. Revert the version commit if needed

**Note**: npm unpublish is only available for 72 hours after publishing.