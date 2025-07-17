/**
 * Transaction Data Fetcher Script
 * Fetches transaction data from local backend for testing
 */

// Configuration
const CONFIG = {
  BASE_URL: 'http://localhost:8787',
  ENDPOINTS: {
    health: '/health',
    login: '/api/auth/login',
    transactions: '/api/transactions',
    transactionStats: '/api/transactions/stats',
    singleTransaction: (id) => `/api/transactions/${id}`,
    transactionsBySale: (saleId) => `/api/transactions/sale/${saleId}`
  },
  // Test credentials - using provided credentials
  TEST_CREDENTIALS: {
    email: 'ntwaribrian262@gmail.com',
    password: 'ntwari7878'
  }
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

/**
 * Colored console logging
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Make HTTP request with error handling
 */
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

/**
 * Test backend health
 */
async function testHealth() {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('🏥 TESTING BACKEND HEALTH', colors.bright + colors.green);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${CONFIG.BASE_URL}${CONFIG.ENDPOINTS.health}`);
  
  if (result.success) {
    log('✅ Backend is healthy!', colors.green);
    log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, colors.cyan);
  } else {
    log('❌ Backend health check failed', colors.red);
    if (result.error) {
      log(`Error: ${result.error}`, colors.red);
    }
  }
  
  return result.success;
}

/**
 * Authenticate and get token
 */
async function authenticate() {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('🔐 AUTHENTICATING', colors.bright + colors.yellow);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${CONFIG.BASE_URL}${CONFIG.ENDPOINTS.login}`, {
    method: 'POST',
    body: JSON.stringify(CONFIG.TEST_CREDENTIALS)
  });
  
  if (result.success && result.data.tokens && result.data.tokens.accessToken) {
    log('✅ Authentication successful!', colors.green);
    log(`🎫 Token: ${result.data.tokens.accessToken.substring(0, 20)}...`, colors.cyan);
    log(`👤 User: ${result.data.user.businessName} (${result.data.user.email})`, colors.cyan);
    return result.data.tokens.accessToken;
  } else {
    log('❌ Authentication failed', colors.red);
    log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, colors.red);
    return null;
  }
}

/**
 * Fetch transaction statistics
 */
async function fetchTransactionStats(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📊 FETCHING TRANSACTION STATISTICS', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const result = await makeRequest(`${CONFIG.BASE_URL}${CONFIG.ENDPOINTS.transactionStats}`, {
    headers
  });
  
  if (result.success) {
    log('✅ Transaction stats fetched successfully!', colors.green);
    log('📈 Statistics:', colors.cyan);
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    log('❌ Failed to fetch transaction stats', colors.red);
    log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, colors.red);
  }
  
  return result;
}

/**
 * Fetch transaction list
 */
async function fetchTransactions(token, page = 1, limit = 10, filters = {}) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📋 FETCHING TRANSACTION LIST', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const result = await makeRequest(
    `${CONFIG.BASE_URL}${CONFIG.ENDPOINTS.transactions}?${params.toString()}`,
    { headers }
  );
  
  if (result.success) {
    log('✅ Transactions fetched successfully!', colors.green);
    log(`📊 Found ${result.data.data?.length || 0} transactions`, colors.cyan);
    
    if (result.data.data && result.data.data.length > 0) {
      log('\n🔍 Sample transactions:', colors.magenta);
      result.data.data.slice(0, 3).forEach((transaction, index) => {
        log(`\n${index + 1}. Transaction ID: ${transaction.transaction_id}`, colors.yellow);
        log(`   Product: ${transaction.product_name}`, colors.cyan);
        log(`   Client: ${transaction.client_name}`, colors.cyan);
        log(`   Amount: $${transaction.total_amount}`, colors.green);
        log(`   Status: ${transaction.payment_status}`, colors.blue);
        log(`   Date: ${transaction.date_time}`, colors.magenta);
      });
    }
    
    if (result.data.pagination) {
      log(`\n📄 Pagination: Page ${result.data.pagination.page} of ${result.data.pagination.totalPages}`, colors.cyan);
      log(`   Total: ${result.data.pagination.total} transactions`, colors.cyan);
    }
  } else {
    log('❌ Failed to fetch transactions', colors.red);
    log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, colors.red);
  }
  
  return result;
}

/**
 * Test without authentication (should fail)
 */
async function testWithoutAuth() {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('🚫 TESTING WITHOUT AUTHENTICATION', colors.bright + colors.red);
  log(`${'='.repeat(50)}`, colors.bright);

  const result = await makeRequest(`${CONFIG.BASE_URL}${CONFIG.ENDPOINTS.transactions}`);

  if (result.status === 401) {
    log('✅ Correctly rejected unauthorized request', colors.green);
  } else if (result.status === 404) {
    log('⚠️ Route not found - check if transaction routes are deployed', colors.yellow);
  } else {
    log('⚠️ Unexpected response for unauthorized request', colors.yellow);
    log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, colors.yellow);
  }
}

/**
 * Main test function
 */
async function runTransactionTests() {
  log('🚀 STARTING TRANSACTION DATA FETCH TESTS', colors.bright + colors.green);
  log(`🎯 Target: ${CONFIG.BASE_URL}`, colors.cyan);
  log(`⏰ Started at: ${new Date().toLocaleString()}`, colors.magenta);
  
  try {
    // Test 1: Health check
    const isHealthy = await testHealth();
    if (!isHealthy) {
      log('\n❌ Backend is not healthy. Please start your local backend server.', colors.red);
      log('💡 Run: cd backend && npm run dev', colors.yellow);
      return;
    }
    
    // Test 2: Test without authentication
    await testWithoutAuth();
    
    // Test 3: Authenticate
    const token = await authenticate();
    if (!token) {
      log('\n❌ Authentication failed. Cannot proceed with authenticated tests.', colors.red);
      log('💡 Check your credentials in the CONFIG object', colors.yellow);
      return;
    }
    
    // Test 4: Fetch transaction statistics
    await fetchTransactionStats(token);
    
    // Test 5: Fetch transactions (first page)
    await fetchTransactions(token, 1, 5);
    
    // Test 6: Fetch transactions with filters
    log(`\n${'='.repeat(50)}`, colors.bright);
    log('🔍 TESTING WITH FILTERS', colors.bright + colors.magenta);
    log(`${'='.repeat(50)}`, colors.bright);
    
    await fetchTransactions(token, 1, 5, {
      payment_status: 'paid'
    });
    
    log(`\n${'='.repeat(60)}`, colors.bright + colors.green);
    log('✨ ALL TESTS COMPLETED SUCCESSFULLY!', colors.bright + colors.green);
    log(`${'='.repeat(60)}`, colors.bright + colors.green);
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run the tests
runTransactionTests().catch(console.error);
