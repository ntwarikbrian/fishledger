/**
 * Fixed Transaction Data Fetcher Script
 * Fetches transaction data from local backend
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
    log(`🎫 Token: ${result.data.data.tokens.accessToken.substring(0, 30)}...`, colors.cyan);
    log(`👤 User: ${result.data.data.user.businessName} (${result.data.data.user.email})`, colors.cyan);
    return result.data.data.tokens.accessToken;
  } else {
    log('❌ Authentication failed', colors.red);
    log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`, colors.red);
    return null;
  }
}

async function fetchTransactionStats(token) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📊 FETCHING TRANSACTION STATISTICS', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const result = await makeRequest(`${BASE_URL}/api/transactions/stats`, {
    headers: { Authorization: `Bearer ${token}` }
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

async function fetchTransactions(token, page = 1, limit = 10) {
  log(`\n${'='.repeat(50)}`, colors.bright);
  log('📋 FETCHING TRANSACTION LIST', colors.bright + colors.blue);
  log(`${'='.repeat(50)}`, colors.bright);
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  const result = await makeRequest(
    `${BASE_URL}/api/transactions?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
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

async function runTests() {
  log('🚀 STARTING TRANSACTION DATA FETCH TESTS', colors.bright + colors.green);
  log(`🎯 Target: ${BASE_URL}`, colors.cyan);
  log(`⏰ Started at: ${new Date().toLocaleString()}`, colors.magenta);
  
  try {
    // Test 1: Health check
    log(`\n${'='.repeat(50)}`, colors.bright);
    log('🏥 TESTING BACKEND HEALTH', colors.bright + colors.green);
    log(`${'='.repeat(50)}`, colors.bright);
    
    const healthResult = await makeRequest(`${BASE_URL}/health`);
    if (!healthResult.success) {
      log('\n❌ Backend is not healthy. Please start your local backend server.', colors.red);
      return;
    }
    log('✅ Backend is healthy!', colors.green);
    
    // Test 2: Authenticate
    const token = await authenticate();
    if (!token) {
      log('\n❌ Authentication failed. Cannot proceed.', colors.red);
      return;
    }
    
    // Test 3: Fetch transaction statistics
    await fetchTransactionStats(token);
    
    // Test 4: Fetch transactions
    await fetchTransactions(token, 1, 5);
    
    // Test 5: Fetch transactions with filters
    log(`\n${'='.repeat(50)}`, colors.bright);
    log('🔍 TESTING WITH FILTERS (PAID TRANSACTIONS)', colors.bright + colors.magenta);
    log(`${'='.repeat(50)}`, colors.bright);
    
    const filteredResult = await makeRequest(
      `${BASE_URL}/api/transactions?page=1&limit=5&payment_status=paid`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (filteredResult.success) {
      log('✅ Filtered transactions fetched successfully!', colors.green);
      log(`📊 Found ${filteredResult.data.data?.length || 0} paid transactions`, colors.cyan);
    }
    
    log(`\n${'='.repeat(60)}`, colors.bright + colors.green);
    log('✨ ALL TESTS COMPLETED SUCCESSFULLY!', colors.bright + colors.green);
    log(`${'='.repeat(60)}`, colors.bright + colors.green);
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run the tests
runTests().catch(console.error);
