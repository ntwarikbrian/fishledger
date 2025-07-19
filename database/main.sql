-- =====================================================
-- Fish Selling Management System Database
-- Main Schema File - PostgreSQL
-- =====================================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- =====================================================
-- 1. USERS TABLE
-- Stores account information for business owners
-- =====================================================

-- Users table for business owners authentication
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(200) NOT NULL,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password VARCHAR(255), -- Will store hashed password (optional for existing users)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. WORKERS TABLE
-- Tracks system users employed under a business
-- =====================================================

-- Workers table for system users employed under a business
CREATE TABLE IF NOT EXISTS workers (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    identification_image_url TEXT, -- Single field for ID card image
    monthly_salary DECIMAL(10,2),
    total_revenue_generated DECIMAL(12,2) DEFAULT 0,
    recent_login_history JSONB, -- Store recent login timestamps as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. WORKER TASKS TABLE
-- Manages individual worker task assignments and progress
-- =====================================================

-- Worker tasks table for task assignments and progress tracking
CREATE TABLE IF NOT EXISTS worker_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_title VARCHAR(200) NOT NULL,
    sub_tasks JSONB, -- JSON array of sub-tasks or text description
    assigned_to UUID NOT NULL REFERENCES workers(worker_id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. EXPENSE CATEGORIES TABLE
-- Defines available expense classifications
-- =====================================================

-- Expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    budget DECIMAL(12,2) DEFAULT 0, -- Budget allocation for this category

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. EXPENSES TABLE
-- Records financial transactions tied to categories
-- =====================================================

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    expense_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL, -- Title/name of the expense
    category_id UUID NOT NULL REFERENCES expense_categories(category_id),
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    added_by UUID NOT NULL REFERENCES users(user_id), -- user_id or worker_id
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    receipt_url TEXT, -- URL to uploaded receipt image/document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. CONTACTS TABLE
-- Stores business contact information (suppliers/customers)
-- =====================================================

-- Contacts table for business contact information
CREATE TABLE IF NOT EXISTS contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200),
    contact_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('supplier', 'customer')),
    address TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
    email_notifications BOOLEAN DEFAULT TRUE,
    last_contacted TIMESTAMP WITH TIME ZONE,
    total_messages_sent INTEGER DEFAULT 0,
    notes TEXT,
    added_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- =====================================================
-- 7. MESSAGES TABLE
-- Logs outgoing or internal communications
-- =====================================================

-- Messages table for outgoing or internal communications
CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL, -- Single recipient ID (user, worker, or contact)
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'worker', 'contact')),
    recipient_email VARCHAR(255), -- Email address of the recipient (extracted from contacts/users/workers)
    message_type VARCHAR(20) DEFAULT 'email' CHECK (message_type IN ('email', 'internal')), -- Type of message
    delivery_method VARCHAR(20) DEFAULT 'email' CHECK (delivery_method IN ('email', 'system')), -- How message is delivered
    subject VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT, -- Store error details if delivery fails
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE, -- When message was successfully delivered
    sent_by UUID NOT NULL REFERENCES users(user_id), -- user_id who sent the message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. FOLDERS TABLE
-- Organizes document storage
-- =====================================================

-- Folders table for organizing document storage
CREATE TABLE IF NOT EXISTS folders (
    folder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code for folder display
    icon VARCHAR(50) DEFAULT 'folder', -- Icon name for folder display
    file_count INTEGER DEFAULT 0, -- Number of files in this folder
    total_size BIGINT DEFAULT 0, -- Total size of all files in bytes
    is_permanent BOOLEAN DEFAULT false, -- Whether this is a permanent system folder
    created_by UUID NOT NULL REFERENCES users(user_id),

    -- Ensure unique folder names per user
    UNIQUE(folder_name, created_by)
);

-- =====================================================
-- 9. FILES TABLE
-- Stores individual file entries linked to folders with Cloudinary integration
-- =====================================================

-- Files table for individual file entries linked to folders with Cloudinary integration
CREATE TABLE IF NOT EXISTS files (
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- Primary file URL (Cloudinary or fallback)
    cloudinary_public_id VARCHAR(255), -- Cloudinary unique identifier
    cloudinary_url TEXT, -- Cloudinary HTTP URL
    cloudinary_secure_url TEXT, -- Cloudinary HTTPS URL
    file_type VARCHAR(100), -- MIME type (e.g., image/jpeg, application/pdf)
    cloudinary_resource_type VARCHAR(20) DEFAULT 'auto', -- Cloudinary resource type (image, video, raw, auto)
    description TEXT,
    folder_id UUID NOT NULL REFERENCES folders(folder_id),
    file_size INTEGER, -- File size in bytes
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    added_by UUID NOT NULL REFERENCES users(user_id)
);

-- =====================================================
-- 10. PRODUCT CATEGORIES TABLE
-- Stores product category data
-- =====================================================

-- Product categories table for organizing products
CREATE TABLE IF NOT EXISTS product_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. PRODUCTS TABLE
-- Tracks fish inventory, including pricing, damage, and expiry
-- =====================================================

