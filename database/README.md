# AquaManage Database Schema

This directory contains the complete database schema for the AquaManage Fish Selling Management System. The database is designed for PostgreSQL and includes comprehensive tables, relationships, security policies, and business logic.

## Database Structure Overview

### Core Components

1. **Authentication & User Management**
   - `users` - Main user authentication and basic info
   - `workers` - Extended worker information and management

2. **Product & Inventory Management**
   - `fish_categories` - Product categorization
   - `suppliers` - Supplier information
   - `fish_products` - Main product inventory
   - `stock_movements` - Stock tracking and audit trail

3. **Customer & Contact Management**
   - `contacts` - Unified contact management (customers, suppliers, vendors)

4. **Sales Management**
   - `sales` - Sales transactions
   - `sale_items` - Individual line items for sales

5. **Expense Management**
   - `expense_categories` - Expense categorization
   - `expenses` - Business expense tracking

6. **Document Management**
   - `document_folders` - Document organization
   - `documents` - File storage and metadata

7. **Worker Management**
   - `worker_tasks` - Task assignment and tracking
   - `worker_attendance` - Attendance monitoring

8. **Messaging System**
   - `message_settings` - Automatic message configuration
   - `message_history` - Message tracking and history

## Files Structure

```
database/
├── main.sql                    # Complete database schema
├── schemas/                    # Individual table schemas
│   ├── users.sql
│   ├── workers.sql
│   ├── product_categories.sql
│   ├── products.sql
│   ├── stock_movements.sql
│   ├── contacts.sql
│   ├── messages.sql
│   ├── automatic_messages.sql
│   ├── message_settings.sql
│   ├── message_templates.sql
│   ├── sales.sql
│   ├── expenses.sql
│   ├── expense_categories.sql
│   ├── folders.sql
│   ├── files.sql
│   ├── worker_tasks.sql
│   ├── worker_permissions.sql
└── README.md                   # This file
```

## Key Features

### Security
- **Row Level Security (RLS)** implemented on all tables
- **Role-based access control** (Admin vs Worker permissions)
- **Data isolation** ensuring users only access authorized data
- **Audit trails** for all critical operations

### Business Logic
- **Automatic stock calculations** and status determination
- **Stock movement tracking** with validation
- **Sales total calculations** with discount handling
- **Task and attendance management** with automated calculations
- **Message automation** for stock alerts and notifications

### Data Integrity
- **Foreign key constraints** maintaining referential integrity
- **Check constraints** for data validation
- **Triggers** for automatic calculations and validations
- **Unique constraints** preventing duplicate data

### Performance
- **Strategic indexes** on frequently queried columns
- **Optimized views** for complex queries
- **Efficient data types** and storage

## Setup Instructions

### Local Development (PostgreSQL)

1. **Install PostgreSQL** (version 12 or higher recommended)

2. **Create Database**
   ```sql
   CREATE DATABASE aquamanage;
   ```

3. **Run Main Schema**
   ```bash
   psql -d aquamanage -f database/main.sql
   ```

4. **Or run individual schemas** (in dependency order):
   ```bash
   psql -d aquamanage -f database/schemas/users.sql
   psql -d aquamanage -f database/schemas/workers.sql
   # ... continue with other schemas
   ```

### Supabase Deployment

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project

2. **Run Schema in SQL Editor**
   - Copy contents of `database/main.sql`
   - Paste in Supabase SQL Editor
   - Execute the script

3. **Configure Authentication**
   - Enable Row Level Security
   - Set up authentication providers as needed

## Environment Configuration

### Local Mode
- Uses local PostgreSQL database
- Connection string: `postgresql://username:password@localhost:5432/aquamanage`

### Deployed Mode (Supabase)
- Uses Supabase hosted PostgreSQL
- Connection string provided by Supabase project settings
- Includes built-in authentication and real-time features

## Key Relationships

