#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;
if (!version) {
  console.error('package.json missing "version".');
  process.exit(1);
}

const out = join(root, 'release-out');
if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

console.log(`Building @distri/ui v${version}...`);
execSync('pnpm build', { cwd: root, stdio: 'inherit' });

const tarball = `distri-ui-${version}.tar.gz`;
const tarPath = join(out, tarball);
const shaPath = `${tarPath}.sha256`;

console.log(`Packing dist/ into ${tarball}...`);
execSync(`tar -czf "${tarPath}" -C "${join(root, 'dist')}" .`, { stdio: 'inherit' });

let sha;
try {
  sha = execSync(`shasum -a 256 "${tarPath}"`).toString().split(/\s+/)[0];
} catch {
  sha = execSync(`sha256sum "${tarPath}"`).toString().split(/\s+/)[0];
}
writeFileSync(shaPath, sha + '\n');

console.log(`Wrote ${tarPath}`);
console.log(`Wrote ${shaPath}  (${sha})`);
