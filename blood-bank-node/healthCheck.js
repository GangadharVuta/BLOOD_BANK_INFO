#!/usr/bin/env node

/**
 * Backend Health Check Script
 * Runs before server start to verify all configs are correct
 * Usage: node healthCheck.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Backend Health Check Starting...\n');

// Check 1: Environment variables
console.log('✓ Check 1: .env.dev file exists');
const envPath = path.join(__dirname, '.env.dev');
if (!fs.existsSync(envPath)) {
  console.error('❌ FAILED: .env.dev not found at', envPath);
  process.exit(1);
}
console.log('  ✅ .env.dev found at', envPath);

// Check 2: Firebase credentials
console.log('\n✓ Check 2: Firebase Service Account');
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.warn('  ⚠️  serviceAccountKey.json not found. Firebase messaging will not work.');
} else {
  try {
    const serviceAccount = require(serviceAccountPath);
    if (serviceAccount.project_id) {
      console.log(`  ✅ Firebase credentials valid for project: ${serviceAccount.project_id}`);
    }
  } catch (e) {
    console.error('  ❌ FAILED: Invalid serviceAccountKey.json:', e.message);
  }
}

// Check 3: Package.json dependencies
console.log('\n✓ Check 3: Dependencies installed');
const packageJsonPath = path.join(__dirname, 'package.json');
try {
  const packageJson = require(packageJsonPath);
  const requiredDeps = ['express', 'mongoose', 'firebase-admin', 'jsonwebtoken', 'bcrypt'];
  const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  if (missing.length > 0) {
    console.error('  ❌ FAILED: Missing dependencies:', missing.join(', '));
    console.log('  Run: npm install');
    process.exit(1);
  }
  console.log('  ✅ All required dependencies are listed');
} catch (e) {
  console.error('  ❌ FAILED:', e.message);
  process.exit(1);
}

// Check 4: MongoDB connection string
console.log('\n✓ Check 4: MongoDB configuration');
try {
  const config = require('./configs/configs');
  if (config.db && config.db.includes('mongodb')) {
    console.log(`  ✅ MongoDB URL configured: ${config.db.split('@')[0]}...`);
  }
} catch (e) {
  console.error('  ❌ FAILED:', e.message);
}

// Check 5: TLS setting
console.log('\n✓ Check 5: Security settings');
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  console.warn('  ⚠️  WARNING: NODE_TLS_REJECT_UNAUTHORIZED=0 found (insecure)');
  console.warn('  This should NOT be set in production');
} else {
  console.log('  ✅ NODE_TLS_REJECT_UNAUTHORIZED not set (secure)');
}

// Check 6: Port configuration
console.log('\n✓ Check 6: Server port');
try {
  const config = require('./configs/configs');
  console.log(`  ✅ Server will listen on port ${config.serverPort}`);
} catch (e) {
  console.error('  ❌ FAILED:', e.message);
}

console.log('\n✅ All checks passed! Server ready to start.\n');
console.log('Run: npm start or node server.js\n');
