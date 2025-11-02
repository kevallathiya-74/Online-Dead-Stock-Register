#!/usr/bin/env node

/**
 * Pre-Deployment Verification Script
 * Run this before deploying to catch common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-Deployment Verification\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Verify backend package.json
console.log('📦 Checking backend package.json...');
const backendPkgPath = path.join(__dirname, 'backend', 'package.json');
if (fs.existsSync(backendPkgPath)) {
  const backendPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf8'));
  if (backendPkg.scripts && backendPkg.scripts.start) {
    console.log('  ✅ Backend start script found');
  } else {
    console.log('  ❌ Backend start script missing!');
    hasErrors = true;
  }
  if (backendPkg.engines && backendPkg.engines.node) {
    console.log(`  ✅ Node version specified: ${backendPkg.engines.node}`);
  } else {
    console.log('  ⚠️  Node version not specified in engines');
    hasWarnings = true;
  }
} else {
  console.log('  ❌ backend/package.json not found!');
  hasErrors = true;
}

// Check 2: Verify frontend package.json
console.log('\n📦 Checking frontend package.json...');
const frontendPkgPath = path.join(__dirname, 'package.json');
if (fs.existsSync(frontendPkgPath)) {
  const frontendPkg = JSON.parse(fs.readFileSync(frontendPkgPath, 'utf8'));
  if (frontendPkg.scripts && frontendPkg.scripts.build) {
    console.log('  ✅ Frontend build script found');
  } else {
    console.log('  ❌ Frontend build script missing!');
    hasErrors = true;
  }
} else {
  console.log('  ❌ package.json not found!');
  hasErrors = true;
}

// Check 3: Verify configuration files
console.log('\n📝 Checking configuration files...');
const configs = [
  { file: 'vercel.json', label: 'Vercel config' },
  { file: 'backend/render.yaml', label: 'Render config' },
  { file: '.env.production.example', label: 'Production env example' }
];

configs.forEach(({ file, label }) => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`  ✅ ${label} found`);
  } else {
    console.log(`  ⚠️  ${label} missing`);
    hasWarnings = true;
  }
});

// Check 4: Verify environment examples exist
console.log('\n🔐 Checking environment files...');
const envFiles = [
  '.env.example',
  'backend/.env.example'
];

envFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`  ✅ ${file} exists`);
  } else {
    console.log(`  ⚠️  ${file} missing`);
    hasWarnings = true;
  }
});

// Check 5: Verify build directory doesn't exist (clean state)
console.log('\n🗂️  Checking build directories...');
const buildDirs = ['build', 'dist'];
buildDirs.forEach(dir => {
  if (fs.existsSync(path.join(__dirname, dir))) {
    console.log(`  ⚠️  ${dir}/ exists (will be rebuilt)`);
  } else {
    console.log(`  ✅ ${dir}/ clean`);
  }
});

// Check 6: Verify important backend files
console.log('\n🔧 Checking backend structure...');
const backendFiles = [
  'backend/server.js',
  'backend/config/db.js',
  'backend/models',
  'backend/routes',
  'backend/controllers'
];

backendFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} found`);
  } else {
    console.log(`  ❌ ${file} missing!`);
    hasErrors = true;
  }
});

// Check 7: Verify frontend structure
console.log('\n🎨 Checking frontend structure...');
const frontendFiles = [
  'src/App.tsx',
  'src/index.tsx',
  'src/config/api.config.ts',
  'index.html',
  'vite.config.ts'
];

frontendFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} found`);
  } else {
    console.log(`  ❌ ${file} missing!`);
    hasErrors = true;
  }
});

// Check 8: Test if build works
console.log('\n🔨 Testing build process...');
console.log('  ℹ️  To test build, run: npm run build');
console.log('  ℹ️  This will verify TypeScript compilation');

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY\n');

if (hasErrors) {
  console.log('❌ ERRORS FOUND - Fix these before deploying!');
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS FOUND - Review before deploying');
} else {
  console.log('✅ ALL CHECKS PASSED - Ready to deploy!');
}

console.log('\n📚 Next Steps:');
console.log('  1. Read DEPLOY.md for quick deployment guide');
console.log('  2. Set up MongoDB Atlas database');
console.log('  3. Deploy backend to Render');
console.log('  4. Deploy frontend to Vercel');
console.log('  5. Update environment variables');
console.log('\n' + '='.repeat(50) + '\n');

process.exit(hasErrors ? 1 : 0);
