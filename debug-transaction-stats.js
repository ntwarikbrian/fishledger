/**
 * Debug Transaction Statistics Issue
 * Specifically tests the transaction stats endpoint
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

    const data = await response.json();
    
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

async function testSalesData(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📊 TESTING SALES DATA (SOURCE OF TRUTH)', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${BASE_URL}/api/sales?limit=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (result.success && result.data.data) {
    log(`✅ Found ${result.data.data.length} sales records`, colors.green);
    
    if (result.data.data.length > 0) {
      log('\n📋 Sales data structure:', colors.cyan);
      const sample = result.data.data[0];
      Object.keys(sample).forEach(key => {
        log(`   ${key}: ${sample[key]}`, colors.reset);
      });
    }
  } else {
    log('❌ Failed to fetch sales data', colors.red);
  }
  
  return result;
}

async function testTransactionStats(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📈 TESTING TRANSACTION STATISTICS', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${BASE_URL}/api/transactions/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (result.success) {
    log('✅ Transaction stats endpoint responded', colors.green);
    
    // Check if data is empty object
    if (result.data.data && typeof result.data.data === 'object') {
      const keys = Object.keys(result.data.data);
      log(`📊 Stats data keys: [${keys.join(', ')}]`, colors.cyan);
      
      if (keys.length === 0) {
        log('❌ Stats data is empty object!', colors.red);
      } else {
        log('✅ Stats data has content', colors.green);
      }
    } else {
      log('❌ No data field in response', colors.red);
    }
  } else {
    log('❌ Transaction stats endpoint failed', colors.red);
  }
  
  return result;
}

async function testTransactionStatsWithDateFilter(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📅 TESTING TRANSACTION STATS WITH DATE FILTER', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  // Use a wide date range to catch all data
  const dateFrom = '2025-01-01T00:00:00Z';
  const dateTo = '2025-12-31T23:59:59Z';
  
  const result = await makeRequest(
    `${BASE_URL}/api/transactions/stats?date_from=${dateFrom}&date_to=${dateTo}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  return result;
}

async function testDirectDatabaseQuery(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('🔍 TESTING DIRECT SALES QUERY', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  // Test if we can get sales data with specific fields needed for stats
  const result = await makeRequest(
    `${BASE_URL}/api/sales?limit=100&fields=total_amount,payment_status,payment_method,date_time`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  if (result.success && result.data.data) {
    log(`✅ Found ${result.data.data.length} sales for stats calculation`, colors.green);
    
    // Manual stats calculation
    const sales = result.data.data;
    const manualStats = {
      total_transactions: sales.length,
      total_amount: sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
      paid_transactions: sales.filter(s => s.payment_status === 'paid').length,
      pending_transactions: sales.filter(s => s.payment_status === 'pending').length,
      partial_transactions: sales.filter(s => s.payment_status === 'partial').length,
    };
    
    log('\n📊 Manual stats calculation:', colors.cyan);
    console.log(JSON.stringify(manualStats, null, 2));
  }
  
  return result;
}

async function runDebugTests() {
  log('🔍 DEBUGGING TRANSACTION STATISTICS ISSUE', colors.bright + colors.red);
  log(`🎯 Target: ${BASE_URL}`, colors.cyan);
  log(`⏰ Started at: ${new Date().toLocaleString()}`, colors.magenta);
  
  try {
    // Authenticate
    const token = await authenticate();
    if (!token) {
      log('\n❌ Authentication failed. Cannot proceed.', colors.red);
      return;
    }
    
    // Test 1: Check sales data (source of truth)
    await testSalesData(token);
    
    // Test 2: Test transaction stats endpoint
    await testTransactionStats(token);
    
    // Test 3: Test with date filters
    await testTransactionStatsWithDateFilter(token);
    
    // Test 4: Manual calculation from sales data
    await testDirectDatabaseQuery(token);
    
    log(`\n${'='.repeat(60)}`, colors.bright + colors.green);
    log('🔍 DEBUG TESTS COMPLETED', colors.bright + colors.green);
    log(`${'='.repeat(60)}`, colors.bright + colors.green);
    
    log('\n💡 Analysis:', colors.cyan);
    log('   • Check if backend logs show any errors', colors.reset);
    log('   • Verify the sales table has the expected fields', colors.reset);
    log('   • Check if the stats handler is querying the right table', colors.reset);
    
  } catch (error) {
    log(`\n❌ Debug tests failed: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run the debug tests
runDebugTests().catch(console.error);
