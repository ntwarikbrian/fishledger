/**
 * Test script for the Fish Sales Algorithm
 * Tests the new kg-priority sales logic without changing the database schema
 */

// Simple test framework for our algorithm
function describe(name: string, fn: () => void) {
  console.log(`\n📋 ${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain: (expected: any) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`);
      }
    },
    toThrow: (expectedMessage?: string) => {
      try {
        actual();
        throw new Error('Expected function to throw');
      } catch (error) {
        if (expectedMessage && !error.message.includes(expectedMessage)) {
          throw new Error(`Expected error message to contain "${expectedMessage}", got "${error.message}"`);
        }
      }
    }
  };
}

// Mock product data for testing
const mockProduct = {
  product_id: 'test-product-123',
  name: 'Atlantic Salmon',
  quantity_box: 10, // 10 boxes in stock
  quantity_kg: 15.5, // 15.5 kg loose stock
  box_to_kg_ratio: 10, // 1 box = 10 kg
  price_per_box: 25.99,
  price_per_kg: 2.60
};

/**
 * Fish Sales Algorithm Implementation (for testing)
 * This mirrors the logic in the sales handler
 */
function fishSalesAlgorithm(product: typeof mockProduct, requestedKg: number) {
  let availableKg = parseFloat(product.quantity_kg.toString());
  let availableBoxes = parseInt(product.quantity_box.toString());
  const boxToKgRatio = parseFloat(product.box_to_kg_ratio.toString());

  let neededKg = parseFloat(requestedKg.toString());
  let usedKg = 0;
  let usedBoxes = 0;
  const steps: string[] = [];

  // Step 1: Use kg stock first
  if (availableKg >= neededKg) {
    usedKg = neededKg;
    availableKg -= neededKg;
    neededKg = 0;
    steps.push(`Used ${usedKg}kg from loose stock`);
  } else {
    usedKg = availableKg;
    neededKg -= availableKg;
    availableKg = 0;
    if (usedKg > 0) {
      steps.push(`Used ${usedKg}kg from loose stock`);
    }
  }

  // Step 2: Convert boxes to kg if needed
  if (neededKg > 0) {
    const boxesNeeded = Math.ceil(neededKg / boxToKgRatio);
    
    if (availableBoxes >= boxesNeeded) {
      usedBoxes = boxesNeeded;
      availableBoxes -= boxesNeeded;
      
      const kgFromBoxes = boxesNeeded * boxToKgRatio;
      usedKg += kgFromBoxes;
      
      const excessKg = kgFromBoxes - neededKg;
      if (excessKg > 0) {
        availableKg += excessKg;
        steps.push(`Converted ${boxesNeeded} box(es) to ${kgFromBoxes}kg, used ${neededKg}kg, added ${excessKg.toFixed(2)}kg back to loose stock`);
      } else {
        steps.push(`Converted ${boxesNeeded} box(es) to ${kgFromBoxes}kg`);
      }
      
      neededKg = 0;
    } else {
      // Not enough stock
      const totalAvailable = availableKg + (availableBoxes * boxToKgRatio);
      throw new Error(`Not enough stock: need ${requestedKg}kg, have ${totalAvailable}kg available`);
    }
  }

  // Calculate pricing
  const totalAmount = parseFloat(requestedKg.toString()) * product.price_per_kg;

  return {
    success: true,
    soldKg: parseFloat(requestedKg.toString()),
    usedBoxes,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    finalStock: {
      boxes: availableBoxes,
      kg: parseFloat(availableKg.toFixed(2))
    },
    steps
  };
}

