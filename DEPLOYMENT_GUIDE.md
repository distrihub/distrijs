# Distri.js Deployment Guide

This guide explains how to deploy the Distri.js packages to npm and the demo to GitHub Pages.

## Overview

The project has three main deployment workflows:

1. **Package Publishing**: Deploy `@distri/core` and `@distri/react` packages to npm
2. **Demo Deployment**: Deploy the full-demo as a static site to GitHub Pages
3. **Release Management**: Automated versioning and releases

## GitHub Actions Workflows

### 1. Package Publishing (`publish.yml`)

Manually triggered workflow to publish packages to npm:

```yaml
# Trigger: Manual (workflow_dispatch)
# Purpose: Publish @distri/core and @distri/react to npm
# Secrets needed: NPM_TOKEN
```

**Usage:**
1. Go to GitHub Actions tab
2. Select "Publish Packages" workflow
3. Click "Run workflow"
4. Choose version and tag
5. Enable/disable dry run

### 2. Demo Deployment (`deploy-demo.yml`)

Automatically deploys the demo to GitHub Pages:

```yaml
# Trigger: Push to main, PRs, Manual
# Purpose: Deploy full-demo to GitHub Pages
# No secrets needed (uses GitHub Pages token)
```

**Features:**
- Builds packages first
- Builds demo with proper base path
- Deploys to GitHub Pages
- Accessible at: `https://username.github.io/distrijs/`

### 3. Release Management (`release.yml`)

Automated versioning and publishing:

```yaml
# Trigger: Push to main, Manual
# Purpose: Auto-version and publish packages
# Secrets needed: NPM_TOKEN, GITHUB_TOKEN
```

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Select "GitHub Actions" as source
3. Save settings

### 2. Configure npm Token

1. Create npm token at https://www.npmjs.com/settings/tokens
2. Add as `NPM_TOKEN` secret in GitHub repository
3. Grant publish permissions to packages

### 3. Package Configuration

Both packages are properly configured with:
- Public access (`--access public`)
- Proper versioning
- Cross-package dependencies
- TypeScript declarations

## Demo Features

The deployed demo includes:

### Enhanced UI
- **Environment Selector**: Switch between Development, Staging, and Production
- **Agent Selector**: Choose different AI agents
- **Tab Navigation**: Chat, Agents, Tasks views
- **Responsive Design**: Works on desktop and mobile

### Environment Configuration
```typescript
const ENVIRONMENTS = {
  development: {
    name: 'Development',
    baseUrl: 'http://localhost:8080',
    color: 'bg-green-100 text-green-800'
  },
  staging: {
    name: 'Staging',
    baseUrl: 'https://staging-api.distri.ai',
    color: 'bg-yellow-100 text-yellow-800'
  },
  production: {
    name: 'Production',
    baseUrl: 'https://api.distri.ai',
    color: 'bg-blue-100 text-blue-800'
  }
}
```

## Local Development

### Build Packages
```bash
pnpm build
```

### Run Demo Locally
```bash
cd samples/full-demo
pnpm dev
```

### Build Demo for Production
```bash
cd samples/full-demo
pnpm build
```

## Troubleshooting

### Common Issues

1. **Build Failures**: Ensure packages build successfully first
2. **Pages Not Loading**: Check base path configuration in vite.config.ts
3. **npm Publishing**: Verify NPM_TOKEN has correct permissions
4. **Missing Dependencies**: Run `pnpm install` in workspace root

### Debug Steps

1. Check GitHub Actions logs for detailed error messages
2. Test builds locally before pushing
3. Verify package.json configurations
4. Check npm token permissions

## Package Versions

The packages follow semantic versioning:
- `@distri/core`: Core functionality and types
- `@distri/react`: React hooks and components

Both packages are published together with matching versions.

## Manual Deployment

### Publish Packages Manually
```bash
# Build packages
pnpm build

# Publish core
cd packages/core
npm publish --access public

# Publish react
cd packages/react
npm publish --access public
```

### Deploy Demo Manually
```bash
# Build demo
cd samples/full-demo
pnpm build

# Deploy to GitHub Pages (requires gh CLI)
gh-pages -d dist
```

## Status

- ✅ GitHub Actions workflows configured
- ✅ npm publishing automated
- ✅ Demo deployment automated
- ✅ Environment selector added
- ✅ Responsive design implemented
- ✅ TypeScript support
- ✅ Proper build configuration