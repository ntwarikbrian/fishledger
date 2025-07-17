/**
 * Test script to verify transaction statistics endpoint
 */

const BASE_URL = 'http://localhost:8787';

async function testTransactionStats() {
  console.log('🧪 Testing Transaction Statistics Endpoint...\n');

  // Test 1: Get stats without authentication (should fail)
  console.log('Test 1: Get stats without authentication');
  await testStatsEndpoint('/api/transactions/stats', null);

  // Test 2: Get stats with mock authentication (if you have a test token)
  console.log('\nTest 2: Get stats with authentication');
  // You would need to replace this with a real token from login
  const mockToken = 'your-test-token-here';
  await testStatsEndpoint('/api/transactions/stats', mockToken);

  // Test 3: Get stats with date filters
  console.log('\nTest 3: Get stats with date filters');
  const dateFrom = '2024-01-01T00:00:00Z';
  const dateTo = '2024-12-31T23:59:59Z';
  await testStatsEndpoint(`/api/transactions/stats?date_from=${dateFrom}&date_to=${dateTo}`, mockToken);

  // Test 4: Test the health endpoint
  console.log('\nTest 4: Test health endpoint');
  await testStatsEndpoint('/health', null);

  console.log('\n✨ All tests completed!');
}

async function testStatsEndpoint(endpoint, token) {
  try {
    console.log(`📤 Testing: ${endpoint}`);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log(`✅ Success`);
    } else {
      console.log(`❌ Failed`);
    }
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log(`💥 Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to test with a real login token
async function loginAndTestStats() {
  console.log('🔐 Attempting to login and test stats...\n');
  
  try {
    // First, try to login (replace with real credentials)
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com', // Replace with real email
        password: 'password123'     // Replace with real password
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('🔐 Login response:', loginResult);
    
    if (loginResponse.ok && loginResult.success && loginResult.data?.tokens?.accessToken) {
      const token = loginResult.data.tokens.accessToken;
      console.log('✅ Login successful, testing stats with real token...\n');
      
      // Now test the stats endpoint with the real token
      await testStatsEndpoint('/api/transactions/stats', token);
    } else {
      console.log('❌ Login failed, cannot test with real token');
    }
  } catch (error) {
    console.log('💥 Login error:', error.message);
  }
}

// Run the tests
console.log('Choose test mode:');
console.log('1. Basic tests (without real authentication)');
console.log('2. Login and test with real token');
console.log('');

// For now, run basic tests
testTransactionStats().catch(console.error);

// Uncomment the line below to test with real login
// loginAndTestStats().catch(console.error);
