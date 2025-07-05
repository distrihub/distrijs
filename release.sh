#!/bin/bash
set -e

# 1. Bump version in all packages
pnpm -r version $1 --no-git-tag-version

# 2. Get new version from core package
NEW_VERSION=$(node -p "require('./packages/core/package.json').version")

# 3. Update workspace dependency in react package
cd packages/react
pnpm pkg set dependencies.@distri/core=$NEW_VERSION
cd ../..

# 4. Build packages
pnpm build

# 5. Commit, tag, and push
git add .
git commit -m "chore: release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
git push origin main --follow-tags

echo "Release v$NEW_VERSION committed and pushed!"