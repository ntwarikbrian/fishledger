-- =====================================================
-- Expenses Table Schema
-- Records financial transactions tied to categories
-- =====================================================

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    expense_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Data isolation: expenses belong to specific user
    title VARCHAR(255) NOT NULL, -- Title/name of the expense
    category_id UUID NOT NULL REFERENCES expense_categories(category_id),
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    added_by UUID NOT NULL REFERENCES users(user_id), -- user_id or worker_id who added the expense
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    receipt_url TEXT, -- URL to uploaded receipt image/document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE expenses IS 'Records financial transactions tied to categories - isolated per user';
COMMENT ON COLUMN expenses.expense_id IS 'Unique identifier for each expense';
COMMENT ON COLUMN expenses.user_id IS 'Reference to user who owns this expense - ensures data isolation';
COMMENT ON COLUMN expenses.title IS 'Title/name of the expense';
COMMENT ON COLUMN expenses.category_id IS 'Reference to expense category';
COMMENT ON COLUMN expenses.amount IS 'Expense amount';
COMMENT ON COLUMN expenses.date IS 'Date when expense was incurred';
COMMENT ON COLUMN expenses.added_by IS 'User or worker who added the expense';
COMMENT ON COLUMN expenses.status IS 'Expense status (pending, paid)';
COMMENT ON COLUMN expenses.receipt_url IS 'URL to uploaded receipt image or document';
COMMENT ON COLUMN expenses.created_at IS 'Timestamp when expense was created';
COMMENT ON COLUMN expenses.updated_at IS 'Timestamp when expense was last updated';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id); -- Critical for data isolation
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_added_by ON expenses(added_by);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_title ON expenses(title);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Composite indexes for user-specific queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id);

-- Row Level Security (RLS) policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all expenses
CREATE POLICY expenses_select_all ON expenses
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert expenses
CREATE POLICY expenses_insert_owner ON expenses
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update expenses
CREATE POLICY expenses_update_owner ON expenses
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete expenses
CREATE POLICY expenses_delete_owner ON expenses
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Function to validate expense data
CREATE OR REPLACE FUNCTION validate_expense_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure amount is positive
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Expense amount must be positive';
    END IF;

    -- Ensure title is not empty
    IF NEW.title IS NULL OR TRIM(NEW.title) = '' THEN
        RAISE EXCEPTION 'Expense title cannot be empty';
    END IF;

    -- Update the updated_at timestamp
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for expense validation
CREATE TRIGGER validate_expense_data_trigger
    BEFORE INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION validate_expense_data();

-- Sample data for development
-- Note: These will need actual category_id and user_id values from their respective tables
-- INSERT INTO expenses (title, category_id, amount, date, added_by, status) VALUES
-- ('Office Supplies', 'category-uuid-here', 150.00, '2024-01-15', 'user-uuid-here', 'paid'),
-- ('Internet Bill', 'category-uuid-here', 75.50, '2024-01-16', 'user-uuid-here', 'pending');
