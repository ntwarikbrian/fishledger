/**
 * Test script to verify the singleton database connection pattern
 * Run this to ensure the database connection is initialized only once
 */

import { getSupabaseClientSingleton, resetSupabaseClientSingleton, getConnectionStatus } from './src/config/supabase';
import { validateEnvironment } from './src/config/environment';

// Mock environment for testing
const mockEnv = {
  ENVIRONMENT: 'development',
  LOG_LEVEL: 'info',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key',
  JWT_SECRET: 'your-jwt-secret-at-least-32-characters-long',
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_SECRET: 'your-refresh-secret-also-32-characters-long',
  JWT_REFRESH_EXPIRES_IN: '30d',
  CORS_ORIGIN: '*',
  MAX_FILE_SIZE: '10485760',
  UPLOAD_PATH: './uploads',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: '587',
};

async function testSingletonPattern() {
  console.log('🧪 Testing Singleton Database Connection Pattern\n');

  try {
    // Reset singleton to start fresh
    resetSupabaseClientSingleton();
    console.log('1. Reset singleton state');

    // Validate environment
    const validatedEnv = validateEnvironment(mockEnv);
    console.log('2. Environment validated');

    // Check initial status (should be null)
    let status = getConnectionStatus();
    console.log('3. Initial connection status:', status ? 'exists' : 'null');

    // First call - should create new connection
    console.log('\n--- First Connection Call ---');
    const start1 = Date.now();
    const result1 = await getSupabaseClientSingleton(validatedEnv);
    const duration1 = Date.now() - start1;
    console.log(`✅ First call completed in ${duration1}ms`);
    console.log(`   - New connection: ${result1.isNewConnection}`);
    console.log(`   - Using service role: ${result1.usingServiceRole}`);
    console.log(`   - Connection healthy: ${result1.connectionHealthy}`);

    // Second call - should reuse existing connection
    console.log('\n--- Second Connection Call ---');
    const start2 = Date.now();
    const result2 = await getSupabaseClientSingleton(validatedEnv);
    const duration2 = Date.now() - start2;
    console.log(`✅ Second call completed in ${duration2}ms`);
    console.log(`   - New connection: ${result2.isNewConnection}`);
    console.log(`   - Same client instance: ${result1.client === result2.client}`);

    // Third call - should also reuse
    console.log('\n--- Third Connection Call ---');
    const start3 = Date.now();
    const result3 = await getSupabaseClientSingleton(validatedEnv);
    const duration3 = Date.now() - start3;
    console.log(`✅ Third call completed in ${duration3}ms`);
    console.log(`   - New connection: ${result3.isNewConnection}`);
    console.log(`   - Same client instance: ${result1.client === result3.client}`);

    // Check final status
    status = getConnectionStatus();
    console.log('\n--- Final Connection Status ---');
    console.log('Status:', status);

    // Performance comparison
    console.log('\n--- Performance Comparison ---');
    console.log(`First call (new connection): ${duration1}ms`);
    console.log(`Second call (reused): ${duration2}ms`);
    console.log(`Third call (reused): ${duration3}ms`);
    console.log(`Performance improvement: ${Math.round(((duration1 - duration2) / duration1) * 100)}%`);

    console.log('\n🎉 Singleton pattern test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSingletonPattern();
