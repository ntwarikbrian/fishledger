/**
 * Simple test to check what the backend is actually returning
 * Run this in the browser console or as a Node.js script
 */

async function testBackendResponse() {
  const BASE_URL = 'http://localhost:8787';
  
  console.log('🔍 Testing backend response...');
  
  // Get auth token from localStorage (if running in browser)
  let authToken = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    authToken = localStorage.getItem('auth_token');
    console.log('🔑 Auth token found:', authToken ? 'YES' : 'NO');
  }
  
  try {
    // Test 1: Health endpoint (no auth required)
    console.log('\n📡 Test 1: Health endpoint');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthText = await healthResponse.text();
    console.log('Health status:', healthResponse.status);
    console.log('Health headers:', Object.fromEntries(healthResponse.headers.entries()));
    console.log('Health raw text:', healthText);
    
    if (healthText) {
      try {
        const healthData = JSON.parse(healthText);
        console.log('Health parsed data:', healthData);
      } catch (e) {
        console.log('Health text is not valid JSON');
      }
    }
    
    // Test 2: Transactions endpoint (requires auth)
    if (authToken) {
      console.log('\n📊 Test 2: Transactions endpoint');
      const transactionsResponse = await fetch(`${BASE_URL}/api/transactions?page=1&limit=5`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const transactionsText = await transactionsResponse.text();
      console.log('Transactions status:', transactionsResponse.status);
      console.log('Transactions headers:', Object.fromEntries(transactionsResponse.headers.entries()));
      console.log('Transactions raw text:', transactionsText);
      console.log('Transactions text length:', transactionsText.length);
      
      if (transactionsText) {
        try {
          const transactionsData = JSON.parse(transactionsText);
          console.log('Transactions parsed data:', transactionsData);
        } catch (e) {
          console.log('Transactions text is not valid JSON:', e.message);
        }
      }
      
      // Test 3: Transaction stats endpoint (requires auth)
      console.log('\n📈 Test 3: Transaction stats endpoint');
      const statsResponse = await fetch(`${BASE_URL}/api/transactions/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const statsText = await statsResponse.text();
      console.log('Stats status:', statsResponse.status);
      console.log('Stats headers:', Object.fromEntries(statsResponse.headers.entries()));
      console.log('Stats raw text:', statsText);
      console.log('Stats text length:', statsText.length);
      console.log('Stats text type:', typeof statsText);
      
      if (statsText) {
        try {
          const statsData = JSON.parse(statsText);
          console.log('Stats parsed data:', statsData);
          console.log('Stats data type:', typeof statsData);
          console.log('Stats data keys:', Object.keys(statsData));
        } catch (e) {
          console.log('Stats text is not valid JSON:', e.message);
        }
      } else {
        console.log('⚠️ Stats response is empty!');
      }
      
    } else {
      console.log('\n⏭️ Skipping authenticated tests - no auth token');
      console.log('💡 To test with auth, run this in browser console after logging in');
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
  
  console.log('\n✨ Backend response test completed!');
}

// Run the test
if (typeof window !== 'undefined') {
  // Running in browser
  console.log('🌐 Running in browser...');
  testBackendResponse();
} else {
  // Running in Node.js
  console.log('🖥️ Running in Node.js...');
  console.log('💡 For full testing, run this in browser console after logging in');
  
  // Test just the health endpoint in Node.js
  (async () => {
    try {
      const response = await fetch('http://localhost:8787/health');
      const text = await response.text();
      console.log('Health check:', {
        status: response.status,
        text: text,
        length: text.length
      });
    } catch (error) {
      console.error('Health check failed:', error.message);
    }
  })();
}

// Export for manual testing
if (typeof window !== 'undefined') {
  window.testBackendResponse = testBackendResponse;
  console.log('💡 You can also run: testBackendResponse()');
}
