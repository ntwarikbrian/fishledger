/**
 * Test script to diagnose expense category update issue
 */

const API_BASE_URL = 'http://localhost:8787';

async function testCategoryUpdate() {
  console.log('🧪 Testing Expense Category Update...\n');

  try {
    // Step 1: Authenticate
    console.log('1. Authenticating...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ntwaribrian262@gmail.com',
        password: 'ntwari6651'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.tokens.accessToken;
    console.log('✅ Authentication successful\n');

    // Step 2: Get existing categories
    console.log('2. Fetching existing categories...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/api/expenses/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const categoriesData = await categoriesResponse.json();
    
    if (!categoriesData.success || categoriesData.data.length === 0) {
      console.log('❌ No categories found for testing');
      return;
    }

    const testCategory = categoriesData.data[0];
    console.log(`✅ Found test category: ${testCategory.category_name}`);
    console.log(`   Category ID: ${testCategory.category_id}`);
    console.log(`   Current budget: $${testCategory.budget}`);
    console.log(`   Current description: ${testCategory.description || 'None'}\n`);

    // Step 3: Test category update
    console.log('3. Testing category update...');
    
    const updateData = {
      category_name: testCategory.category_name + ' (Updated)',
      description: 'Updated description for testing - ' + new Date().toISOString(),
      budget: (testCategory.budget || 0) + 100
    };

    console.log('   Update data:', JSON.stringify(updateData, null, 2));

    const updateResponse = await fetch(`${API_BASE_URL}/api/expenses/categories/${testCategory.category_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    console.log(`   Update response status: ${updateResponse.status}`);
    
    const updateResponseText = await updateResponse.text();
    console.log(`   Raw response: ${updateResponseText.substring(0, 500)}${updateResponseText.length > 500 ? '...' : ''}`);

    if (updateResponse.ok) {
      try {
        const updateResult = JSON.parse(updateResponseText);
        console.log('✅ Category update successful!');
        console.log('   Updated data:', JSON.stringify(updateResult.data, null, 2));
      } catch (parseError) {
        console.log('❌ Failed to parse success response as JSON');
      }
    } else {
      console.log('❌ Category update failed');
      
      try {
        const errorResult = JSON.parse(updateResponseText);
        console.log('   Error details:', JSON.stringify(errorResult, null, 2));
      } catch (parseError) {
        console.log('   Could not parse error response as JSON');
      }
    }

    // Step 4: Verify the update by fetching the category again
    console.log('\n4. Verifying update by fetching category...');
    
    const verifyResponse = await fetch(`${API_BASE_URL}/api/expenses/categories/${testCategory.category_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Category fetched for verification');
      console.log('   Current name:', verifyData.data?.category_name);
      console.log('   Current description:', verifyData.data?.description);
      console.log('   Current budget:', verifyData.data?.budget);
      
      // Check if update was actually applied
      if (verifyData.data?.category_name === updateData.category_name) {
        console.log('✅ Update was successfully applied!');
      } else {
        console.log('❌ Update was not applied - name mismatch');
      }
    } else {
      console.log('❌ Failed to verify update');
    }

    // Step 5: Test validation errors
    console.log('\n5. Testing validation errors...');
    
    const invalidUpdateData = {
      category_name: '', // Empty name should fail
      description: 'Test invalid update',
      budget: -100 // Negative budget should fail
    };

    const invalidResponse = await fetch(`${API_BASE_URL}/api/expenses/categories/${testCategory.category_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidUpdateData)
    });

    console.log(`   Validation test status: ${invalidResponse.status}`);
    
    if (invalidResponse.status === 400) {
      const validationError = await invalidResponse.json();
      console.log('✅ Validation errors properly handled');
      console.log('   Error details:', JSON.stringify(validationError, null, 2));
    } else {
      console.log('❌ Validation errors not properly handled');
    }

    console.log('\n🎉 Category update test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCategoryUpdate();