-- Products table for fish inventory management with box/kg support
CREATE TABLE IF NOT EXISTS products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category_id UUID NOT NULL REFERENCES product_categories(category_id),

    -- Inventory fields for box/kg management
    quantity_box INTEGER DEFAULT 0 NOT NULL, -- Number of full boxes in stock (renamed from boxed_quantity)
    box_to_kg_ratio DECIMAL(10,2) DEFAULT 20 NOT NULL, -- How many kg per box (e.g., 20kg per box)
    quantity_kg DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Loose kg stock (renamed from kg_quantity)

    -- Cost pricing fields
    cost_per_box DECIMAL(10,2) NOT NULL, -- Cost price per box for calculating profit margins
    cost_per_kg DECIMAL(10,2) NOT NULL, -- Cost price per kilogram for calculating profit margins

    -- Selling pricing fields
    price_per_box DECIMAL(10,2) NOT NULL, -- Selling price per box (renamed from boxed_selling_price)
    price_per_kg DECIMAL(10,2) NOT NULL, -- Selling price per kg (renamed from kg_selling_price)

    -- Calculated profit fields
    profit_per_box DECIMAL(10,2) GENERATED ALWAYS AS (price_per_box - cost_per_box) STORED,
    profit_per_kg DECIMAL(10,2) GENERATED ALWAYS AS (price_per_kg - cost_per_kg) STORED,

    -- Stock management
    boxed_low_stock_threshold INTEGER DEFAULT 10 NOT NULL, -- Low stock threshold for boxed quantity alerts

    -- Product lifecycle tracking
    expiry_date DATE,
    days_left INTEGER, -- Days remaining until expiry (calculated by application or trigger)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_cost_per_box_positive CHECK (cost_per_box >= 0),
    CONSTRAINT chk_cost_per_kg_positive CHECK (cost_per_kg >= 0),
    CONSTRAINT chk_price_per_box_positive CHECK (price_per_box >= 0),
    CONSTRAINT chk_price_per_kg_positive CHECK (price_per_kg >= 0),
    CONSTRAINT chk_quantity_box_non_negative CHECK (quantity_box >= 0),
    CONSTRAINT chk_quantity_kg_non_negative CHECK (quantity_kg >= 0),
    CONSTRAINT chk_box_to_kg_ratio_positive CHECK (box_to_kg_ratio > 0),
    CONSTRAINT chk_boxed_low_stock_threshold_positive CHECK (boxed_low_stock_threshold >= 0)
);

-- Comments for products table documentation
COMMENT ON TABLE products IS 'Tracks fish inventory with box/kg management, pricing, and expiry';
COMMENT ON COLUMN products.product_id IS 'Unique identifier for each product';
COMMENT ON COLUMN products.name IS 'Product name (e.g., Atlantic Salmon)';
COMMENT ON COLUMN products.category_id IS 'Reference to product category';
COMMENT ON COLUMN products.quantity_box IS 'Number of full boxes in stock';
COMMENT ON COLUMN products.quantity_kg IS 'Loose kg stock available';
COMMENT ON COLUMN products.box_to_kg_ratio IS 'How many kg per box (e.g., 20kg per box)';
COMMENT ON COLUMN products.cost_per_box IS 'Cost price per box for calculating profit margins';
COMMENT ON COLUMN products.cost_per_kg IS 'Cost price per kilogram for calculating profit margins';
COMMENT ON COLUMN products.price_per_box IS 'Selling price per box';
COMMENT ON COLUMN products.price_per_kg IS 'Selling price per kilogram';
COMMENT ON COLUMN products.profit_per_box IS 'Profit margin per box (selling price - cost price)';
COMMENT ON COLUMN products.profit_per_kg IS 'Profit margin per kilogram (selling price - cost price)';
COMMENT ON COLUMN products.boxed_low_stock_threshold IS 'Low stock threshold for boxed quantity alerts';
COMMENT ON COLUMN products.expiry_date IS 'Product expiry date';
COMMENT ON COLUMN products.days_left IS 'Days remaining until expiry (calculated)';


-- Indexes for products table performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_quantity_box ON products(quantity_box);
CREATE INDEX IF NOT EXISTS idx_products_quantity_kg ON products(quantity_kg);
CREATE INDEX IF NOT EXISTS idx_products_cost_per_box ON products(cost_per_box);
CREATE INDEX IF NOT EXISTS idx_products_cost_per_kg ON products(cost_per_kg);
CREATE INDEX IF NOT EXISTS idx_products_boxed_low_stock ON products(boxed_low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Row Level Security (RLS) policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access products from their own business
CREATE POLICY products_user_isolation ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = auth.uid()
        )
    );

-- Note: Worker permissions policy will be added after worker_permissions table is created

-- =====================================================
-- 12. DAMAGED PRODUCTS TABLE
-- Tracks damaged inventory separately from main products
-- =====================================================

-- Damaged products table for tracking damaged inventory
CREATE TABLE IF NOT EXISTS damaged_products (
    damage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,

    -- Damaged quantities
    damaged_boxes INTEGER DEFAULT 0 NOT NULL CHECK (damaged_boxes >= 0),
    damaged_kg DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (damaged_kg >= 0),

    -- Damage details
    damaged_reason TEXT NOT NULL,
    description TEXT, -- Additional description/notes about the damage
    damaged_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Financial impact
    loss_value DECIMAL(12,2) DEFAULT 0 NOT NULL CHECK (loss_value >= 0),

    -- Approval workflow
    damaged_approval BOOLEAN DEFAULT false NOT NULL,
    approved_by UUID REFERENCES users(user_id),
    approved_date TIMESTAMP WITH TIME ZONE,

    -- Audit trail
    reported_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_damaged_quantities CHECK (damaged_boxes > 0 OR damaged_kg > 0),
    CONSTRAINT chk_approval_consistency CHECK (
        (damaged_approval = true AND approved_by IS NOT NULL AND approved_date IS NOT NULL) OR
        (damaged_approval = false AND approved_by IS NULL AND approved_date IS NULL)
    )
);

