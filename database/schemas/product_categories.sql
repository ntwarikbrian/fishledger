-- =====================================================
-- Product Categories Table Schema
-- Stores product category data
-- =====================================================

-- Product categories table for organizing products
CREATE TABLE IF NOT EXISTS product_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: categories belong to specific user
    name VARCHAR(100) NOT NULL, -- Removed UNIQUE constraint as names can be same across different users
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure category names are unique per user
    UNIQUE(user_id, name)
);

-- Comments for documentation
COMMENT ON TABLE product_categories IS 'Stores product category data - isolated per user';
COMMENT ON COLUMN product_categories.category_id IS 'Unique identifier for each category';
COMMENT ON COLUMN product_categories.user_id IS 'Reference to user who owns this category - ensures data isolation';
COMMENT ON COLUMN product_categories.name IS 'Category name (e.g., Fresh Fish, Frozen Fish, Shellfish) - unique per user';
COMMENT ON COLUMN product_categories.description IS 'Description of the product category';
COMMENT ON COLUMN product_categories.created_at IS 'Timestamp when category was created';
COMMENT ON COLUMN product_categories.updated_at IS 'Timestamp when category was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_categories_user_id ON product_categories(user_id); -- Critical for data isolation
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);
CREATE INDEX IF NOT EXISTS idx_product_categories_user_name ON product_categories(user_id, name); -- Composite index for user-specific queries

-- Remove RLS policies as we'll handle data isolation through application logic
-- This ensures compatibility with custom JWT authentication

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at timestamp
CREATE TRIGGER update_product_categories_updated_at_trigger
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_product_categories_updated_at();

-- Sample data for development
INSERT INTO product_categories (name, description) VALUES
('Fresh Fish', 'Fresh, never frozen fish products'),
('Frozen Fish', 'Frozen fish products for longer storage'),
('Shellfish', 'Crabs, lobsters, shrimp, and other shellfish'),
('Smoked Fish', 'Smoked and cured fish products'),
('Fish Fillets', 'Pre-cut fish fillets and portions'),
('Whole Fish', 'Whole fish products'),
('Specialty Items', 'Specialty and premium fish products')
ON CONFLICT (name) DO NOTHING;
