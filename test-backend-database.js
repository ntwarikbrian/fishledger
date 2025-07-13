#!/usr/bin/env node

/**
 * Test script for backend-database connection
 */

import https from 'https';

const BASE_URL = 'https://local-fishing-backend.ntwaribrian262.workers.dev';

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Backend-Database-Test-Script'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

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

async function testDatabaseConnection() {
  console.log('🔍 Testing Backend-Database Connection...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('=' .repeat(60));

  // Test 1: Health Check
  try {
    console.log('\n1️⃣ Testing Health Check...');
    const health = await makeRequest('/health');
    
    if (health.status === 200) {
      console.log('✅ Health Check: SUCCESS');
      console.log(`   Message: ${health.body.message}`);
      console.log(`   Environment: ${health.body.environment}`);
      console.log(`   Version: ${health.body.version}`);
    } else {
      console.log(`❌ Health Check: FAILED (${health.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Health Check: ERROR - ${error.message}`);
    return false;
  }

  // Test 2: Database Connection Test (if endpoint exists)
  try {
    console.log('\n2️⃣ Testing Database Connection...');
    const dbTest = await makeRequest('/api/test/database');
    
    if (dbTest.status === 200) {
      console.log('✅ Database Connection: SUCCESS');
      console.log(`   Status: ${dbTest.body.message || 'Connected'}`);
    } else if (dbTest.status === 404) {
      console.log('⚠️  Database Test Endpoint: Not available (this is normal)');
    } else {
      console.log(`❌ Database Connection: FAILED (${dbTest.status})`);
      if (dbTest.body.error) {
        console.log(`   Error: ${dbTest.body.error}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Database Test: ${error.message}`);
  }

  // Test 3: Try to register a test user (to test database write)
  try {
    console.log('\n3️⃣ Testing Database Write (User Registration)...');
    const testUser = {
      email_address: `test-${Date.now()}@example.com`,
      password: 'TestPassword123',
      confirm_password: 'TestPassword123',
      business_name: 'Test Business',
      owner_name: 'Test Owner',
      phone_number: '+1234567890'
    };

    const registerResponse = await makeRequest('/api/auth/register', 'POST', testUser);
    
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log('✅ Database Write: SUCCESS');
      console.log('   User registration worked - database is writable');
      
      // Try to login with the test user
      console.log('\n4️⃣ Testing Database Read (User Login)...');
      const loginResponse = await makeRequest('/api/auth/login', 'POST', {
        email: testUser.email_address,
        password: testUser.password
      });
      
      if (loginResponse.status === 200) {
        console.log('✅ Database Read: SUCCESS');
        console.log('   User login worked - database is readable');
        
        // Test authenticated endpoint
        const token = loginResponse.body.data?.tokens?.accessToken;
        if (token) {
          console.log('\n5️⃣ Testing Authenticated API Endpoints...');
          const productsResponse = await makeRequest('/api/products', 'GET', null, token);
          
          if (productsResponse.status === 200) {
            console.log('✅ Authenticated Endpoints: SUCCESS');
            console.log(`   Products endpoint returned ${productsResponse.body.data?.length || 0} items`);
          } else {
            console.log(`⚠️  Authenticated Endpoints: ${productsResponse.status}`);
            if (productsResponse.body.error) {
              console.log(`   Error: ${productsResponse.body.error}`);
            }
          }
        }
      } else {
        console.log(`❌ Database Read: FAILED (${loginResponse.status})`);
        if (loginResponse.body.error) {
          console.log(`   Error: ${loginResponse.body.error}`);
        }
      }
    } else if (registerResponse.status === 409) {
      console.log('⚠️  Database Write: User already exists (database is working)');
    } else {
      console.log(`❌ Database Write: FAILED (${registerResponse.status})`);
      if (registerResponse.body.error) {
        console.log(`   Error: ${registerResponse.body.error}`);
      }
    }
  } catch (error) {
    console.log(`❌ Database Write Test: ERROR - ${error.message}`);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎯 Backend-Database Connection Test Complete!');
  
  return true;
}

async function main() {
  try {
    await testDatabaseConnection();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
