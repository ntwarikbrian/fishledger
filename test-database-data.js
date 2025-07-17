/**
 * Comprehensive Database Data Test Script
 * Fetches and displays data from all database tables
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
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data,
      response
    };
  } catch (error) {
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
    log(`👤 User: ${result.data.data.user.businessName} (${result.data.data.user.email})`, colors.cyan);
    return result.data.data.tokens.accessToken;
  } else {
    log('❌ Authentication failed', colors.red);
    return null;
  }
}

async function testEndpoint(endpoint, token, description) {
  log(`\n🔍 Testing: ${description}`, colors.cyan);
  log(`📡 Endpoint: ${endpoint}`, colors.magenta);
  
  const result = await makeRequest(`${BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (result.success) {
    log(`✅ Status: ${result.status}`, colors.green);
    
    // Handle different response structures
    let dataArray = [];
    if (result.data.data && Array.isArray(result.data.data)) {
      dataArray = result.data.data;
    } else if (Array.isArray(result.data)) {
      dataArray = result.data;
    } else if (result.data.data) {
      dataArray = [result.data.data];
    } else {
      dataArray = [result.data];
    }
    
    log(`📊 Records found: ${dataArray.length}`, colors.blue);
    
    if (dataArray.length > 0) {
      log(`📋 Sample data:`, colors.yellow);
      // Show first 2 records with key fields only
      dataArray.slice(0, 2).forEach((item, index) => {
        log(`\n   ${index + 1}. Record:`, colors.cyan);
        
        // Show key fields based on common patterns
        Object.entries(item).forEach(([key, value]) => {
          if (key.includes('id') || key.includes('name') || key.includes('email') || 
              key.includes('amount') || key.includes('status') || key.includes('quantity') ||
              key.includes('price') || key.includes('date') || key.includes('created_at')) {
            const displayValue = typeof value === 'string' && value.length > 50 
              ? value.substring(0, 50) + '...' 
              : value;
            log(`      ${key}: ${displayValue}`, colors.reset);
          }
        });
      });
      
      if (dataArray.length > 2) {
        log(`   ... and ${dataArray.length - 2} more records`, colors.magenta);
      }
    } else {
      log(`   📭 No data found in this table`, colors.yellow);
    }
    
    // Show pagination info if available
    if (result.data.pagination) {
      log(`📄 Pagination: Page ${result.data.pagination.page} of ${result.data.pagination.totalPages} (Total: ${result.data.pagination.total})`, colors.cyan);
    }
    
  } else {
    log(`❌ Status: ${result.status}`, colors.red);
    log(`   Error: ${result.data?.error || 'Unknown error'}`, colors.red);
  }
  
  return result;
}

async function runDatabaseTests() {
  log('🚀 STARTING COMPREHENSIVE DATABASE DATA TEST', colors.bright + colors.green);
  log(`🎯 Target: ${BASE_URL}`, colors.cyan);
  log(`⏰ Started at: ${new Date().toLocaleString()}`, colors.magenta);
  
  try {
    // Authenticate first
    const token = await authenticate();
    if (!token) {
      log('\n❌ Authentication failed. Cannot proceed.', colors.red);
      return;
    }
    
    log(`\n${'='.repeat(60)}`, colors.bright);
    log('📊 TESTING ALL DATABASE TABLES', colors.bright + colors.blue);
    log(`${'='.repeat(60)}`, colors.bright);
    
    // Test all available endpoints
    const endpoints = [
      // Core Management
      { endpoint: '/api/products?limit=10', description: 'Products (Fish Inventory)' },
      { endpoint: '/api/categories?limit=10', description: 'Product Categories' },
      { endpoint: '/api/sales?limit=10', description: 'Sales Transactions' },
      { endpoint: '/api/transactions?limit=10', description: 'Transaction Records' },
      { endpoint: '/api/transactions/stats', description: 'Transaction Statistics' },
      
      // User Management (if endpoints exist)
      { endpoint: '/api/users?limit=10', description: 'Users (Business Owners)' },
      { endpoint: '/api/workers?limit=10', description: 'Workers/Employees' },
      
      // Additional endpoints to test
      { endpoint: '/api/contacts?limit=10', description: 'Contacts (Customers/Suppliers)' },
      { endpoint: '/api/expenses?limit=10', description: 'Business Expenses' },
      { endpoint: '/api/stock-movements?limit=10', description: 'Stock Movements' },
      
      // Statistics endpoints
      { endpoint: '/api/sales/stats', description: 'Sales Statistics' },
      { endpoint: '/api/products/low-stock', description: 'Low Stock Products' },
    ];
    
    let successCount = 0;
    let totalTests = endpoints.length;
    
    for (const { endpoint, description } of endpoints) {
      const result = await testEndpoint(endpoint, token, description);
      if (result.success) {
        successCount++;
      }
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Summary
    log(`\n${'='.repeat(60)}`, colors.bright + colors.green);
    log('📈 TEST SUMMARY', colors.bright + colors.green);
    log(`${'='.repeat(60)}`, colors.bright + colors.green);
    
    log(`✅ Successful tests: ${successCount}/${totalTests}`, colors.green);
    log(`❌ Failed tests: ${totalTests - successCount}/${totalTests}`, colors.red);
    
    if (successCount === totalTests) {
      log('🎉 All database endpoints are working correctly!', colors.bright + colors.green);
    } else {
      log('⚠️ Some endpoints may not be implemented yet or have issues', colors.yellow);
    }
    
    log(`\n💡 Next steps:`, colors.cyan);
    log(`   • Add sample data to empty tables for testing`, colors.reset);
    log(`   • Implement missing endpoints if needed`, colors.reset);
    log(`   • Test CRUD operations (Create, Update, Delete)`, colors.reset);
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, colors.red);
    console.error(error);
  }
}

// Run the tests
runDatabaseTests().catch(console.error);
