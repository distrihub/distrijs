const fs = require('fs');
const path = require('path');

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    fs.readdirSync(source).forEach(file => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      if (fs.lstatSync(sourcePath).isDirectory()) {
        copyFolderRecursiveSync(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
  }
}

function cleanDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('Copying dist folders for git dependency usage...');

// Clean existing directories
cleanDirectory('core');
cleanDirectory('react');

// Copy core package dist to root/core
const coreDistPath = path.join('packages', 'core', 'dist');
if (fs.existsSync(coreDistPath)) {
  copyFolderRecursiveSync(coreDistPath, 'core');
  console.log('✓ Copied core dist to root/core');
} else {
  console.error('❌ Core dist folder not found. Run build first.');
  process.exit(1);
}

// Copy react package dist to root/react
const reactDistPath = path.join('packages', 'react', 'dist');
if (fs.existsSync(reactDistPath)) {
  copyFolderRecursiveSync(reactDistPath, 'react');
  console.log('✓ Copied react dist to root/react');
} else {
  console.error('❌ React dist folder not found. Run build first.');
  process.exit(1);
}

console.log('✅ Build copy complete. Ready for git dependency usage.');