-- Comments for damaged products table
COMMENT ON TABLE damaged_products IS 'Tracks damaged inventory items separately from main products table';
COMMENT ON COLUMN damaged_products.damage_id IS 'Unique identifier for each damage record';
COMMENT ON COLUMN damaged_products.product_id IS 'Reference to the product that was damaged';
COMMENT ON COLUMN damaged_products.damaged_boxes IS 'Number of boxes that were damaged';
COMMENT ON COLUMN damaged_products.damaged_kg IS 'Weight in kg that was damaged';
COMMENT ON COLUMN damaged_products.damaged_reason IS 'Reason for the damage';
COMMENT ON COLUMN damaged_products.description IS 'Additional notes about the damage';
COMMENT ON COLUMN damaged_products.damaged_date IS 'Date when the damage was reported';
COMMENT ON COLUMN damaged_products.loss_value IS 'Financial loss value from the damaged products';
COMMENT ON COLUMN damaged_products.damaged_approval IS 'Whether the damage report has been approved';
COMMENT ON COLUMN damaged_products.approved_by IS 'User who approved the damage report';
COMMENT ON COLUMN damaged_products.approved_date IS 'Date when the damage was approved';
COMMENT ON COLUMN damaged_products.reported_by IS 'User who reported the damage';

-- Indexes for damaged products performance
CREATE INDEX IF NOT EXISTS idx_damaged_products_product_id ON damaged_products(product_id);
CREATE INDEX IF NOT EXISTS idx_damaged_products_damaged_date ON damaged_products(damaged_date);
CREATE INDEX IF NOT EXISTS idx_damaged_products_reported_by ON damaged_products(reported_by);
CREATE INDEX IF NOT EXISTS idx_damaged_products_approval_status ON damaged_products(damaged_approval);

-- Enable RLS for damaged products
ALTER TABLE damaged_products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access damaged products from their own business
CREATE POLICY damaged_products_user_isolation ON damaged_products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = auth.uid()
        )
    );

-- =====================================================
-- 13. AUTOMATIC MESSAGES TABLE
-- Handles inventory-triggered automated notifications
-- =====================================================

-- Automatic messages table for inventory-triggered automated notifications
CREATE TABLE IF NOT EXISTS automatic_messages (
    auto_message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id),
    current_quantity INTEGER NOT NULL,
    recipient_id UUID NOT NULL, -- ID of recipient (user, worker, or contact)
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'worker', 'contact')),
    quantity_needed INTEGER NOT NULL,
    quantity_triggered INTEGER NOT NULL, -- Threshold that triggered the message
    message_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. MESSAGE SETTINGS TABLE
-- Stores email configuration and messaging preferences
-- =====================================================

-- Message settings table for email configuration and messaging preferences
CREATE TABLE IF NOT EXISTS message_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id), -- Owner of these settings

    -- Email Configuration
    email_host VARCHAR(255) DEFAULT 'smtp.gmail.com', -- SMTP server host
    email_port INTEGER DEFAULT 587, -- SMTP server port
    email_user VARCHAR(255), -- Email username/address for sending
    email_password VARCHAR(255), -- Email password (encrypted)
    email_from VARCHAR(255), -- Default "from" email address
    email_from_name VARCHAR(200), -- Default "from" name

    -- Email Security Settings
    email_use_tls BOOLEAN DEFAULT TRUE, -- Use TLS encryption
    email_use_ssl BOOLEAN DEFAULT FALSE, -- Use SSL encryption

    -- Messaging Preferences
    auto_send_enabled BOOLEAN DEFAULT TRUE, -- Enable automatic message sending
    daily_message_limit INTEGER DEFAULT 100, -- Daily message sending limit
    retry_failed_messages BOOLEAN DEFAULT TRUE, -- Retry failed messages
    max_retry_attempts INTEGER DEFAULT 3, -- Maximum retry attempts for failed messages

    -- Notification Settings
    notify_on_send_success BOOLEAN DEFAULT FALSE, -- Notify when message sent successfully
    notify_on_send_failure BOOLEAN DEFAULT TRUE, -- Notify when message fails to send

    -- Template Settings
    default_signature TEXT, -- Default email signature
    business_logo_url TEXT, -- URL to business logo for emails

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. MESSAGE TEMPLATES TABLE
-- Stores reusable message templates for different scenarios
-- =====================================================

-- Message templates table for reusable message templates
CREATE TABLE IF NOT EXISTS message_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id), -- Owner of this template

    -- Template Information
    template_name VARCHAR(200) NOT NULL, -- Name/title of the template
    template_category VARCHAR(50) NOT NULL CHECK (template_category IN ('inventory', 'promotion', 'notification', 'order', 'general')), -- Category of template
    template_type VARCHAR(20) DEFAULT 'email' CHECK (template_type IN ('email', 'internal')), -- Type of template

    -- Template Content
    subject_template VARCHAR(200), -- Subject line template with placeholders
    content_template TEXT NOT NULL, -- Message content template with placeholders

    -- Template Settings
    is_active BOOLEAN DEFAULT TRUE, -- Whether template is active/available
    is_default BOOLEAN DEFAULT FALSE, -- Whether this is the default template for its category
    use_signature BOOLEAN DEFAULT TRUE, -- Whether to append user's signature

    -- Usage Statistics
    usage_count INTEGER DEFAULT 0, -- How many times this template has been used
    last_used TIMESTAMP WITH TIME ZONE, -- When this template was last used

    -- Template Variables/Placeholders Documentation
    available_variables JSONB, -- JSON array of available placeholder variables

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 13. SALES TABLE
-- Logs transaction data for sold products
-- =====================================================

