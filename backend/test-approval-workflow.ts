/**
 * Manual integration test for the approval workflow
 * This script tests the complete approval workflow for stock operations
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - replace with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logResult(test: string, status: 'PASS' | 'FAIL', message: string, data?: any) {
  results.push({ test, status, message, data });
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

async function testStockAdditionApproval() {
  console.log('\n🧪 Testing Stock Addition Approval Workflow...');
  
  try {
    // First, get a test product
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('product_id, name, quantity_box, quantity_kg')
      .limit(1);

    if (productError || !products || products.length === 0) {
      logResult('Stock Addition - Get Product', 'FAIL', 'No test product found');
      return;
    }

    const testProduct = products[0];
    logResult('Stock Addition - Get Product', 'PASS', `Found test product: ${testProduct.name}`);

    // Create a pending stock addition request
    const { data: stockMovement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: testProduct.product_id,
        movement_type: 'new_stock',
        box_change: 5,
        kg_change: 10.5,
        reason: 'Test stock addition request: 5 boxes, 10.5 kg (Cost: $500)',
        performed_by: '00000000-0000-0000-0000-000000000000', // Test user ID
        status: 'pending'
      })
      .select()
      .single();

    if (movementError) {
      logResult('Stock Addition - Create Request', 'FAIL', `Failed to create request: ${movementError.message}`);
      return;
    }

    logResult('Stock Addition - Create Request', 'PASS', 'Pending stock addition request created', {
      movement_id: stockMovement.movement_id,
      status: stockMovement.status
    });

    // Verify the request is pending
    const { data: pendingMovement, error: fetchError } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('movement_id', stockMovement.movement_id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !pendingMovement) {
      logResult('Stock Addition - Verify Pending', 'FAIL', 'Request not found in pending status');
      return;
    }

    logResult('Stock Addition - Verify Pending', 'PASS', 'Request is properly pending approval');

    // Simulate approval by updating status and product quantities
    const originalBoxQty = testProduct.quantity_box;
    const originalKgQty = testProduct.quantity_kg;

    // Update product quantities (simulating approval)
    const { error: updateError } = await supabase
      .from('products')
      .update({
        quantity_box: originalBoxQty + pendingMovement.box_change,
        quantity_kg: originalKgQty + pendingMovement.kg_change,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', testProduct.product_id);

    if (updateError) {
      logResult('Stock Addition - Update Product', 'FAIL', `Failed to update product: ${updateError.message}`);
      return;
    }

    // Update movement status to completed
    const { error: statusError } = await supabase
      .from('stock_movements')
      .update({ status: 'completed' })
      .eq('movement_id', stockMovement.movement_id);

    if (statusError) {
      logResult('Stock Addition - Complete Request', 'FAIL', `Failed to complete request: ${statusError.message}`);
      return;
    }

    logResult('Stock Addition - Complete Request', 'PASS', 'Stock addition approved and applied successfully');

    // Verify product quantities were updated
    const { data: updatedProduct, error: verifyError } = await supabase
      .from('products')
      .select('quantity_box, quantity_kg')
      .eq('product_id', testProduct.product_id)
      .single();

    if (verifyError || !updatedProduct) {
      logResult('Stock Addition - Verify Update', 'FAIL', 'Failed to verify product update');
      return;
    }

    const expectedBoxQty = originalBoxQty + pendingMovement.box_change;
    const expectedKgQty = originalKgQty + pendingMovement.kg_change;

    if (updatedProduct.quantity_box === expectedBoxQty && updatedProduct.quantity_kg === expectedKgQty) {
      logResult('Stock Addition - Verify Update', 'PASS', 'Product quantities updated correctly', {
        original: { boxes: originalBoxQty, kg: originalKgQty },
        updated: { boxes: updatedProduct.quantity_box, kg: updatedProduct.quantity_kg },
        change: { boxes: pendingMovement.box_change, kg: pendingMovement.kg_change }
      });
    } else {
      logResult('Stock Addition - Verify Update', 'FAIL', 'Product quantities not updated correctly');
    }

  } catch (error) {
    logResult('Stock Addition - General Error', 'FAIL', `Unexpected error: ${error}`);
  }
}

async function testProductCreationApproval() {
  console.log('\n🧪 Testing Product Creation Approval Workflow...');
  
  try {
    // Get a test category
    const { data: categories, error: categoryError } = await supabase
      .from('product_categories')
      .select('category_id, name')
      .limit(1);

    if (categoryError || !categories || categories.length === 0) {
      logResult('Product Creation - Get Category', 'FAIL', 'No test category found');
      return;
    }

    const testCategory = categories[0];
    logResult('Product Creation - Get Category', 'PASS', `Found test category: ${testCategory.name}`);

    // Create a pending product creation request
    const productData = {
      name: `Test Product ${Date.now()}`,
      category_id: testCategory.category_id,
      quantity_box: 0,
      box_to_kg_ratio: 20,
      quantity_kg: 0,
      cost_per_box: 120,
      cost_per_kg: 6,
      price_per_box: 180,
      price_per_kg: 9,
      boxed_low_stock_threshold: 3
    };

    const { data: stockMovement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: '00000000-0000-0000-0000-000000000000', // Placeholder for new product
        movement_type: 'product_create',
        box_change: 0,
        kg_change: 0,
        field_changed: 'product_creation',
        old_value: '',
        new_value: JSON.stringify(productData),
        reason: `Product creation request: ${productData.name}`,
        performed_by: '00000000-0000-0000-0000-000000000000', // Test user ID
        status: 'pending'
      })
      .select()
      .single();

    if (movementError) {
      logResult('Product Creation - Create Request', 'FAIL', `Failed to create request: ${movementError.message}`);
      return;
    }

    logResult('Product Creation - Create Request', 'PASS', 'Pending product creation request created', {
      movement_id: stockMovement.movement_id,
      product_name: productData.name
    });

    // Simulate approval by creating the product
    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (createError) {
      logResult('Product Creation - Create Product', 'FAIL', `Failed to create product: ${createError.message}`);
      return;
    }

    // Update movement with actual product_id and mark as completed
    const { error: statusError } = await supabase
      .from('stock_movements')
      .update({
        product_id: newProduct.product_id,
        status: 'completed'
      })
      .eq('movement_id', stockMovement.movement_id);

    if (statusError) {
      logResult('Product Creation - Complete Request', 'FAIL', `Failed to complete request: ${statusError.message}`);
      return;
    }

    logResult('Product Creation - Complete Request', 'PASS', 'Product creation approved and product created successfully', {
      product_id: newProduct.product_id,
      product_name: newProduct.name
    });

  } catch (error) {
    logResult('Product Creation - General Error', 'FAIL', `Unexpected error: ${error}`);
  }
}

async function testStockCorrectionApproval() {
  console.log('\n🧪 Testing Stock Correction Approval Workflow...');
  
  try {
    // Get a test product
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('product_id, name, quantity_box, quantity_kg')
      .limit(1);

    if (productError || !products || products.length === 0) {
      logResult('Stock Correction - Get Product', 'FAIL', 'No test product found');
      return;
    }

    const testProduct = products[0];
    logResult('Stock Correction - Get Product', 'PASS', `Found test product: ${testProduct.name}`);

    // Create a pending stock correction request
    const boxAdjustment = -1;
    const kgAdjustment = 2.5;

    const { data: stockMovement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: testProduct.product_id,
        movement_type: 'stock_correction',
        box_change: boxAdjustment,
        kg_change: kgAdjustment,
        reason: `Stock correction request: Inventory audit discrepancy (Box: ${boxAdjustment >= 0 ? '+' : ''}${boxAdjustment}, KG: ${kgAdjustment >= 0 ? '+' : ''}${kgAdjustment})`,
        performed_by: '00000000-0000-0000-0000-000000000000', // Test user ID
        status: 'pending'
      })
      .select()
      .single();

    if (movementError) {
      logResult('Stock Correction - Create Request', 'FAIL', `Failed to create request: ${movementError.message}`);
      return;
    }

    logResult('Stock Correction - Create Request', 'PASS', 'Pending stock correction request created', {
      movement_id: stockMovement.movement_id,
      adjustments: { boxes: boxAdjustment, kg: kgAdjustment }
    });

    // Simulate approval by updating product quantities
    const originalBoxQty = testProduct.quantity_box;
    const originalKgQty = testProduct.quantity_kg;

    const { error: updateError } = await supabase
      .from('products')
      .update({
        quantity_box: originalBoxQty + boxAdjustment,
        quantity_kg: originalKgQty + kgAdjustment,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', testProduct.product_id);

    if (updateError) {
      logResult('Stock Correction - Update Product', 'FAIL', `Failed to update product: ${updateError.message}`);
      return;
    }

    // Update movement status to completed
    const { error: statusError } = await supabase
      .from('stock_movements')
      .update({ status: 'completed' })
      .eq('movement_id', stockMovement.movement_id);

    if (statusError) {
      logResult('Stock Correction - Complete Request', 'FAIL', `Failed to complete request: ${statusError.message}`);
      return;
    }

    logResult('Stock Correction - Complete Request', 'PASS', 'Stock correction approved and applied successfully');

  } catch (error) {
    logResult('Stock Correction - General Error', 'FAIL', `Unexpected error: ${error}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Approval Workflow Integration Tests...\n');
  
  await testStockAdditionApproval();
  await testProductCreationApproval();
  await testStockCorrectionApproval();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${((passCount / results.length) * 100).toFixed(1)}%`);
  
  if (failCount > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   - ${result.test}: ${result.message}`);
    });
  }
  
  console.log('\n🎯 All tests completed!');
}

// Run the tests
runTests().catch(console.error);
