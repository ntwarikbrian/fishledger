-- =====================================================
-- Migration: Add Data Isolation to All Tables
-- Description: Adds user_id foreign keys to all business data tables
-- and removes RLS policies in favor of application-level data filtering
-- =====================================================

-- First, update the users table to add missing columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Make business_name unique for data isolation
ALTER TABLE users ADD CONSTRAINT users_business_name_unique UNIQUE (business_name);

-- Make password required (remove NULL constraint)
ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- Add trigger to update updated_at timestamp for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Add user_id to workers table
-- =====================================================
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- Remove unique constraint on email (emails can be same across different businesses)
ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_email_key;

-- Add unique constraint for email per user
ALTER TABLE workers ADD CONSTRAINT workers_user_email_unique UNIQUE (user_id, email);

-- =====================================================
-- Add user_id to product_categories table
-- =====================================================
ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- Remove unique constraint on name (names can be same across different users)
ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_name_key;

-- Add unique constraint for name per user
ALTER TABLE product_categories ADD CONSTRAINT product_categories_user_name_unique UNIQUE (user_id, name);

-- =====================================================
-- Add user_id to products table
-- =====================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- =====================================================
-- Add user_id to sales table
-- =====================================================
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- =====================================================
-- Add user_id to expenses table
-- =====================================================
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- =====================================================
-- Add user_id to expense_categories table
-- =====================================================
ALTER TABLE expense_categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- Remove unique constraint on category_name (names can be same across different users)
ALTER TABLE expense_categories DROP CONSTRAINT IF EXISTS expense_categories_category_name_key;

-- Add unique constraint for category_name per user
ALTER TABLE expense_categories ADD CONSTRAINT expense_categories_user_name_unique UNIQUE (user_id, category_name);

-- =====================================================
-- Add user_id to contacts table
-- =====================================================
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- =====================================================
-- Add user_id to stock_movements table
-- =====================================================
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- =====================================================
-- Add user_id to messages table
-- =====================================================
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id) ON DELETE CASCADE;

-- =====================================================
-- Create indexes for data isolation performance
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Workers table indexes
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);

-- Product categories indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_user_id ON product_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_user_name ON product_categories(user_id, name);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_category ON products(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_user_name ON products(user_id, name);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, date_time);
CREATE INDEX IF NOT EXISTS idx_sales_user_status ON sales(user_id, payment_status);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id);

-- Expense categories indexes
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- =====================================================
-- Remove RLS policies (we'll handle data isolation in application)
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE files DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS workers_select_own ON workers;
DROP POLICY IF EXISTS workers_update_own ON workers;
DROP POLICY IF EXISTS workers_insert_own ON workers;
DROP POLICY IF EXISTS product_categories_select_all ON product_categories;
DROP POLICY IF EXISTS product_categories_insert_owner ON product_categories;
DROP POLICY IF EXISTS product_categories_update_owner ON product_categories;
DROP POLICY IF EXISTS product_categories_delete_owner ON product_categories;
DROP POLICY IF EXISTS products_select_all ON products;
DROP POLICY IF EXISTS products_insert_owner ON products;
DROP POLICY IF EXISTS products_update_owner ON products;
DROP POLICY IF EXISTS products_delete_owner ON products;
DROP POLICY IF EXISTS sales_select_all ON sales;
DROP POLICY IF EXISTS sales_insert_owner ON sales;
DROP POLICY IF EXISTS sales_update_owner ON sales;
DROP POLICY IF EXISTS sales_delete_owner ON sales;
DROP POLICY IF EXISTS expenses_select_all ON expenses;
DROP POLICY IF EXISTS expenses_insert_owner ON expenses;
DROP POLICY IF EXISTS expenses_update_owner ON expenses;
DROP POLICY IF EXISTS expenses_delete_owner ON expenses;
DROP POLICY IF EXISTS expense_categories_select_all ON expense_categories;
DROP POLICY IF EXISTS expense_categories_insert_owner ON expense_categories;
DROP POLICY IF EXISTS expense_categories_update_owner ON expense_categories;
DROP POLICY IF EXISTS expense_categories_delete_owner ON expense_categories;
DROP POLICY IF EXISTS contacts_select_all ON contacts;
DROP POLICY IF EXISTS contacts_insert_owner ON contacts;
DROP POLICY IF EXISTS contacts_update_owner ON contacts;
DROP POLICY IF EXISTS contacts_delete_owner ON contacts;
DROP POLICY IF EXISTS stock_movements_select_all ON stock_movements;
DROP POLICY IF EXISTS stock_movements_insert_owner ON stock_movements;
DROP POLICY IF EXISTS stock_movements_update_owner ON stock_movements;
DROP POLICY IF EXISTS stock_movements_delete_owner ON stock_movements;
DROP POLICY IF EXISTS messages_select_all ON messages;
DROP POLICY IF EXISTS messages_insert_owner ON messages;
DROP POLICY IF EXISTS messages_update_owner ON messages;
DROP POLICY IF EXISTS messages_delete_owner ON messages;
DROP POLICY IF EXISTS files_select_all ON files;
DROP POLICY IF EXISTS files_insert_owner ON files;
DROP POLICY IF EXISTS files_update_owner ON files;
DROP POLICY IF EXISTS files_delete_owner ON files;
DROP POLICY IF EXISTS folders_select_all ON folders;
DROP POLICY IF EXISTS folders_insert_owner ON folders;
DROP POLICY IF EXISTS folders_update_owner ON folders;
DROP POLICY IF EXISTS folders_delete_owner ON folders;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON COLUMN users.is_active IS 'Account status - inactive accounts cannot login';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user record was last updated';

COMMENT ON COLUMN workers.user_id IS 'Reference to user who owns this worker - ensures data isolation';
COMMENT ON COLUMN product_categories.user_id IS 'Reference to user who owns this category - ensures data isolation';
COMMENT ON COLUMN products.user_id IS 'Reference to user who owns this product - ensures data isolation';
COMMENT ON COLUMN sales.user_id IS 'Reference to user who owns this sale - ensures data isolation';
COMMENT ON COLUMN expenses.user_id IS 'Reference to user who owns this expense - ensures data isolation';
COMMENT ON COLUMN expense_categories.user_id IS 'Reference to user who owns this category - ensures data isolation';
COMMENT ON COLUMN contacts.user_id IS 'Reference to user who owns this contact - ensures data isolation';
COMMENT ON COLUMN stock_movements.user_id IS 'Reference to user who owns this movement - ensures data isolation';
COMMENT ON COLUMN messages.user_id IS 'Reference to user who owns this message - ensures data isolation';
