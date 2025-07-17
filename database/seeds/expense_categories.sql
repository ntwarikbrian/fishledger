-- Seed data for expense categories
-- Provides default expense categories for the application

-- Insert default expense categories
INSERT INTO expense_categories (category_name, description, budget) VALUES
('Office Supplies', 'Stationery, paper, pens, and other office materials', 500.00),
('Fuel & Transportation', 'Vehicle fuel, public transport, and travel expenses', 1000.00),
('Equipment & Tools', 'Hardware, software, and equipment purchases', 2000.00),
('Utilities', 'Electricity, water, internet, and phone bills', 800.00),
('Marketing & Advertising', 'Promotional materials, ads, and marketing campaigns', 1500.00),
('Maintenance & Repairs', 'Building maintenance, equipment repairs, and upkeep', 600.00),
('Professional Services', 'Legal, accounting, consulting, and other professional fees', 1200.00),
('Training & Development', 'Employee training, courses, and skill development', 400.00),
('Insurance', 'Business insurance premiums and coverage', 300.00),
('Miscellaneous', 'Other business expenses not covered by specific categories', 200.00)
ON CONFLICT (category_name) DO NOTHING;