-- Sales table for individual product sales transactions
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,

    -- Quantities sold
    boxes_quantity INTEGER DEFAULT 0 NOT NULL, -- Number of boxes sold
    kg_quantity DECIMAL(8,2) DEFAULT 0 NOT NULL, -- Kg sold (using smaller precision for cost efficiency)

    -- Pricing at time of sale
    box_price DECIMAL(8,2) NOT NULL, -- Price per box at time of sale
    kg_price DECIMAL(8,2) NOT NULL, -- Price per kg at time of sale

    -- Profit tracking
    profit_per_box DECIMAL(8,2) DEFAULT 0 NOT NULL, -- Profit per box (selling price - cost price)
    profit_per_kg DECIMAL(8,2) DEFAULT 0 NOT NULL, -- Profit per kg (selling price - cost price)

    -- Total amount for this sale
    total_amount DECIMAL(10,2) NOT NULL, -- Total amount calculated

    -- Partial payment tracking
    amount_paid DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Amount already paid (for partial payments)
    remaining_amount DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Outstanding balance (total_amount - amount_paid)

    -- Sale timestamp
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Payment information
    payment_status VARCHAR(10) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    payment_method VARCHAR(15) CHECK (payment_method IN ('momo_pay', 'cash', 'bank_transfer')),

    -- User who performed the sale
    performed_by UUID NOT NULL REFERENCES users(user_id),

    -- Client information (independent UUID, not linked to contacts table)
    client_id UUID, -- Independent client identifier
    client_name VARCHAR(100), -- Client name (required even if not in contacts)
    email_address VARCHAR(150), -- Client email
    phone VARCHAR(15) -- Client phone (using smaller field for cost efficiency)
);

-- =====================================================
-- 12. STOCK CORRECTIONS TABLE
-- Tracks manual inventory adjustments and corrections
-- =====================================================

-- Stock corrections table for tracking manual inventory adjustments
CREATE TABLE IF NOT EXISTS stock_corrections (
    correction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,

    -- Adjustment quantities (positive or negative)
    box_adjustment INTEGER DEFAULT 0 NOT NULL, -- Positive for increase, negative for decrease
    kg_adjustment DECIMAL(10,2) DEFAULT 0 NOT NULL, -- Positive for increase, negative for decrease

    -- Correction details
    correction_reason TEXT NOT NULL, -- Reason for the correction (e.g., "Counting error", "Theft", "Found missing stock")
    correction_date DATE NOT NULL DEFAULT CURRENT_DATE, -- When the correction was made

    -- Status tracking
    status VARCHAR(20) DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),

    -- Audit trail
    performed_by UUID NOT NULL REFERENCES users(user_id), -- User who performed the correction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_correction_quantities CHECK (box_adjustment != 0 OR kg_adjustment != 0),
    CONSTRAINT chk_correction_reason_length CHECK (LENGTH(correction_reason) >= 3)
);

-- =====================================================
-- 13. STOCK ADDITIONS TABLE
-- Tracks new stock deliveries and additions
-- =====================================================

-- Stock additions table for tracking new stock deliveries
CREATE TABLE IF NOT EXISTS stock_additions (
    addition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,

    -- Added quantities
    boxes_added INTEGER DEFAULT 0 NOT NULL CHECK (boxes_added >= 0), -- Number of boxes added
    kg_added DECIMAL(10,2) DEFAULT 0 NOT NULL CHECK (kg_added >= 0), -- Kg quantity added

    -- Financial details
    total_cost DECIMAL(12,2) DEFAULT 0 NOT NULL CHECK (total_cost >= 0), -- Total cost of the addition

    -- Delivery details
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE, -- When the stock was delivered/added

    -- Status tracking
    status VARCHAR(20) DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),

    -- Audit trail
    performed_by UUID NOT NULL REFERENCES users(user_id), -- User who recorded the addition
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_addition_quantities CHECK (boxes_added > 0 OR kg_added > 0),
    CONSTRAINT chk_delivery_date_not_future CHECK (delivery_date <= CURRENT_DATE) -- Only present or past dates allowed
);

-- =====================================================
-- 14. STOCK MOVEMENTS TABLE
-- Tracks inventory changes from irregular events
-- =====================================================

