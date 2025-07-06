/**
 * Test script for contacts API endpoints
 * Tests the contact creation, retrieval, update, and deletion functionality
 */

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Test contact data
 */
const testContact = {
  contact_name: 'Test Contact',
  company_name: 'Test Company',
  email: 'test@example.com',
  phone_number: '+1-555-0123',
  contact_type: 'customer',
  address: '123 Test Street, Test City'
};

/**
 * Make API request with proper headers
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      // Note: In a real test, you would need to include authentication headers
      // 'Authorization': 'Bearer your-jwt-token'
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    console.error(`❌ API request failed for ${endpoint}:`, error.message);
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Test contact creation
 */
async function testCreateContact() {
  console.log('\n📝 Testing contact creation...');
  
  const result = await apiRequest('/contacts', {
    method: 'POST',
    body: testContact
  });

  if (result.ok) {
    console.log('✅ Contact created successfully:', result.data.data?.contact_name);
    return result.data.data;
  } else {
    console.log('❌ Contact creation failed:', result.data.message || result.error);
    return null;
  }
}

/**
 * Test getting all contacts
 */
async function testGetContacts() {
  console.log('\n📋 Testing get all contacts...');
  
  const result = await apiRequest('/contacts');

  if (result.ok) {
    console.log(`✅ Retrieved ${result.data.data?.length || 0} contacts`);
    return result.data.data;
  } else {
    console.log('❌ Get contacts failed:', result.data.message || result.error);
    return null;
  }
}

/**
 * Test getting contact by ID
 */
async function testGetContactById(contactId) {
  console.log(`\n🔍 Testing get contact by ID: ${contactId}...`);
  
  const result = await apiRequest(`/contacts/${contactId}`);

  if (result.ok) {
    console.log('✅ Contact retrieved successfully:', result.data.data?.contact_name);
    return result.data.data;
  } else {
    console.log('❌ Get contact by ID failed:', result.data.message || result.error);
    return null;
  }
}

/**
 * Test updating contact
 */
async function testUpdateContact(contactId) {
  console.log(`\n✏️ Testing contact update: ${contactId}...`);
  
  const updateData = {
    contact_name: 'Updated Test Contact',
    email: 'updated@example.com'
  };

  const result = await apiRequest(`/contacts/${contactId}`, {
    method: 'PUT',
    body: updateData
  });

  if (result.ok) {
    console.log('✅ Contact updated successfully:', result.data.data?.contact_name);
    return result.data.data;
  } else {
    console.log('❌ Contact update failed:', result.data.message || result.error);
    return null;
  }
}

/**
 * Test deleting contact
 */
async function testDeleteContact(contactId) {
  console.log(`\n🗑️ Testing contact deletion: ${contactId}...`);
  
  const result = await apiRequest(`/contacts/${contactId}`, {
    method: 'DELETE'
  });

  if (result.ok) {
    console.log('✅ Contact deleted successfully');
    return true;
  } else {
    console.log('❌ Contact deletion failed:', result.data.message || result.error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Contacts API Tests...');
  console.log('⚠️  Note: These tests require the server to be running and authentication to be disabled for testing');

  // Test 1: Create contact
  const createdContact = await testCreateContact();
  if (!createdContact) {
    console.log('\n❌ Cannot continue tests - contact creation failed');
    return;
  }

  const contactId = createdContact.contact_id;

  // Test 2: Get all contacts
  await testGetContacts();

  // Test 3: Get contact by ID
  await testGetContactById(contactId);

  // Test 4: Update contact
  await testUpdateContact(contactId);

  // Test 5: Delete contact
  await testDeleteContact(contactId);

  console.log('\n🎉 All tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testCreateContact,
  testGetContacts,
  testGetContactById,
  testUpdateContact,
  testDeleteContact,
  runTests
};
