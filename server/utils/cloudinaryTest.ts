/**
 * Cloudinary Connection Test Utility
 * Tests the Cloudinary configuration and connection
 */

import { testCloudinaryConnection } from '../config/cloudinary.js';
import { cloudinaryConfig } from '../config/environment.js';

/**
 * Test Cloudinary configuration and connection
 * @returns Promise with test results
 */
export const runCloudinaryTest = async (): Promise<{
  success: boolean;
  message: string;
  config?: any;
  error?: string;
}> => {
  try {
    console.log('🔄 Testing Cloudinary configuration...');
    
    // Check if configuration is present
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
      return {
        success: false,
        message: 'Cloudinary configuration is incomplete',
        error: 'Missing required Cloudinary environment variables',
        config: {
          cloudName: cloudinaryConfig.cloudName ? '✅ Set' : '❌ Missing',
          apiKey: cloudinaryConfig.apiKey ? '✅ Set' : '❌ Missing',
          apiSecret: cloudinaryConfig.apiSecret ? '✅ Set (hidden)' : '❌ Missing',
        },
      };
    }

    // Test connection
    const connectionTest = await testCloudinaryConnection();
    
    if (!connectionTest) {
      return {
        success: false,
        message: 'Cloudinary connection test failed',
        error: 'Unable to connect to Cloudinary API',
        config: {
          cloudName: cloudinaryConfig.cloudName,
          apiKey: cloudinaryConfig.apiKey.substring(0, 6) + '...',
          apiSecret: '***hidden***',
        },
      };
    }

    return {
      success: true,
      message: 'Cloudinary connection test successful',
      config: {
        cloudName: cloudinaryConfig.cloudName,
        apiKey: cloudinaryConfig.apiKey.substring(0, 6) + '...',
        apiSecret: '***configured***',
        status: '✅ Connected',
      },
    };

  } catch (error) {
    console.error('Cloudinary test error:', error);
    return {
      success: false,
      message: 'Cloudinary test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * CLI test runner
 * Run this file directly to test Cloudinary connection
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runCloudinaryTest()
    .then((result) => {
      console.log('\n📊 Cloudinary Test Results:');
      console.log('================================');
      console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`Message: ${result.message}`);
      
      if (result.config) {
        console.log('\nConfiguration:');
        Object.entries(result.config).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
      
      if (result.error) {
        console.log(`\nError: ${result.error}`);
      }
      
      console.log('================================\n');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}
