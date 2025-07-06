-- =====================================================
-- Expenses Table Schema
-- Records financial transactions tied to categories
-- =====================================================

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    expense_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES expense_categories(category_id),
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    added_by UUID NOT NULL REFERENCES users(user_id), -- user_id or worker_id
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('rejected', 'pending', 'paid'))
);

-- Comments for documentation
COMMENT ON TABLE expenses IS 'Records financial transactions tied to categories';
COMMENT ON COLUMN expenses.expense_id IS 'Unique identifier for each expense';
COMMENT ON COLUMN expenses.category_id IS 'Reference to expense category';
COMMENT ON COLUMN expenses.amount IS 'Expense amount';
COMMENT ON COLUMN expenses.date IS 'Date when expense was incurred';
COMMENT ON COLUMN expenses.added_by IS 'User or worker who added the expense';
COMMENT ON COLUMN expenses.status IS 'Expense status (rejected, pending, paid)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_added_by ON expenses(added_by);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

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

-- Function to validate expense amount
CREATE OR REPLACE FUNCTION validate_expense_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure amount is positive
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Expense amount must be positive';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for expense validation
CREATE TRIGGER validate_expense_amount_trigger
    BEFORE INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION validate_expense_amount();

-- Sample data for development
-- Note: These will need actual category_id and user_id values from their respective tables
-- INSERT INTO expenses (category_id, amount, date, added_by, status) VALUES
-- ('category-uuid-here', 150.00, '2024-01-15', 'user-uuid-here', 'paid'),
-- ('category-uuid-here', 75.50, '2024-01-16', 'user-uuid-here', 'pending');
