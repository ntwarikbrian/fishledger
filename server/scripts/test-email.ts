/**
 * Email Testing Script
 * Tests the email functionality with the configured credentials
 */

import { emailService } from '../services/emailService.js';
import { emailConfig } from '../config/environment.js';

/**
 * Test email configuration and sending
 */
async function testEmailFunctionality() {
  console.log('🧪 Starting email functionality test...\n');

  // Display current email configuration
  console.log('📧 Email Configuration:');
  console.log('  Host:', emailConfig.host || 'NOT SET');
  console.log('  Port:', emailConfig.port || 'NOT SET');
  console.log('  User:', emailConfig.user || 'NOT SET');
  console.log('  From:', emailConfig.from || 'NOT SET');
  console.log('  Password:', emailConfig.password ? '***configured***' : 'NOT SET');

  // Check if configuration is complete
  if (!emailConfig.user || !emailConfig.password) {
    console.log('');
    console.log('❌ Email configuration incomplete!');
    console.log('📝 Please set the following environment variables:');
    console.log('   EMAIL_USER=automatedinventorymessage@gmail.com');
    console.log('   EMAIL_PASSWORD=wzge fkwj unyk xkiw');
    console.log('   EMAIL_FROM=automatedinventorymessage@gmail.com');
    console.log('');
    console.log('💡 You can set these in your .env file or as environment variables');
    return;
  }

  console.log('');

  try {
    // Test 1: Email configuration test
    console.log('🔧 Test 1: Testing email configuration...');
    const configTest = await emailService.testEmailConfiguration();
    
    if (configTest.success) {
      console.log('✅ Email configuration test passed');
    } else {
      console.log('❌ Email configuration test failed:', configTest.error);
      return;
    }
    console.log('');

    // Test 2: Send test email
    console.log('📨 Test 2: Sending test email...');
    const testEmail = await emailService.sendTestEmail('test@example.com');
    
    if (testEmail.success) {
      console.log('✅ Test email sent successfully');
      console.log('   Message ID:', testEmail.messageId);
    } else {
      console.log('❌ Test email failed:', testEmail.error);
    }
    console.log('');

    // Test 3: Send custom email
    console.log('📮 Test 3: Sending custom email...');
    const customEmail = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'AquaManage System Test',
      content: 'This is a test email from the AquaManage messaging system.\n\nIf you receive this, the email configuration is working correctly!',
    });
    
    if (customEmail.success) {
      console.log('✅ Custom email sent successfully');
      console.log('   Message ID:', customEmail.messageId);
    } else {
      console.log('❌ Custom email failed:', customEmail.error);
    }
    console.log('');

    console.log('🎉 Email functionality test completed!');
    
  } catch (error: any) {
    console.error('💥 Email test failed with error:', error.message);
    console.error('   Details:', error);
  }
}

/**
 * Run the test if this script is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailFunctionality()
    .then(() => {
      console.log('\n✨ Test script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

export { testEmailFunctionality };
