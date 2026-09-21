const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[build] Cleaning dist directory...');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('[build] Copying frontend assets to dist...');
copyDirRecursive(frontendDir, distDir);

if (fs.existsSync(publicDir)) {
  console.log('[build] Copying public static assets to dist...');
  copyDirRecursive(publicDir, distDir);
}

const distElectronDir = path.join(rootDir, 'dist-electron');
if (!fs.existsSync(distElectronDir)) {
  fs.mkdirSync(distElectronDir, { recursive: true });
}
const electronDir = path.join(rootDir, 'electron');
if (fs.existsSync(path.join(electronDir, 'main.js'))) {
  fs.copyFileSync(path.join(electronDir, 'main.js'), path.join(distElectronDir, 'main.js'));
}
if (fs.existsSync(path.join(electronDir, 'preload.js'))) {
  fs.copyFileSync(path.join(electronDir, 'preload.js'), path.join(distElectronDir, 'preload.js'));
}

console.log('[build] Production dist and electron bundles generated successfully.');
