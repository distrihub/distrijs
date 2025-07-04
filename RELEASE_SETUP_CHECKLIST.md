# Release Setup Checklist

Follow this checklist to set up automated releases for your `@distri/core` and `@distri/react` packages.

## ✅ Pre-requisites

- [ ] You have an npm account with publish permissions
- [ ] You have admin access to the GitHub repository
- [ ] Both packages are ready for publication

## ✅ NPM Setup

1. **Create npm account/organization** (if not already done)
   - [ ] Go to [npmjs.com](https://www.npmjs.com/) and create/log into your account
   - [ ] If using an organization, make sure you have publish permissions

2. **Generate npm token**
   - [ ] Go to npmjs.com → Profile → Access Tokens
   - [ ] Click "Generate New Token"
   - [ ] Choose "Automation" token type
   - [ ] Copy the token (starts with `npm_`)

3. **Configure GitHub Secret**
   - [ ] Go to your GitHub repository
   - [ ] Navigate to Settings → Secrets and Variables → Actions
   - [ ] Click "New repository secret"
   - [ ] Name: `NPM_TOKEN`
   - [ ] Value: Paste your npm token
   - [ ] Click "Add secret"

## ✅ Package Configuration

1. **Verify package.json files**
   - [ ] `packages/core/package.json` has correct name: `@distri/core`
   - [ ] `packages/react/package.json` has correct name: `@distri/react`
   - [ ] Both have the same starting version (currently `0.1.0`)
   - [ ] Both have proper `repository` URLs pointing to your GitHub repo

2. **Check build setup**
   - [ ] Run `pnpm build` locally to ensure it works
   - [ ] Run `pnpm lint` to check for linting issues
   - [ ] Run `pnpm type-check` to verify TypeScript compilation

## ✅ Test the Setup

1. **Test dry run**
   - [ ] Go to Actions → "Publish Packages"
   - [ ] Click "Run workflow"
   - [ ] Set version to `0.1.1-test`
   - [ ] Set tag to `alpha`
   - [ ] Set dry run to `true`
   - [ ] Run and verify it completes without errors

2. **Test actual publish** (optional)
   - [ ] Run the same workflow but with dry run set to `false`
   - [ ] Check that packages appear on npm:
     - [ ] https://www.npmjs.com/package/@distri/core
     - [ ] https://www.npmjs.com/package/@distri/react
   - [ ] Install and test: `npm install @distri/core@alpha @distri/react@alpha`

## ✅ First Real Release

1. **Prepare for release**
   - [ ] Update any documentation
   - [ ] Make sure all tests pass
   - [ ] Review the changelog/recent commits

2. **Release options**
   
   **Option A: Automatic (recommended)**
   - [ ] Make a commit with your changes
   - [ ] Include `[minor]` in commit message if it's a feature release
   - [ ] Push to main branch
   - [ ] GitHub Actions will automatically publish

   **Option B: Manual**
   - [ ] Go to Actions → "Release and Publish"
   - [ ] Choose your release type (patch/minor/major)
   - [ ] Run workflow

3. **Verify release**
   - [ ] Check GitHub releases page for new release
   - [ ] Verify packages on npm have been updated
   - [ ] Test installation: `npm install @distri/core @distri/react`

## 🎉 You're Done!

Your release automation is now set up. From now on, you can:

- **Automatic releases**: Just push to main (version determined by commit messages)
- **Manual releases**: Use the "Release and Publish" action
- **Beta/Alpha releases**: Use the "Publish Packages" action with different tags
- **Dry run testing**: Always test with dry run before actual publishing

## 🔧 Troubleshooting

If something goes wrong:

1. **Check the Actions tab** for detailed error logs
2. **Verify NPM_TOKEN** is set correctly in repository secrets
3. **Check package names** are available on npm
4. **Ensure pnpm workspace** is properly configured
5. **Review the RELEASE_WORKFLOW.md** for detailed documentation

## 📝 Next Steps

- Set up branch protection rules for main branch
- Configure automated tests to run before releases
- Add conventional commit linting for better version determination
- Set up notification webhooks for release events