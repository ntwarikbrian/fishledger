const { supabaseClient } = require('../dist/config/supabase-client');

async function addReceiptUrlColumn() {
  try {
    console.log('🔄 Adding receipt_url column to expenses table...');
    
    // First, try to add the column
    const { error: addColumnError } = await supabaseClient
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;' 
      });
    
    if (addColumnError) {
      console.error('❌ Error adding column:', addColumnError);
      // Try alternative approach - direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      // Use a simple query to check if column exists
      const { data, error } = await supabaseClient
        .from('expenses')
        .select('receipt_url')
        .limit(1);
      
      if (error && error.message.includes('receipt_url')) {
        console.log('✅ Column receipt_url does not exist, needs to be added manually');
        console.log('📝 Please run this SQL in your Supabase SQL editor:');
        console.log('');
        console.log('ALTER TABLE expenses ADD COLUMN receipt_url TEXT;');
        console.log('COMMENT ON COLUMN expenses.receipt_url IS \'URL to uploaded receipt image or document\';');
        console.log('');
        return false;
      } else {
        console.log('✅ Column receipt_url already exists or was added successfully');
        return true;
      }
    }
    
    console.log('✅ Column added successfully');
    
    // Add comment
    const { error: commentError } = await supabaseClient
      .rpc('exec_sql', { 
        sql: "COMMENT ON COLUMN expenses.receipt_url IS 'URL to uploaded receipt image or document';" 
      });
    
    if (commentError) {
      console.log('⚠️  Warning: Could not add column comment:', commentError.message);
    } else {
      console.log('✅ Column comment added successfully');
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    return false;
  }
}

// Run the migration
addReceiptUrlColumn()
  .then((success) => {
    if (success) {
      console.log('🎉 Migration completed successfully!');
      console.log('🔄 Please restart your server to refresh the schema cache.');
    } else {
      console.log('⚠️  Manual intervention required. See instructions above.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('💀 Migration failed:', error);
    process.exit(1);
  });