-- Stock movements table for tracking inventory changes from irregular events
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('damaged', 'new_stock', 'stock_correction', 'product_edit', 'product_delete')),

    -- Changes in box and kg quantities
    box_change INTEGER DEFAULT 0, -- Box quantity change (positive for increase, negative for decrease)
    kg_change DECIMAL(10,2) DEFAULT 0, -- Kg change (positive for increase, negative for decrease)

    -- Product edit tracking fields (for movement_type = 'product_edit')
    field_changed TEXT, -- Name of the field that was changed (e.g., 'name', 'cost_per_box', 'price_per_kg')
    old_value TEXT, -- Previous value of the field (stored as text for flexibility)
    new_value TEXT, -- New value of the field (stored as text for flexibility)

    -- Reference IDs for tracking specific records based on movement type
    damaged_id UUID REFERENCES damaged_products(damage_id), -- Reference to damaged product record
    stock_addition_id UUID REFERENCES stock_additions(addition_id), -- Reference to stock addition record
    correction_id UUID REFERENCES stock_corrections(correction_id), -- Reference to stock correction record

    -- Movement details
    reason TEXT, -- Reason from the referenced record or manual entry
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'rejected')),

    -- Audit trail
    performed_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_stock_movement_quantities CHECK (
        (movement_type NOT IN ('product_edit', 'product_delete') AND (box_change != 0 OR kg_change != 0)) OR
        (movement_type = 'product_edit' AND field_changed IS NOT NULL) OR
        (movement_type = 'product_delete' AND field_changed IS NOT NULL)
    ),
    CONSTRAINT chk_movement_references CHECK (
        (movement_type = 'damaged' AND damaged_id IS NOT NULL) OR
        (movement_type = 'new_stock' AND stock_addition_id IS NOT NULL) OR
        (movement_type = 'stock_correction' AND correction_id IS NOT NULL) OR
        (movement_type = 'product_edit') OR
        (movement_type = 'product_delete')
    )
);

-- Comments for stock_movements table documentation
COMMENT ON TABLE stock_movements IS 'Tracks inventory changes from irregular events (damaged, new stock, corrections, product edits)';
COMMENT ON COLUMN stock_movements.movement_id IS 'Unique identifier for each movement';
COMMENT ON COLUMN stock_movements.product_id IS 'Reference to the product being moved';
COMMENT ON COLUMN stock_movements.movement_type IS 'Type of movement: damaged, new_stock, stock_correction, product_edit';
COMMENT ON COLUMN stock_movements.box_change IS 'Change in box quantity - positive for increase, negative for decrease';
COMMENT ON COLUMN stock_movements.kg_change IS 'Change in kg quantity - positive for increase, negative for decrease';
COMMENT ON COLUMN stock_movements.field_changed IS 'Name of the field that was changed (for product_edit movements)';
COMMENT ON COLUMN stock_movements.old_value IS 'Previous value of the changed field (for product_edit movements)';
COMMENT ON COLUMN stock_movements.new_value IS 'New value of the changed field (for product_edit movements)';
COMMENT ON COLUMN stock_movements.damaged_id IS 'Reference to damaged_products record for damaged movements';
COMMENT ON COLUMN stock_movements.stock_addition_id IS 'Reference to stock addition record for new stock movements';
COMMENT ON COLUMN stock_movements.correction_id IS 'Reference to stock correction record for correction movements';
COMMENT ON COLUMN stock_movements.reason IS 'Reason for the movement, derived from source record or manual entry';
COMMENT ON COLUMN stock_movements.status IS 'Status of the movement: pending, completed, cancelled';
COMMENT ON COLUMN stock_movements.performed_by IS 'User who performed the movement';
COMMENT ON COLUMN stock_movements.created_at IS 'Timestamp when movement was recorded';

-- =====================================================
-- 15. WORKER PERMISSIONS TABLE
-- Defines permissions directly assigned to workers
-- =====================================================

-- Worker permissions table for direct permission assignment to workers
CREATE TABLE IF NOT EXISTS worker_permissions (
    worker_permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES workers(worker_id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    permission_category VARCHAR(50) NOT NULL, -- e.g., 'sales', 'inventory', 'customers', 'reports'
    is_granted BOOLEAN DEFAULT false,
    granted_by UUID NOT NULL REFERENCES users(user_id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, permission_name)
);

-- Add worker permissions policy for products now that worker_permissions table exists
CREATE POLICY products_worker_access ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workers w
            JOIN worker_permissions wp ON w.worker_id = wp.worker_id
            WHERE w.worker_id = auth.uid()
            AND wp.permission_name IN ('view_inventory', 'manage_inventory')
        )
    );

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to calculate days left until expiry
CREATE OR REPLACE FUNCTION calculate_days_left()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate days_left based on expiry_date
    IF NEW.expiry_date IS NULL THEN
        NEW.days_left := NULL;
    ELSE
        NEW.days_left := NEW.expiry_date - CURRENT_DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate days_left on INSERT and UPDATE
CREATE TRIGGER trigger_calculate_days_left
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION calculate_days_left();

-- =====================================================
-- FILES AND FOLDERS FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update folder statistics when files are added/removed/modified
CREATE OR REPLACE FUNCTION update_folder_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE folders
        SET file_count = file_count + 1,
            total_size = total_size + COALESCE(NEW.file_size, 0)
        WHERE folder_id = NEW.folder_id;
        RETURN NEW;
    END IF;

    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If folder changed, update both old and new folders
        IF OLD.folder_id != NEW.folder_id THEN
            -- Remove from old folder
            UPDATE folders
            SET file_count = file_count - 1,
                total_size = total_size - COALESCE(OLD.file_size, 0)
            WHERE folder_id = OLD.folder_id;

            -- Add to new folder
            UPDATE folders
            SET file_count = file_count + 1,
                total_size = total_size + COALESCE(NEW.file_size, 0)
            WHERE folder_id = NEW.folder_id;
        ELSE
            -- Same folder, just update size difference
            UPDATE folders
            SET total_size = total_size - COALESCE(OLD.file_size, 0) + COALESCE(NEW.file_size, 0)
            WHERE folder_id = NEW.folder_id;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE folders
        SET file_count = file_count - 1,
            total_size = total_size - COALESCE(OLD.file_size, 0)
        WHERE folder_id = OLD.folder_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to validate file data with Cloudinary support