```
users (1) ←→ (1) workers
users (1) ←→ (*) sales [seller]
users (1) ←→ (*) expenses [spent_by]
users (1) ←→ (*) documents [uploaded_by]

fish_categories (1) ←→ (*) fish_products
suppliers (1) ←→ (*) fish_products
fish_products (1) ←→ (*) stock_movements
fish_products (1) ←→ (*) sale_items

contacts (1) ←→ (*) sales [customer]
sales (1) ←→ (*) sale_items

expense_categories (1) ←→ (*) expenses
document_folders (1) ←→ (*) documents

workers (1) ←→ (*) worker_tasks
workers (1) ←→ (*) worker_attendance
```

## Important Views

- `fish_products_with_status` - Products with calculated stock status
- `sales_detailed` - Sales with customer and seller information
- `expenses_detailed` - Expenses with category and user details
- `worker_tasks_detailed` - Tasks with worker and assignment details
- `message_history_detailed` - Messages with sender and product information

## Stored Functions

- `get_stock_status()` - Calculate product stock status
- `send_stock_alert_messages()` - Send automatic stock alerts
- `send_broadcast_message()` - Send manual broadcast messages
- `auto_check_in_out()` - Handle worker attendance

## Sample Data

The schema includes sample data for:
- Fish categories (Premium Fish, Fresh Water Fish, etc.)
- Suppliers (Ocean Fresh Ltd, Lake Harvest Co, etc.)
- Expense categories (Transportation, Equipment, etc.)
- Document folders (Contracts, Receipts, etc.)
- Message settings templates

## Maintenance

### Regular Tasks
1. **Backup database** regularly
2. **Monitor stock levels** and alerts
3. **Review message history** for delivery status
4. **Clean up old documents** if needed
5. **Archive old attendance records** periodically

### Performance Monitoring
- Monitor query performance on large tables
- Consider partitioning for historical data
- Review and optimize indexes as data grows

## Support

For questions or issues with the database schema:
1. Check the individual schema files for detailed comments
2. Review the main.sql file for complete structure
3. Consult PostgreSQL documentation for advanced features
4. Check Supabase documentation for deployment-specific features
  
  ## INSTRUCTIONS ON THE STRUCTURE
  
  1. users table will have the following columns: user id, business name, owner name, email address, phone number, password, created at and last login.
  2. workers table will have: worker id, fullname, email, phone number, url of identification image of the worker, monthly salary, total revenue, recent login history and worker created at.
  3. worker task table:
  task id, task title, sub-tasks, assigned to, priority, due date and time, status (pending, inprogress,completed, overdue) and progress percentage column and created at column.
  4. expense category table: category name, description and budget.
  5. expense table :expense id, category, amount, date, added by and status(rejected ,pending ,paid)
  6. contacts table: company name, contact name, email, phone number, contact type(supplier or customer), address, email_verified, preferred_contact_method, email_notifications, last_contacted, total_messages_sent, notes and added by
  7. message table will have: recipent id, recipient_type, recipient_email, message_type, delivery_method, message subject, message content, status, error_message, sent_at, delivered_at, sent_by, created_at and updated_at
  8. automatic messages table: product, current quantity, recipent id, recipient_type, quantity needed, quantiy trigged, message_template, created_at and updated at.
  9. message_settings table: user_id, email configuration (host, port, user, password, from, from_name), security settings (TLS, SSL), messaging preferences (auto_send, daily_limit, retry settings), notification settings, template settings (signature, logo), created_at and updated_at
  10. message_templates table: user_id, template_name, template_category, template_type, subject_template, content_template, template settings (is_active, is_default, use_signature), usage statistics (usage_count, last_used), available_variables, created_at and updated_at
  9.folders table: folder id, folder name, description, folder color, folder icon, files it contains, size, created by
  10. file table:
  file id, file name, image url, description, folder id, date and added by
  11. products table:
  product id, product sku, product name, category, quantity, selling type(both, boxed or weight), price, cost price, profit, supplier, low stock, damaged reason, damaged date, loss value, status(pending, approved or rejected), reported by, expiry dates, days left and status(critical, warning and monitor).
  12. products category table: category id, name, description, created at updated at.
  13. stock movement table: product id, movement type (counting error, theft, return), weight_change, quantity_change, reason, performed_by,created_at.
  14.sales table: sales id, product id, selling method, quantity, total, date and time, payment status, payment method(cash, card, bank transfer, mobile money) client name, client email, client phone number and client address.