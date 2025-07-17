/**
 * Debug Transaction List Issue
 * Tests the transaction list endpoint specifically
 */

const BASE_URL = 'http://localhost:8787';
const CREDENTIALS = {
  email: 'ntwaribrian262@gmail.com',
  password: 'ntwari7878'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(url, options = {}) {
  try {
    log(`🌐 Making request to: ${url}`, colors.cyan);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      log(`⚠️ Failed to parse JSON response: ${parseError.message}`, colors.yellow);
      data = { error: 'Invalid JSON response' };
    }
    
    log(`📊 Status: ${response.status}`, response.ok ? colors.green : colors.red);
    log(`📄 Raw Response:`, colors.magenta);
    console.log(JSON.stringify(data, null, 2));
    
    return {
      success: response.ok,
      status: response.status,
      data,
      response
    };
  } catch (error) {
    log(`❌ Request failed: ${error.message}`, colors.red);
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
}

async function authenticate() {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('🔐 AUTHENTICATING', colors.bright + colors.yellow);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(CREDENTIALS)
  });
  
  if (result.success && result.data.success && result.data.data.tokens && result.data.data.tokens.accessToken) {
    log('✅ Authentication successful!', colors.green);
    return result.data.data.tokens.accessToken;
  } else {
    log('❌ Authentication failed', colors.red);
    return null;
  }
}

async function testTransactionsList(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📋 TESTING TRANSACTION LIST (BASIC)', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${BASE_URL}/api/transactions?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return result;
}

async function testTransactionsListWithoutFilters(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📋 TESTING TRANSACTION LIST (NO FILTERS)', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${BASE_URL}/api/transactions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return result;
}

async function testSalesForComparison(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📊 TESTING SALES DATA FOR COMPARISON', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${BASE_URL}/api/sales?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  return result;
}

async function runDebugTests() {
  log('🔍 DEBUGGING TRANSACTION LIST ISSUE', colors.bright + colors.red);
  log(`🎯 Target: ${BASE_URL}`, colors.cyan);
  log(`⏰ Started at: ${new Date().toLocaleString()}`, colors.magenta);
  
  try {
    // Authenticate
    const token = await authenticate();
    if (!token) {
      log('\n❌ Authentication failed. Cannot proceed.', colors.red);
      return;
    }
    
    // Test 1: Sales data (should work)
    await testSalesForComparison(token);
    
    // Test 2: Transaction list with basic params
    await testTransactionsList(token);
    
    // Test 3: Transaction list without any params
    await testTransactionsListWithoutFilters(token);
    
    log(`\n${'='.repeat(60)}`, colors.bright + colors.green);
    log('🔍 DEBUG TESTS COMPLETED', colors.bright + colors.green);
    log(`${'='.repeat(60)}`, colors.bright + colors.green);
    
    log('\n💡 Analysis:', colors.cyan);
    log('   • Compare sales vs transactions response structure', colors.reset);
    log('   • Check for SQL query errors in backend logs', colors.reset);
    log('   • Verify the data transformation logic', colors.reset);
    
  } catch (error) {
    log(`\n❌ Debug tests failed: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run the debug tests
runDebugTests().catch(console.error);
