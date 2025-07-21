-- =====================================================
-- Expense Categories Table Schema
-- Defines available expense classifications
-- =====================================================

-- Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: categories belong to specific user
    category_name VARCHAR(100) NOT NULL, -- Removed UNIQUE constraint as names can be same across different users
    description TEXT,
    budget DECIMAL(12,2) DEFAULT 0, -- Budget allocation for this category

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure category names are unique per user
    UNIQUE(user_id, category_name)
);

-- Comments for documentation
COMMENT ON TABLE expense_categories IS 'Defines available expense classifications';
COMMENT ON COLUMN expense_categories.category_id IS 'Unique identifier for each category';
COMMENT ON COLUMN expense_categories.category_name IS 'Category name (e.g., Office Supplies, Fuel, Equipment)';
COMMENT ON COLUMN expense_categories.description IS 'Description of what expenses belong in this category';
COMMENT ON COLUMN expense_categories.budget IS 'Budget allocation for this category';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(category_name);

-- Row Level Security (RLS) policies
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all categories
CREATE POLICY expense_categories_select_all ON expense_categories
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert categories
CREATE POLICY expense_categories_insert_owner ON expense_categories
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update categories
CREATE POLICY expense_categories_update_owner ON expense_categories
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete categories
CREATE POLICY expense_categories_delete_owner ON expense_categories
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Sample data for development
INSERT INTO expense_categories (category_name, description, budget) VALUES
('Transportation', 'Vehicle fuel, maintenance, delivery costs', 5000.00),
('Equipment', 'Fishing equipment, processing tools, storage equipment', 10000.00),
('Supplies', 'Packaging materials, ice, cleaning supplies', 3000.00),
('Utilities', 'Electricity, water, internet, phone bills', 2000.00),
('Marketing', 'Advertising, promotional materials, website costs', 1500.00),
('Staff', 'Salaries, benefits, training costs', 25000.00),
('Maintenance', 'Facility maintenance, equipment repairs', 4000.00),
('Fish Purchase', 'Cost of purchasing fish from suppliers', 50000.00),
('Storage', 'Cold storage, freezer costs, warehouse rent', 8000.00),
('Miscellaneous', 'Other business-related expenses', 2000.00)
ON CONFLICT (category_name) DO NOTHING;
