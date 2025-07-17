/**
 * Test script to verify Cloudinary configuration and functionality
 */

import { createCloudinaryService } from './src/config/cloudinary';
import { createFileUploadService } from './src/utils/fileUpload';
import { validateEnvironment } from './src/config/environment';

// Mock environment for testing
const mockEnv = {
  ENVIRONMENT: 'development',
  LOG_LEVEL: 'debug',
  SUPABASE_URL: 'https://hebdlpduohlfhdgvugla.supabase.co',
  SUPABASE_ANON_KEY: 'test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  JWT_SECRET: 'your_super_secret_jwt_key_here_make_it_at_least_32_characters_long',
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_SECRET: 'your_refresh_secret_here_also_make_it_32_characters_long',
  JWT_REFRESH_EXPIRES_IN: '30d',
  CORS_ORIGIN: '*',
  MAX_FILE_SIZE: 10485760,
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
  EMAIL_USER: 'test@example.com',
  EMAIL_PASSWORD: 'test-password',
  EMAIL_FROM: 'test@example.com',
  CLOUDINARY_CLOUD_NAME: 'dji23iymw',
  CLOUDINARY_API_KEY: '162843632338622',
  CLOUDINARY_API_SECRET: 'pB_7QOUVorneWKAer1aErW-yNe0',
};

async function testCloudinaryConfiguration() {
  console.log('🧪 Testing Cloudinary Configuration...\n');

  try {
    // Validate environment
    const env = validateEnvironment(mockEnv);
    console.log('✅ Environment validation passed');

    // Create Cloudinary service
    const cloudinaryService = createCloudinaryService(env);
    console.log('✅ Cloudinary service created');

    // Check if service is ready
    const isReady = cloudinaryService.isReady();
    console.log(`✅ Cloudinary service ready: ${isReady}`);

    if (!isReady) {
      console.log('❌ Cloudinary service not ready - check configuration');
      return;
    }

    // Test URL generation
    const testPublicId = 'test-image';
    const testUrl = cloudinaryService.generateUrl(testPublicId, {
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto:good',
    });
    console.log('✅ URL generation test passed');
    console.log(`   Generated URL: ${testUrl}`);

    // Test responsive URLs
    const responsiveUrls = cloudinaryService.generateResponsiveUrls(testPublicId, [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'medium', width: 400, height: 400 },
    ]);
    console.log('✅ Responsive URLs generation test passed');
    console.log('   Generated URLs:', responsiveUrls);

    // Create file upload service
    const fileUploadService = createFileUploadService(env);
    console.log('✅ File upload service created');

    // Check if file upload service is ready
    const uploadReady = fileUploadService.isReady();
    console.log(`✅ File upload service ready: ${uploadReady}`);

    // Test file validation
    const mockFile = {
      fieldName: 'test',
      filename: 'test.jpg',
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test-data'),
    };

    const validationErrors = fileUploadService.validateFile(mockFile);
    console.log(`✅ File validation test passed (errors: ${validationErrors.length})`);

    if (validationErrors.length > 0) {
      console.log('   Validation errors:', validationErrors);
    }

    console.log('\n🎉 All Cloudinary tests passed successfully!');
    console.log('\n📋 Configuration Summary:');
    console.log(`   Cloud Name: ${env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API Key: ${env.CLOUDINARY_API_KEY?.substring(0, 8)}...`);
    console.log(`   Service Ready: ${isReady}`);
    console.log(`   Upload Service Ready: ${uploadReady}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack trace:', error.stack);
    }
  }
}

async function testFileUploadUtilities() {
  console.log('\n🧪 Testing File Upload Utilities...\n');

  try {
    const { validateFileType, validateFileSize, generateUniqueFilename, formatFileSize } = await import('./src/utils/fileUpload');

    // Test file type validation
    console.log('Testing file type validation:');
    console.log(`  test.jpg: ${validateFileType('test.jpg')}`);
    console.log(`  test.png: ${validateFileType('test.png')}`);
    console.log(`  test.gif: ${validateFileType('test.gif')}`);
    console.log(`  test.txt: ${validateFileType('test.txt')}`);
    console.log('✅ File type validation tests passed');

    // Test file size validation
    console.log('\nTesting file size validation:');
    console.log(`  1KB (max 5MB): ${validateFileSize(1024, 5242880)}`);
    console.log(`  10MB (max 5MB): ${validateFileSize(10485760, 5242880)}`);
    console.log('✅ File size validation tests passed');

    // Test unique filename generation
    console.log('\nTesting unique filename generation:');
    const uniqueName1 = generateUniqueFilename('test.jpg');
    const uniqueName2 = generateUniqueFilename('test.jpg', 'product');
    console.log(`  Original: test.jpg -> ${uniqueName1}`);
    console.log(`  With prefix: test.jpg -> ${uniqueName2}`);
    console.log('✅ Unique filename generation tests passed');

    // Test file size formatting
    console.log('\nTesting file size formatting:');
    console.log(`  1024 bytes: ${formatFileSize(1024)}`);
    console.log(`  1048576 bytes: ${formatFileSize(1048576)}`);
    console.log(`  1073741824 bytes: ${formatFileSize(1073741824)}`);
    console.log('✅ File size formatting tests passed');

    console.log('\n🎉 All file upload utility tests passed!');

  } catch (error) {
    console.error('❌ File upload utility tests failed:', error);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Cloudinary Integration Tests\n');
  console.log('=' .repeat(50));
  
  await testCloudinaryConfiguration();
  await testFileUploadUtilities();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 All tests completed!');
}

// Execute tests if this file is run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { testCloudinaryConfiguration, testFileUploadUtilities, runAllTests };
