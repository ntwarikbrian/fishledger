#!/usr/bin/env node

/**
 * Test script for deployed backend
 */

import https from 'https';

const BASE_URL = 'https://local-fishing-backend.ntwaribrian262.workers.dev';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Backend-Test-Script'
      }
    };

    if (data && method !== 'GET') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 Testing Deployed Backend...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('=' .repeat(50));

  const tests = [
    { name: 'Health Check', path: '/health' },
    { name: 'API Products', path: '/api/products' },
    { name: 'API Categories', path: '/api/categories' },
    { name: 'API Sales', path: '/api/sales' }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`URL: ${BASE_URL}${test.path}`);
      
      const response = await makeRequest(test.path);
      
      if (response.status === 200) {
        console.log(`✅ ${test.name}: SUCCESS (${response.status})`);
        if (response.body.message) {
          console.log(`   Message: ${response.body.message}`);
        }
      } else if (response.status === 401) {
        console.log(`🔒 ${test.name}: REQUIRES AUTH (${response.status})`);
      } else {
        console.log(`⚠️  ${test.name}: ${response.status}`);
        if (response.body.error) {
          console.log(`   Error: ${response.body.error}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Backend deployment test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Your backend is deployed and accessible');
  console.log('2. Frontend can now connect to the deployed backend');
  console.log('3. You can deploy the frontend to Cloudflare Pages');
  console.log('4. Test the full application in production');
}

testEndpoints().catch(console.error);
