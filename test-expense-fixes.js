/**
 * Test script to verify expense categories and expense creation fixes
 */

const API_BASE_URL = 'http://localhost:8787';
const TEST_CREDENTIALS = {
  email: 'ntwaribrian262@gmail.com',
  password: 'ntwari6651'
};

async function testExpenseFixes() {
  console.log('🧪 Testing Expense Fixes...\n');

  try {
    // Step 1: Authenticate
    console.log('1. Authenticating...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.tokens.accessToken;
    console.log('✅ Authentication successful\n');

    // Step 2: Test expense categories endpoint
    console.log('2. Testing expense categories endpoint...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/api/expenses/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${categoriesResponse.status}`);
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Expense categories endpoint working!');
      console.log(`   Found ${categoriesData.data?.length || 0} categories`);
      console.log(`   Response format: ${categoriesData.success ? 'Valid' : 'Invalid'}`);
    } else {
      console.log('❌ Expense categories endpoint failed');
      const errorText = await categoriesResponse.text();
      console.log(`   Error: ${errorText}`);
    }

    // Step 3: Create a test expense category first
    console.log('\n3. Creating test expense category...');
    const testCategory = {
      category_name: 'Test Category ' + Date.now(),
      description: 'Test category for expense creation',
      budget: 100.00
    };

    const createCategoryResponse = await fetch(`${API_BASE_URL}/api/expenses/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCategory)
    });

    let categoryId = null;
    if (createCategoryResponse.ok) {
      const categoryData = await createCategoryResponse.json();
      categoryId = categoryData.data?.category_id;
      console.log('✅ Test category created successfully');
      console.log(`   Category ID: ${categoryId}`);
    } else {
      console.log('⚠️  Could not create test category, will try with existing category');
      
      // Try to get existing categories
      const existingCategoriesResponse = await fetch(`${API_BASE_URL}/api/expenses/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (existingCategoriesResponse.ok) {
        const existingData = await existingCategoriesResponse.json();
        if (existingData.data && existingData.data.length > 0) {
          categoryId = existingData.data[0].category_id;
          console.log(`   Using existing category: ${categoryId}`);
        }
      }
    }

    // Step 4: Test expense creation with proper JSON
    console.log('\n4. Testing expense creation...');
    
    if (!categoryId) {
      console.log('❌ Cannot test expense creation - no category available');
      return;
    }

    const testExpense = {
      title: 'Test Expense ' + Date.now(),
      category_id: categoryId,
      amount: 50.00,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      status: 'pending'
    };

    console.log('   Sending expense data:', JSON.stringify(testExpense, null, 2));

    const createExpenseResponse = await fetch(`${API_BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testExpense)
    });

    console.log(`   Status: ${createExpenseResponse.status}`);

    if (createExpenseResponse.ok) {
      const expenseData = await createExpenseResponse.json();
      console.log('✅ Expense creation successful!');
      console.log(`   Expense ID: ${expenseData.data?.expense_id}`);
      console.log(`   Title: ${expenseData.data?.title}`);
      console.log(`   Amount: $${expenseData.data?.amount}`);
    } else {
      const errorText = await createExpenseResponse.text();
      console.log('❌ Expense creation failed');
      console.log(`   Error response: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('   Parsed error:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('   Could not parse error response as JSON');
      }
    }

    // Step 5: Test with malformed JSON to verify error handling
    console.log('\n5. Testing malformed JSON handling...');
    const malformedResponse = await fetch(`${API_BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: '{"title": "test", "amount": -}' // Malformed JSON
    });

    console.log(`   Status: ${malformedResponse.status}`);
    
    if (malformedResponse.status === 400) {
      const errorData = await malformedResponse.json();
      console.log('✅ Malformed JSON properly handled');
      console.log(`   Error message: ${errorData.error}`);
    } else {
      console.log('❌ Malformed JSON not properly handled');
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testExpenseFixes();
