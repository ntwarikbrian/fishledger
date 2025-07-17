/**
 * Simple test script to verify transaction endpoints are working
 */

const BASE_URL = 'http://localhost:8787';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`\n🧪 Testing ${method} ${endpoint}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Transaction API Tests...\n');
  
  // Test 1: Get transactions
  await testEndpoint('/api/transactions?page=1&limit=5');
  
  // Test 2: Get transaction stats
  await testEndpoint('/api/transactions/stats');
  
  // Test 3: Test health endpoint (if exists)
  await testEndpoint('/health');
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(console.error);
