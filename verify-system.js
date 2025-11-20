#!/usr/bin/env node

/**
 * System Verification Script
 * Checks if all components are properly configured and working
 */

const https = require('https');
const http = require('http');

const checks = {
  backend: {
    name: 'Backend Server',
    url: 'http://localhost:5000/api/v1/dashboard/stats',
    method: 'GET',
  },
  frontend: {
    name: 'Frontend Server',
    url: 'https://localhost:3000',
    method: 'GET',
  },
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      // For HTTPS, ignore self-signed certificate errors in development
      rejectUnauthorized: false,
    };

    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runChecks() {
  log('\n🔍 System Verification Starting...\n', 'blue');

  let allPassed = true;

  for (const [key, check] of Object.entries(checks)) {
    try {
      log(`Checking ${check.name}...`, 'yellow');
      const result = await makeRequest(check.url, check.method);
      
      if (result.statusCode < 400) {
        log(`✅ ${check.name}: PASSED (${result.statusCode})`, 'green');
      } else {
        log(`❌ ${check.name}: FAILED (${result.statusCode})`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`❌ ${check.name}: ERROR - ${error.message}`, 'red');
      allPassed = false;
    }
  }

  log('\n📊 Verification Summary\n', 'blue');
  
  if (allPassed) {
    log('✅ All checks passed! System is ready.', 'green');
    log('\nNext Steps:', 'blue');
    log('1. Login at https://localhost:3000', 'yellow');
    log('2. Use credentials from LOGIN_CREDENTIALS.txt', 'yellow');
    log('3. Seed database if empty (see TESTING_GUIDE.md)', 'yellow');
  } else {
    log('❌ Some checks failed. Please ensure:', 'red');
    log('1. Backend is running on port 5000', 'yellow');
    log('2. Frontend is running on port 3000', 'yellow');
    log('3. MongoDB is connected', 'yellow');
  }

  log('');
}

runChecks().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