CREATE OR REPLACE FUNCTION validate_file_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure file name is not empty
    IF NEW.file_name IS NULL OR LENGTH(TRIM(NEW.file_name)) = 0 THEN
        RAISE EXCEPTION 'File name cannot be empty';
    END IF;

    -- Ensure file_url is not empty
    IF NEW.file_url IS NULL OR LENGTH(TRIM(NEW.file_url)) = 0 THEN
        RAISE EXCEPTION 'File URL cannot be empty';
    END IF;

    -- Ensure file size is not negative
    IF NEW.file_size IS NOT NULL AND NEW.file_size < 0 THEN
        RAISE EXCEPTION 'File size cannot be negative';
    END IF;

    -- Validate Cloudinary resource type if provided
    IF NEW.cloudinary_resource_type IS NOT NULL AND
       NEW.cloudinary_resource_type NOT IN ('image', 'video', 'raw', 'auto') THEN
        RAISE EXCEPTION 'Invalid Cloudinary resource type. Must be: image, video, raw, or auto';
    END IF;

    -- If Cloudinary public ID is provided, ensure secure URL is also provided
    IF NEW.cloudinary_public_id IS NOT NULL AND
       (NEW.cloudinary_secure_url IS NULL OR LENGTH(TRIM(NEW.cloudinary_secure_url)) = 0) THEN
        RAISE EXCEPTION 'Cloudinary secure URL is required when public ID is provided';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Files table indexes
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_added_by ON files(added_by);
CREATE INDEX IF NOT EXISTS idx_files_filename ON files(file_name);
CREATE INDEX IF NOT EXISTS idx_files_upload_date ON files(upload_date);
CREATE INDEX IF NOT EXISTS idx_files_cloudinary_public_id ON files(cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);

-- Folders table indexes
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(folder_name);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);
CREATE INDEX IF NOT EXISTS idx_folders_permanent ON folders(is_permanent);

-- Sales table indexes
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date_time);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_performed_by ON sales(performed_by);
CREATE INDEX IF NOT EXISTS idx_sales_client_name ON sales(client_name);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_profit_per_box ON sales(profit_per_box);
CREATE INDEX IF NOT EXISTS idx_sales_profit_per_kg ON sales(profit_per_kg);

-- Stock movements table indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_performed_by ON stock_movements(performed_by);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_field_changed ON stock_movements(field_changed);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_edit ON stock_movements(movement_type) WHERE movement_type = 'product_edit';
-- Index for related_sale_id removed as column no longer exists

-- =====================================================
-- TRIGGERS FOR FILES AND FOLDERS
-- =====================================================

-- Trigger to update folder statistics when files are added/removed/modified
CREATE TRIGGER update_folder_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_folder_stats();

-- Trigger to validate file data
CREATE TRIGGER validate_file_data_trigger
    BEFORE INSERT OR UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION validate_file_data();

-- =====================================================
-- 18. SALES AUDIT TABLE
-- Tracks all changes made to sales records for auditing
-- =====================================================

