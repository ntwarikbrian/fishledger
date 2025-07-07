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
    budget DECIMAL(12,2) DEFAULT 0 -- Budget allocation for this category
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
    created_by UUID NOT NULL REFERENCES users(user_id)
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

-- Products table for fish inventory management
CREATE TABLE IF NOT EXISTS products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id UUID NOT NULL REFERENCES product_categories(category_id),
    quantity INTEGER DEFAULT 0,
    selling_type VARCHAR(20) NOT NULL CHECK (selling_type IN ('boxed', 'weight', 'both')),
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    profit DECIMAL(10,2) GENERATED ALWAYS AS (price - cost_price) STORED,
    supplier VARCHAR(200),
    low_stock_threshold INTEGER DEFAULT 10,
    damaged_reason TEXT,
    damaged_date DATE,
    loss_value DECIMAL(10,2) DEFAULT 0,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    reported_by UUID REFERENCES users(user_id),
    expiry_date DATE,
    days_left INTEGER, -- Will be calculated by application or trigger
    stock_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN quantity <= (low_stock_threshold * 0.5) THEN 'critical'
            WHEN quantity <= low_stock_threshold THEN 'warning'
            ELSE 'monitor'
        END
    ) STORED
);

-- =====================================================
-- 12. AUTOMATIC MESSAGES TABLE
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
-- 13. STOCK MOVEMENTS TABLE
-- Tracks inventory changes from irregular events
-- =====================================================

-- Stock movements table for tracking inventory changes from irregular events
CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('counting_error', 'theft', 'return')),
    weight_change DECIMAL(10,2) DEFAULT 0, -- Weight change in kg (positive for increase, negative for decrease)
    quantity_change INTEGER DEFAULT 0, -- Quantity change (positive for increase, negative for decrease)
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 14. SALES TABLE
-- Logs transaction data for sold products
-- =====================================================

-- Sales table for transaction data of sold products
CREATE TABLE IF NOT EXISTS sales (
    sales_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(product_id),
    selling_method VARCHAR(20) NOT NULL CHECK (selling_method IN ('boxed', 'weight')),
    quantity DECIMAL(10,2) NOT NULL, -- Can be units for boxed or kg for weight
    total_amount DECIMAL(12,2) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money')),
    client_name VARCHAR(200),
    client_email VARCHAR(255),
    client_phone_number VARCHAR(20),
    client_address TEXT
);

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
-- END OF SCHEMA DEFINITION
-- Fish Selling Management System - 15 Tables Complete
-- =====================================================
