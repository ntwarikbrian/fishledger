/**
 * Test script to verify sales creation works with null client_name
 */

const BASE_URL = 'http://localhost:8787';

async function testSalesCreation() {
  console.log('🧪 Testing Sales Creation with different client_name scenarios...\n');

  // Test 1: Sale with client_name provided
  console.log('Test 1: Sale with client_name provided');
  await testSaleCreation({
    product_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
    boxes_quantity: 2,
    kg_quantity: 5.5,
    box_price: 25.99,
    kg_price: 1.30,
    payment_method: 'cash',
    payment_status: 'paid',
    amount_paid: 59.13,
    client_name: 'John Doe',
    email_address: 'john@example.com',
    phone: '+1-555-1001'
  });

  // Test 2: Sale without client_name (should use default)
  console.log('\nTest 2: Sale without client_name (should use default)');
  await testSaleCreation({
    product_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
    boxes_quantity: 1,
    kg_quantity: 3.0,
    box_price: 20.00,
    kg_price: 1.50,
    payment_method: 'momo_pay',
    payment_status: 'pending',
    amount_paid: 0
    // No client_name, email_address, or phone
  });

  // Test 3: Sale with empty client_name
  console.log('\nTest 3: Sale with empty client_name');
  await testSaleCreation({
    product_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
    boxes_quantity: 0,
    kg_quantity: 10.0,
    box_price: 0,
    kg_price: 1.25,
    payment_method: 'bank_transfer',
    payment_status: 'partial',
    amount_paid: 5.00,
    client_name: '', // Empty string
    email_address: '',
    phone: ''
  });

  console.log('\n✨ All tests completed!');
}

async function testSaleCreation(saleData) {
  try {
    console.log(`📤 Creating sale:`, JSON.stringify(saleData, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success (${response.status}):`, JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Failed (${response.status}):`, JSON.stringify(result, null, 2));
    }
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.log(`💥 Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Run the tests
testSalesCreation().catch(console.error);