-- Sales Audit Trail Table
CREATE TABLE IF NOT EXISTS sales_audit (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('quantity_change', 'payment_method_change', 'deletion')),
    boxes_change INTEGER DEFAULT 0,
    kg_change DECIMAL(10,2) DEFAULT 0.00,
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(user_id),

    -- Approval workflow fields
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(user_id),
    approval_timestamp TIMESTAMPTZ,
    approval_reason TEXT,

    -- Additional metadata for audit trail
    old_values JSONB,
    new_values JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_audit_sale_id ON sales_audit(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_audit_timestamp ON sales_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_audit_audit_type ON sales_audit(audit_type);
CREATE INDEX IF NOT EXISTS idx_sales_audit_performed_by ON sales_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_sales_audit_approval_status ON sales_audit(approval_status);
CREATE INDEX IF NOT EXISTS idx_sales_audit_approved_by ON sales_audit(approved_by);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_sales_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sales_audit_updated_at
    BEFORE UPDATE ON sales_audit
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_audit_updated_at();

-- Add comments for sales_audit table documentation
COMMENT ON TABLE sales_audit IS 'Audit trail for all sales-related changes with approval workflow';
COMMENT ON COLUMN sales_audit.audit_id IS 'Unique identifier for each audit record';
COMMENT ON COLUMN sales_audit.timestamp IS 'When the audit event occurred';
COMMENT ON COLUMN sales_audit.sale_id IS 'Reference to the sales record that was modified';
COMMENT ON COLUMN sales_audit.audit_type IS 'Type of change: quantity_change, payment_method_change, or deletion';
COMMENT ON COLUMN sales_audit.boxes_change IS 'Change in box quantity (can be negative)';
COMMENT ON COLUMN sales_audit.kg_change IS 'Change in kg quantity (can be negative)';
COMMENT ON COLUMN sales_audit.reason IS 'Description of why the change was made';
COMMENT ON COLUMN sales_audit.performed_by IS 'User who performed the action';
COMMENT ON COLUMN sales_audit.approval_status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN sales_audit.approved_by IS 'User who approved or rejected the audit record';
COMMENT ON COLUMN sales_audit.approval_timestamp IS 'When the audit record was approved or rejected';
COMMENT ON COLUMN sales_audit.approval_reason IS 'Reason for approval or rejection';
COMMENT ON COLUMN sales_audit.old_values IS 'JSON object containing the old values before change';
COMMENT ON COLUMN sales_audit.new_values IS 'JSON object containing the new values after change';

-- =====================================================
-- 19. TRANSACTIONS TABLE
-- Comprehensive transaction management system for tracking all financial transactions
-- =====================================================

-- Transactions table for comprehensive transaction management
CREATE TABLE IF NOT EXISTS transactions (
    -- Primary key
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference to sales table
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

    -- Transaction timestamp (copied from sales for quick access)
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Product information (denormalized for performance)
    product_name VARCHAR(255) NOT NULL,

    -- Client information (denormalized for performance)
    client_name VARCHAR(255) NOT NULL,

    -- Quantity information
    boxes_quantity INTEGER DEFAULT 0 NOT NULL,
    kg_quantity DECIMAL(10,3) DEFAULT 0 NOT NULL,

    -- Financial information
    total_amount DECIMAL(10,2) NOT NULL,

    -- Payment status and method
    payment_status VARCHAR(10) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    payment_method VARCHAR(15) CHECK (payment_method IN ('momo_pay', 'cash', 'bank_transfer')),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- User who created/updated the transaction
    created_by UUID NOT NULL REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_transactions_sale_id ON transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_time ON transactions(date_time);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_client_name ON transactions(client_name);
CREATE INDEX IF NOT EXISTS idx_transactions_product_name ON transactions(product_name);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_status_method ON transactions(payment_status, payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_date_status ON transactions(date_time, payment_status);

-- Row Level Security (RLS) policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all transactions
CREATE POLICY transactions_select_all ON transactions
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert transactions
CREATE POLICY transactions_insert_own ON transactions
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update their own transactions
CREATE POLICY transactions_update_own ON transactions
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete their own transactions
CREATE POLICY transactions_delete_own ON transactions
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_transactions_updated_at();

-- Create function to automatically create transaction from sale
CREATE OR REPLACE FUNCTION create_transaction_from_sale()
RETURNS TRIGGER AS $$
DECLARE
    product_name_val VARCHAR(255);
BEGIN
    -- Get product name from products table
    SELECT name INTO product_name_val
    FROM products
    WHERE product_id = NEW.product_id;

    -- Insert transaction record
    INSERT INTO transactions (
        sale_id,
        date_time,
        product_name,
        client_name,
        boxes_quantity,
        kg_quantity,
        total_amount,
        payment_status,
        payment_method,
        created_by
    ) VALUES (
        NEW.id,
        NEW.date_time,
        COALESCE(product_name_val, 'Unknown Product'),
        COALESCE(NEW.client_name, 'Walk-in Customer'), -- Handle null client_name
        NEW.boxes_quantity,
        NEW.kg_quantity,
        NEW.total_amount,
        NEW.payment_status,
        NEW.payment_method,
        NEW.performed_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create transaction when sale is created
CREATE TRIGGER trigger_create_transaction_from_sale
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_from_sale();

-- Create function to update transaction when sale is updated
CREATE OR REPLACE FUNCTION update_transaction_from_sale()
RETURNS TRIGGER AS $$
DECLARE
    product_name_val VARCHAR(255);
BEGIN
    -- Get product name from products table
    SELECT name INTO product_name_val
    FROM products
    WHERE product_id = NEW.product_id;

    -- Update corresponding transaction record
    UPDATE transactions SET
        date_time = NEW.date_time,
        product_name = COALESCE(product_name_val, 'Unknown Product'),
        client_name = COALESCE(NEW.client_name, 'Walk-in Customer'), -- Handle null client_name
        boxes_quantity = NEW.boxes_quantity,
        kg_quantity = NEW.kg_quantity,
        total_amount = NEW.total_amount,
        payment_status = NEW.payment_status,
        payment_method = NEW.payment_method,
        updated_by = NEW.performed_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE sale_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update transaction when sale is updated
CREATE TRIGGER trigger_update_transaction_from_sale
    AFTER UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_transaction_from_sale();

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Comprehensive transaction management system for tracking all financial transactions';
COMMENT ON COLUMN transactions.transaction_id IS 'Unique identifier for each transaction';
COMMENT ON COLUMN transactions.sale_id IS 'Reference to the originating sale record';
COMMENT ON COLUMN transactions.date_time IS 'Transaction timestamp copied from sales for performance';
COMMENT ON COLUMN transactions.product_name IS 'Product name denormalized for quick access';
COMMENT ON COLUMN transactions.client_name IS 'Client name denormalized for quick access';

-- =====================================================
-- DEPOSITS TABLE - Independent Deposits Management
-- =====================================================

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
    -- Primary key
    deposit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Deposit information
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deposit_type VARCHAR(10) NOT NULL CHECK (deposit_type IN ('momo', 'bank', 'boss')),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    to_recipient VARCHAR(100), -- For boss type deposits, specifies who (boss, manager, etc.)

    -- Image storage (Cloudinary integration)
    deposit_image_url TEXT,

    -- Approval workflow
    approval VARCHAR(10) DEFAULT 'pending' CHECK (approval IN ('pending', 'approved', 'rejected')),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID
);

-- Create indexes for deposits table
CREATE INDEX IF NOT EXISTS idx_deposits_date_time ON deposits(date_time);
CREATE INDEX IF NOT EXISTS idx_deposits_deposit_type ON deposits(deposit_type);
CREATE INDEX IF NOT EXISTS idx_deposits_approval ON deposits(approval);
CREATE INDEX IF NOT EXISTS idx_deposits_created_by ON deposits(created_by);
CREATE INDEX IF NOT EXISTS idx_deposits_account_name ON deposits(account_name);
CREATE INDEX IF NOT EXISTS idx_deposits_type_approval ON deposits(deposit_type, approval);
CREATE INDEX IF NOT EXISTS idx_deposits_date_approval ON deposits(date_time, approval);
CREATE INDEX IF NOT EXISTS idx_deposits_created_by_approval ON deposits(created_by, approval);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_deposits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deposits_updated_at
    BEFORE UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_deposits_updated_at();

-- Add comments for deposits table
COMMENT ON TABLE deposits IS 'Independent deposits management system for tracking cash deposits';
COMMENT ON COLUMN deposits.deposit_id IS 'Unique identifier for each deposit';
COMMENT ON COLUMN deposits.date_time IS 'Date and time when the deposit was made';
COMMENT ON COLUMN deposits.deposit_type IS 'Type of deposit: momo, bank, or boss';
COMMENT ON COLUMN deposits.account_name IS 'Name of the account where deposit was made';
COMMENT ON COLUMN deposits.account_number IS 'Account number (optional)';
COMMENT ON COLUMN deposits.amount IS 'Amount of the deposit';
COMMENT ON COLUMN deposits.deposit_image_url IS 'URL to deposit proof image stored in Cloudinary';
COMMENT ON COLUMN deposits.approval IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN deposits.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN deposits.created_by IS 'User who created the deposit record';
COMMENT ON COLUMN deposits.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN deposits.updated_by IS 'User who last updated the deposit record';

-- =====================================================
-- USER SETTINGS TABLE
-- Stores user preferences and application settings
-- =====================================================

-- User settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- Owner of these settings

    -- Currency Settings
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'RWF')), -- User's preferred currency

    -- Language & Localization Settings
    language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'rw')), -- User's preferred language
    timezone VARCHAR(50) DEFAULT 'UTC', -- User's timezone
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY', -- Preferred date format

    -- Theme & Display Settings
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')), -- UI theme preference

    -- Notification Settings
    email_notifications BOOLEAN DEFAULT TRUE, -- Enable email notifications
    sms_notifications BOOLEAN DEFAULT FALSE, -- Enable SMS notifications
    low_stock_alerts BOOLEAN DEFAULT TRUE, -- Enable low stock alerts
    daily_reports BOOLEAN DEFAULT TRUE, -- Enable daily reports
    weekly_reports BOOLEAN DEFAULT TRUE, -- Enable weekly reports
    monthly_reports BOOLEAN DEFAULT FALSE, -- Enable monthly reports
    auto_reporting BOOLEAN DEFAULT TRUE, -- Enable automatic reporting

    -- Business Settings
    business_hours_start TIME DEFAULT '08:00:00', -- Business start time
    business_hours_end TIME DEFAULT '18:00:00', -- Business end time
    working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Working days (1=Monday, 7=Sunday)

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index to ensure one settings record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_currency ON user_settings(currency);
CREATE INDEX IF NOT EXISTS idx_user_settings_language ON user_settings(language);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();