describe('Fish Sales Algorithm Tests', () => {
  
  it('should sell from kg stock when sufficient kg available', () => {
    const result = fishSalesAlgorithm(mockProduct, 10);
    
    expect(result.success).toBe(true);
    expect(result.soldKg).toBe(10);
    expect(result.usedBoxes).toBe(0);
    expect(result.totalAmount).toBe(26.00); // 10 * 2.60
    expect(result.finalStock.kg).toBe(5.5); // 15.5 - 10
    expect(result.finalStock.boxes).toBe(10); // No boxes used
    expect(result.steps).toContain('Used 10kg from loose stock');
  });

  it('should convert boxes when kg stock insufficient', () => {
    const result = fishSalesAlgorithm(mockProduct, 20);
    
    expect(result.success).toBe(true);
    expect(result.soldKg).toBe(20);
    expect(result.usedBoxes).toBe(1); // Need 1 box to get additional 10kg
    expect(result.totalAmount).toBe(52.00); // 20 * 2.60
    expect(result.finalStock.kg).toBe(5.5); // 15.5 used + 10 from box - 4.5 needed = 5.5 remaining
    expect(result.finalStock.boxes).toBe(9); // 10 - 1 = 9
    expect(result.steps).toContain('Used 15.5kg from loose stock');
    expect(result.steps.some(step => step.includes('Converted 1 box'))).toBe(true);
  });

  it('should handle exact box conversion', () => {
    const result = fishSalesAlgorithm(mockProduct, 25.5);
    
    expect(result.success).toBe(true);
    expect(result.soldKg).toBe(25.5);
    expect(result.usedBoxes).toBe(1); // Need 1 box for the extra 10kg
    expect(result.finalStock.kg).toBe(0); // 15.5 + 10 - 25.5 = 0
    expect(result.finalStock.boxes).toBe(9);
  });

  it('should handle multiple box conversion', () => {
    const result = fishSalesAlgorithm(mockProduct, 50);
    
    expect(result.success).toBe(true);
    expect(result.soldKg).toBe(50);
    expect(result.usedBoxes).toBe(4); // Need 4 boxes for 40kg (15.5 + 34.5)
    expect(result.finalStock.kg).toBe(0); // 15.5 + 40 - 50 = 5.5 remaining, but we used all loose stock
    expect(result.finalStock.boxes).toBe(6); // 10 - 4 = 6
  });

  it('should throw error when insufficient total stock', () => {
    // Total available: 15.5kg + (10 boxes * 10kg) = 115.5kg
    expect(() => {
      fishSalesAlgorithm(mockProduct, 120);
    }).toThrow('Not enough stock');
  });

  it('should handle small kg requests efficiently', () => {
    const result = fishSalesAlgorithm(mockProduct, 0.5);
    
    expect(result.success).toBe(true);
    expect(result.soldKg).toBe(0.5);
    expect(result.usedBoxes).toBe(0);
    expect(result.finalStock.kg).toBe(15); // 15.5 - 0.5
    expect(result.finalStock.boxes).toBe(10);
  });

  it('should calculate correct pricing for kg sales', () => {
    const result = fishSalesAlgorithm(mockProduct, 7.5);
    
    expect(result.totalAmount).toBe(19.50); // 7.5 * 2.60 = 19.50
  });

  it('should handle edge case: exactly use all loose stock', () => {
    const result = fishSalesAlgorithm(mockProduct, 15.5);
    
    expect(result.success).toBe(true);
    expect(result.soldKg).toBe(15.5);
    expect(result.usedBoxes).toBe(0);
    expect(result.finalStock.kg).toBe(0);
    expect(result.finalStock.boxes).toBe(10);
  });

  it('should handle edge case: need partial box conversion', () => {
    const result = fishSalesAlgorithm(mockProduct, 18);
    
    expect(result.success).toBe(true);
    expect(result.soldKg).toBe(18);
    expect(result.usedBoxes).toBe(1); // Need 1 box for 2.5kg more
    expect(result.finalStock.kg).toBe(7.5); // 15.5 used + 10 from box - 2.5 needed = 7.5 remaining
    expect(result.finalStock.boxes).toBe(9);
  });

});

// Run the tests if this file is executed directly
if (import.meta.main) {
  console.log('🐟 Running Fish Sales Algorithm Tests...');
  
  // Test case 1: Simple kg sale
  console.log('\n📊 Test 1: Simple kg sale (10kg)');
  try {
    const result1 = fishSalesAlgorithm(mockProduct, 10);
    console.log('✅ Success:', result1);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test case 2: Box conversion needed
  console.log('\n📊 Test 2: Box conversion needed (20kg)');
  try {
    const result2 = fishSalesAlgorithm(mockProduct, 20);
    console.log('✅ Success:', result2);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test case 3: Insufficient stock
  console.log('\n📊 Test 3: Insufficient stock (120kg)');
  try {
    const result3 = fishSalesAlgorithm(mockProduct, 120);
    console.log('✅ Success:', result3);
  } catch (error) {
    console.log('❌ Expected Error:', error.message);
  }

  console.log('\n🎯 Fish Sales Algorithm Tests Complete!');
}
