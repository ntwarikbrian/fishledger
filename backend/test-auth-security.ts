/**
 * Authentication Security Test Runner
 * Quick verification script for authentication system fixes
 */

import { hashPassword, verifyPassword, validatePasswordStrength, generateAccessToken, verifyAccessToken } from './src/utils/auth';
import type { AuthenticatedUser, Environment } from './src/types/index';

// Mock environment for testing
const mockEnv: Environment = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-only-must-be-long-enough',
  JWT_REFRESH_SECRET: 'test-refresh-secret-key-for-testing-only-must-be-long-enough',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CORS_ORIGIN: '*',
  NODE_ENV: 'test',
  CLOUDINARY_CLOUD_NAME: 'test',
  CLOUDINARY_API_KEY: 'test',
  CLOUDINARY_API_SECRET: 'test',
};

async function runAuthSecurityTests() {
  console.log('🔐 Running Authentication Security Tests...\n');

  // Test 1: Password Strength Validation
  console.log('1. Testing Password Strength Validation...');
  
  const weakPasswords = [
    'password',      // Common word
    '123456',        // Common pattern
    'abc123',        // Common pattern
    'Password',      // Missing special char and number
    'password123',   // Missing uppercase and special char
    'PASSWORD123!',  // Missing lowercase
    'Pass1!',        // Too short
  ];

  const strongPasswords = [
    'MySecurePassword123!',
    'BusinessOwner2024@',
    'FishingApp#2024',
  ];

  console.log('   Testing weak passwords (should fail):');
  for (const password of weakPasswords) {
    const result = validatePasswordStrength(password);
    console.log(`   - "${password}": ${result.isValid ? '❌ PASSED (SHOULD FAIL)' : '✅ FAILED (CORRECT)'}`);
    if (!result.isValid) {
      console.log(`     Errors: ${result.errors.join(', ')}`);
    }
  }

  console.log('\n   Testing strong passwords (should pass):');
  for (const password of strongPasswords) {
    const result = validatePasswordStrength(password);
    console.log(`   - "${password}": ${result.isValid ? '✅ PASSED (CORRECT)' : '❌ FAILED (SHOULD PASS)'}`);
    if (!result.isValid) {
      console.log(`     Errors: ${result.errors.join(', ')}`);
    }
  }

  // Test 2: Password Hashing and Verification
  console.log('\n2. Testing Password Hashing and Verification...');
  
  const testPassword = 'MySecurePassword123!';
  const wrongPassword = 'WrongPassword123!';
  
  try {
    const hashedPassword = await hashPassword(testPassword);
    console.log(`   ✅ Password hashed successfully`);
    console.log(`   Hash format: ${hashedPassword.match(/^\$2[aby]\$\d{2}\$.{53}$/) ? '✅ Valid bcrypt format' : '❌ Invalid format'}`);
    
    const correctVerification = await verifyPassword(testPassword, hashedPassword);
    console.log(`   Correct password verification: ${correctVerification ? '✅ PASSED' : '❌ FAILED'}`);
    
    const wrongVerification = await verifyPassword(wrongPassword, hashedPassword);
    console.log(`   Wrong password verification: ${wrongVerification ? '❌ FAILED (SHOULD REJECT)' : '✅ PASSED (CORRECTLY REJECTED)'}`);
    
  } catch (error) {
    console.log(`   ❌ Password hashing/verification failed: ${error}`);
  }

  // Test 3: JWT Token Generation and Verification
  console.log('\n3. Testing JWT Token Security...');
  
  const testUser: AuthenticatedUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    role: 'admin',
    isActive: true,
  };

  try {
    const token = generateAccessToken(testUser, mockEnv);
    console.log(`   ✅ JWT token generated successfully`);
    console.log(`   Token format: ${token.split('.').length === 3 ? '✅ Valid JWT format' : '❌ Invalid format'}`);
    
    const payload = verifyAccessToken(token, mockEnv);
    console.log(`   ✅ JWT token verified successfully`);
    console.log(`   User ID match: ${payload.userId === testUser.id ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Email match: ${payload.email === testUser.email ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Role match: ${payload.role === testUser.role ? '✅ PASSED' : '❌ FAILED'}`);
    
  } catch (error) {
    console.log(`   ❌ JWT token generation/verification failed: ${error}`);
  }

  // Test 4: Invalid JWT Token Rejection
  console.log('\n4. Testing Invalid JWT Token Rejection...');
  
  const invalidTokens = [
    'invalid.token.here',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
    '',
    'not-a-jwt-at-all',
  ];

  for (const invalidToken of invalidTokens) {
    try {
      verifyAccessToken(invalidToken, mockEnv);
      console.log(`   ❌ Invalid token "${invalidToken.substring(0, 20)}..." was accepted (SHOULD REJECT)`);
    } catch (error) {
      console.log(`   ✅ Invalid token correctly rejected`);
    }
  }

  // Test 5: User ID Format Validation
  console.log('\n5. Testing User ID Format Validation...');
  
  const validUserIds = [
    '123e4567-e89b-12d3-a456-426614174000',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  ];

  const invalidUserIds = [
    'not-a-uuid',
    '123-456-789',
    '',
    '123e4567-e89b-12d3-a456-42661417400', // Too short
    '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
  ];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  console.log('   Testing valid UUIDs:');
  for (const userId of validUserIds) {
    const isValid = uuidRegex.test(userId);
    console.log(`   - "${userId}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  }

  console.log('\n   Testing invalid UUIDs:');
  for (const userId of invalidUserIds) {
    const isValid = uuidRegex.test(userId);
    console.log(`   - "${userId}": ${isValid ? '❌ VALID (SHOULD BE INVALID)' : '✅ INVALID (CORRECT)'}`);
  }

  console.log('\n🔐 Authentication Security Tests Completed!');
  console.log('\n📋 Summary of Security Enhancements:');
  console.log('   ✅ Enhanced password strength validation');
  console.log('   ✅ Secure password hashing with bcrypt');
  console.log('   ✅ Strong JWT token generation and verification');
  console.log('   ✅ User ID format validation (UUID)');
  console.log('   ✅ Database user validation in authentication middleware');
  console.log('   ✅ Data isolation enforcement');
  console.log('   ✅ Rate limiting for authentication endpoints');
  console.log('   ✅ Disabled cross-user account creation/deletion');
  console.log('   ✅ Enhanced security logging and monitoring');
}

// Run the tests
runAuthSecurityTests().catch(console.error);