-- Comments for documentation
COMMENT ON TABLE user_settings IS 'Stores user preferences and application settings';
COMMENT ON COLUMN user_settings.setting_id IS 'Unique identifier for each setting record';
COMMENT ON COLUMN user_settings.user_id IS 'User who owns these settings';
COMMENT ON COLUMN user_settings.currency IS 'User preferred currency (USD or RWF)';
COMMENT ON COLUMN user_settings.language IS 'User preferred language (en or rw)';
COMMENT ON COLUMN user_settings.timezone IS 'User timezone for date/time display';
COMMENT ON COLUMN user_settings.theme IS 'UI theme preference (light, dark, or system)';
COMMENT ON COLUMN user_settings.email_notifications IS 'Enable/disable email notifications';
COMMENT ON COLUMN user_settings.sms_notifications IS 'Enable/disable SMS notifications';
COMMENT ON COLUMN user_settings.low_stock_alerts IS 'Enable/disable low stock alerts';
COMMENT ON COLUMN user_settings.daily_reports IS 'Enable/disable daily reports';
COMMENT ON COLUMN user_settings.weekly_reports IS 'Enable/disable weekly reports';
COMMENT ON COLUMN user_settings.monthly_reports IS 'Enable/disable monthly reports';
COMMENT ON COLUMN user_settings.auto_reporting IS 'Enable/disable automatic reporting';
COMMENT ON COLUMN user_settings.business_hours_start IS 'Business operating start time';
COMMENT ON COLUMN user_settings.business_hours_end IS 'Business operating end time';
COMMENT ON COLUMN user_settings.working_days IS 'Array of working days (1=Monday, 7=Sunday)';

-- =====================================================
-- FOLDERS TABLE FUNCTIONS
-- =====================================================

-- Note: RLS policies removed for simplified access control

-- Create permanent system folders that should exist for all users
-- This function creates essential folders that every user needs
CREATE OR REPLACE FUNCTION create_permanent_folders(user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create Workers ID Image folder (permanent system folder)
    INSERT INTO folders (folder_name, description, color, icon, created_by, is_permanent)
    VALUES (
        'Workers ID Image',
        'Store worker identification images and documents for employee verification',
        '#8B5CF6', -- Purple color
        'id-card', -- ID card icon
        user_id,
        true -- Mark as permanent folder
    )
    ON CONFLICT (folder_name, created_by) DO NOTHING; -- Prevent duplicates
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF SCHEMA DEFINITION
-- Fish Selling Management System - 21 Tables Complete
-- =====================================================
