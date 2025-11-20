#!/usr/bin/env node

/**
 * API Integration Test Script
 * Tests all critical endpoints to ensure proper integration
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';
let authToken = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    log('✓ Authentication successful', 'green');
    return true;
  } catch (error) {
    log('✗ Authentication failed: ' + error.message, 'red');
    return false;
  }
}

const tests = [
  {
    name: 'Asset Stats API',
    method: 'GET',
    endpoint: '/assets/stats',
    validate: (data) => {
      return data.success && 
             typeof data.data.totalAssets === 'number' &&
             typeof data.data.activeAssets === 'number' &&
             typeof data.data.totalValue === 'number';
    }
  },
  {
    name: 'Assets List API',
    method: 'GET',
    endpoint: '/assets',
    params: { limit: 10 },
    validate: (data) => {
      return data.success && Array.isArray(data.data || data.data?.data);
    }
  },
  {
    name: 'Dashboard Inventory Overview',
    method: 'GET',
    endpoint: '/dashboard/inventory-overview',
    validate: (data) => {
      return data.success && 
             data.data.stats &&
             Array.isArray(data.data.assetsByLocation);
    }
  },
  {
    name: 'Asset Categories API',
    method: 'GET',
    endpoint: '/assets/categories',
    validate: (data) => {
      return data.success && Array.isArray(data.data);
    }
  },
  {
    name: 'Vendors List API',
    method: 'GET',
    endpoint: '/vendors',
    validate: (data) => {
      return data.success && Array.isArray(data.data || data.data?.data);
    }
  },
  {
    name: 'Dashboard Stats API',
    method: 'GET',
    endpoint: '/dashboard/stats',
    validate: (data) => {
      return data.success && 
             data.data &&
             typeof data.data.totalAssets !== 'undefined';
    }
  },
  {
    name: 'Report Templates API',
    method: 'GET',
    endpoint: '/reports/templates',
    validate: (data) => {
      return data.success && Array.isArray(data.data);
    }
  },
];

async function runTest(test) {
  try {
    const config = {
      method: test.method,
      url: `${API_BASE}${test.endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    if (test.params) {
      config.params = test.params;
    }

    if (test.data) {
      config.data = test.data;
    }

    const response = await axios(config);
    
    if (test.validate(response.data)) {
      log(`✓ ${test.name}`, 'green');
      return { success: true, name: test.name };
    } else {
      log(`✗ ${test.name} - Invalid response format`, 'red');
      console.log('  Response:', JSON.stringify(response.data, null, 2).substring(0, 200));
      return { success: false, name: test.name, error: 'Invalid response format' };
    }
  } catch (error) {
    log(`✗ ${test.name} - ${error.message}`, 'red');
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Data:`, JSON.stringify(error.response.data, null, 2).substring(0, 200));
    }
    return { success: false, name: test.name, error: error.message };
  }
}

async function main() {
  log('\n🧪 API Integration Test Suite\n', 'cyan');
  log('Testing backend endpoints for proper integration...\n', 'blue');

  // Authenticate
  const authSuccess = await getAuthToken();
  if (!authSuccess) {
    log('\n❌ Cannot proceed without authentication\n', 'red');
    process.exit(1);
  }

  log(''); // Blank line

  // Run all tests
  const results = [];
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('Test Summary', 'cyan');
  log('='.repeat(50), 'cyan');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log(`\nTotal Tests: ${results.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed > 0) {
    log('\nFailed Tests:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`  - ${r.name}: ${r.error}`, 'yellow');
    });
  }

  log('');

  if (failed === 0) {
    log('✅ All API endpoints are working correctly!', 'green');
    process.exit(0);
  } else {
    log('❌ Some API endpoints need attention', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
