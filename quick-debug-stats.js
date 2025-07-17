/**
 * Quick Debug Script for Transaction Statistics Issue
 * Simple test to identify the exact problem with "Failed to fetch transaction statistics"
 */

const BASE_URL = 'http://localhost:8787';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test the transaction stats endpoint step by step
 */
async function debugTransactionStats() {
  log('cyan', '\n🔍 DEBUGGING TRANSACTION STATISTICS ISSUE');
  log('cyan', '='.repeat(50));
  
  // Step 1: Check if backend is running
  log('blue', '\n📡 Step 1: Checking if backend is running...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    if (healthResponse.ok) {
      log('green', '✅ Backend is running');
      const healthData = await healthResponse.json();
      console.log('Health response:', healthData);
    } else {
      log('red', '❌ Backend health check failed');
      return;
    }
  } catch (error) {
    log('red', `❌ Cannot connect to backend: ${error.message}`);
    log('yellow', '💡 Make sure backend is running with: npm run dev');
    return;
  }
  
  // Step 2: Test stats endpoint without authentication
  log('blue', '\n🔒 Step 2: Testing stats endpoint without authentication...');
  try {
    const noAuthResponse = await fetch(`${BASE_URL}/api/transactions/stats`);
    const noAuthData = await noAuthResponse.json();
    
    console.log('Status:', noAuthResponse.status);
    console.log('Response:', noAuthData);
    
    if (noAuthResponse.status === 401) {
      log('green', '✅ Correctly requires authentication');
    } else {
      log('yellow', '⚠️ Unexpected response - should require auth');
    }
  } catch (error) {
    log('red', `❌ Error testing without auth: ${error.message}`);
  }
  
  // Step 3: Try to get a token (you'll need to provide credentials)
  log('blue', '\n🔑 Step 3: Attempting to get authentication token...');
  log('yellow', '⚠️ You need to provide valid credentials below:');
  
  // You can update these credentials or the script will skip auth tests
  const testCredentials = {
    email: 'admin@example.com', // Update this
    password: 'password123'      // Update this
  };
  
  let authToken = null;
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    console.log('Login response:', loginData);
    
    if (loginResponse.ok && loginData.success) {
      authToken = loginData.data?.tokens?.accessToken || loginData.data?.token;
      if (authToken) {
        log('green', '✅ Authentication successful');
        log('cyan', `Token preview: ${authToken.substring(0, 30)}...`);
      }
    } else {
      log('red', '❌ Authentication failed');
      log('yellow', '💡 Update testCredentials in the script with valid login info');
    }
  } catch (error) {
    log('red', `❌ Login error: ${error.message}`);
  }
  
  // Step 4: Test stats endpoint with authentication
  if (authToken) {
    log('blue', '\n📊 Step 4: Testing stats endpoint with authentication...');
    
    try {
      const statsResponse = await fetch(`${BASE_URL}/api/transactions/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('Stats status:', statsResponse.status);
      console.log('Stats headers:', Object.fromEntries(statsResponse.headers.entries()));
      
      const statsData = await statsResponse.json();
      console.log('Stats response:', JSON.stringify(statsData, null, 2));
      
      if (statsResponse.ok) {
        log('green', '✅ Stats endpoint is working!');
        
        // Analyze the response structure
        log('cyan', '\n🔍 Response Structure Analysis:');
        console.log('- Type:', typeof statsData);
        console.log('- Has success:', 'success' in statsData);
        console.log('- Success value:', statsData.success);
        console.log('- Has data:', 'data' in statsData);
        console.log('- Data type:', typeof statsData.data);
        
        if (statsData.success && statsData.data) {
          log('green', '✅ Response structure is correct');
          console.log('Stats data keys:', Object.keys(statsData.data));
        } else {
          log('red', '❌ Response structure issue');
        }
      } else {
        log('red', '❌ Stats endpoint failed');
        
        if (statsResponse.status === 401) {
          log('yellow', '💡 Token might be expired or invalid');
        } else if (statsResponse.status === 403) {
          log('yellow', '💡 User might not have required permissions');
        } else if (statsResponse.status === 500) {
          log('yellow', '💡 Server error - check backend logs');
        }
      }
    } catch (error) {
      log('red', `❌ Stats request error: ${error.message}`);
    }
  } else {
    log('yellow', '⏭️ Skipping authenticated tests - no token available');
  }
  
  // Step 5: Test the exact frontend API client behavior
  if (authToken) {
    log('blue', '\n🖥️ Step 5: Simulating frontend API client...');
    
    try {
      // Simulate localStorage token (like frontend does)
      const mockLocalStorage = {
        auth_token: authToken
      };
      
      log('cyan', 'Simulating frontend request...');
      
      const frontendResponse = await fetch(`${BASE_URL}/api/transactions/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockLocalStorage.auth_token}`
        }
      });
      
      const frontendData = await frontendResponse.json();
      
      console.log('Frontend simulation result:');
      console.log('- Status:', frontendResponse.ok);
      console.log('- Data:', JSON.stringify(frontendData, null, 2));
      
      // Test the exact processing logic from the frontend service
      if (frontendResponse.ok && frontendData && frontendData.success && frontendData.data) {
        const processedResult = {
          success: frontendData.success,
          data: frontendData.data,
          message: frontendData.message,
          timestamp: frontendData.timestamp || new Date().toISOString(),
          requestId: frontendData.requestId || 'unknown'
        };
        
        log('green', '✅ Frontend processing would succeed');
        console.log('Processed result:', processedResult);
      } else {
        log('red', '❌ Frontend processing would fail');
        log('yellow', 'This is likely where the "Failed to fetch transaction statistics" error comes from');
      }
      
    } catch (error) {
      log('red', `❌ Frontend simulation error: ${error.message}`);
    }
  }
  
  // Summary and recommendations
  log('cyan', '\n📋 SUMMARY & RECOMMENDATIONS');
  log('cyan', '='.repeat(50));
  
  if (!authToken) {
    log('yellow', '🔑 AUTHENTICATION ISSUE:');
    console.log('   - Update testCredentials in this script');
    console.log('   - Or create a test user in your system');
    console.log('   - Check if registration is working');
  } else {
    log('green', '🔑 Authentication: Working');
  }
  
  log('blue', '\n🛠️ NEXT STEPS:');
  console.log('1. Run this script: node quick-debug-stats.js');
  console.log('2. Update credentials if needed');
  console.log('3. Check the output for specific error details');
  console.log('4. Look at backend console for any server errors');
  
  log('cyan', '\n✨ Debug completed!');
}

// Run the debug
debugTransactionStats().catch(error => {
  log('red', `💥 Debug script error: ${error.message}`);
  console.error(error);
});
