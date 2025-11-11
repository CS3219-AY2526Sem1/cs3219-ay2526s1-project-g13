#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const FRONTEND_PACKAGE_JSON = path.join(FRONTEND_DIR, 'package.json');
const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-lock-'));

console.log('Generating standalone pnpm-lock.yaml for frontend...');

try {
  const tempPackageJson = path.join(TEMP_DIR, 'package.json');
  fs.copyFileSync(FRONTEND_PACKAGE_JSON, tempPackageJson);

  process.chdir(TEMP_DIR);

  console.log('Installing frontend dependencies...');
  execSync('pnpm install --lockfile-only', {
    stdio: 'inherit',
    env: { ...process.env, CI: 'false' }
  });


  const generatedLockFile = path.join(TEMP_DIR, 'pnpm-lock.yaml');
  const targetLockFile = path.join(FRONTEND_DIR, 'pnpm-lock.yaml');

  if (fs.existsSync(generatedLockFile)) {
    fs.copyFileSync(generatedLockFile, targetLockFile);
    console.log('✓ Successfully generated frontend/pnpm-lock.yaml');
  } else {
    console.error('✗ Error: pnpm-lock.yaml was not generated');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Error generating frontend lock file:', error.message);
  process.exit(1);
} finally {
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch (error) {

  }
}

