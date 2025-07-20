# Worker Management API Documentation

This document describes the Worker Management API endpoints for the Fish Sales Management System.

## Overview

The Worker Management API allows business owners to create, manage, and configure permissions for worker accounts. Workers are employees who can access specific parts of the system based on their assigned permissions.

## Authentication

All worker management endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Worker

**POST** `/api/workers`

Creates a new worker account with ID card attachments.

**Content-Type:** `multipart/form-data`

**Request Body:**
- `full_name` (string, required): Worker's full name
- `email` (string, required): Worker's email address
- `password` (string, required): Worker's password
- `phone_number` (string, optional): Worker's phone number
- `monthly_salary` (number, optional): Worker's monthly salary
- `id_card_front` (File, required): Front side of ID card image
- `id_card_back` (File, required): Back side of ID card image

**Response:**
```json
{
  "success": true,
  "message": "Worker account created successfully",
  "worker": {
    "worker_id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "id_card_front_url": "https://cloudinary.com/...",
    "id_card_back_url": "https://cloudinary.com/...",
    "monthly_salary": 5000,
    "total_revenue_generated": 0,
    "created_at": "2024-01-25T10:00:00Z"
  }
}
```

### 2. Get All Workers

**GET** `/api/workers`

Retrieves all workers in the system.

**Response:**
```json
{
  "success": true,
  "workers": [
    {
      "worker_id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "monthly_salary": 5000,
      "total_revenue_generated": 12500,
      "created_at": "2024-01-25T10:00:00Z"
    }
  ]
}
```

### 3. Get Worker by ID

**GET** `/api/workers/:id`

Retrieves a specific worker by their ID.

**Response:**
```json
{
  "success": true,
  "worker": {
    "worker_id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "id_card_front_url": "https://cloudinary.com/...",
    "id_card_back_url": "https://cloudinary.com/...",
    "monthly_salary": 5000,
    "total_revenue_generated": 12500,
    "created_at": "2024-01-25T10:00:00Z"
  }
}
```

### 4. Update Worker

**PUT** `/api/workers/:id`

Updates worker information (excluding ID cards and password).

**Request Body:**
```json
{
  "full_name": "John Smith",
  "email": "johnsmith@example.com",
  "phone_number": "+1234567890",
  "monthly_salary": 5500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Worker updated successfully",
  "worker": {
    "worker_id": "uuid",
    "full_name": "John Smith",
    "email": "johnsmith@example.com",
    "phone_number": "+1234567890",
    "monthly_salary": 5500,
    "total_revenue_generated": 12500,
    "created_at": "2024-01-25T10:00:00Z"
  }
}
```

### 5. Delete Worker

**DELETE** `/api/workers/:id`

Deletes a worker account and cleans up associated files.

**Response:**
```json
{
  "success": true,
  "message": "Worker deleted successfully"
}
```

### 6. Get Worker Permissions

**GET** `/api/workers/:id/permissions`

Retrieves the permissions assigned to a worker.

**Response:**
```json
{
  "success": true,
  "worker_id": "uuid",
  "permissions": {
    "productInventory": {
      "viewProducts": true,
      "createProduct": false,
      "editProduct": false,
      "deleteProduct": false,
      "manageCategories": false,
      "viewStock": true,
      "updateStock": false,
      "viewReports": false
    },
    "sales": {
      "viewSales": true,
      "createSale": true,
      "editSale": false,
      "deleteSale": false,
      "manageSalesReports": false,
      "viewCustomers": true,
      "managePayments": false
    },
    "transactions": {
      "viewTransactions": false,
      "createTransaction": false,
      "editTransaction": false,
      "deleteTransaction": false,
      "manageDeposits": false,
      "viewFinancialReports": false,
      "manageDebtors": false
    },
    "expenses": {
      "viewExpenses": false,
      "createExpense": false,
      "editExpense": false,
      "deleteExpense": false,
      "manageCategories": false,
      "viewExpenseReports": false,
      "approveExpenses": false
    }
  }
}
```

### 7. Update Worker Permissions

**PUT** `/api/workers/:id/permissions`

Updates the permissions for a worker.

**Request Body:**
```json
{
  "permissions": {
    "productInventory": {
      "viewProducts": true,
      "createProduct": true,
      "editProduct": false,
      "deleteProduct": false,
      "manageCategories": true,
      "viewStock": true,
      "updateStock": true,
      "viewReports": true
    },
    "sales": {
      "viewSales": true,
      "createSale": true,
      "editSale": true,
      "deleteSale": false,
      "manageSalesReports": true,
      "viewCustomers": true,
      "managePayments": true
    },
    "transactions": {
      "viewTransactions": true,
      "createTransaction": false,
      "editTransaction": false,
      "deleteTransaction": false,
      "manageDeposits": false,
      "viewFinancialReports": true,
      "manageDebtors": false
    },
    "expenses": {
      "viewExpenses": true,
      "createExpense": true,
      "editExpense": false,
      "deleteExpense": false,
      "manageCategories": false,
      "viewExpenseReports": true,
      "approveExpenses": false
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Worker permissions updated successfully",
  "worker_id": "uuid",
  "permissions": { /* updated permissions object */ }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors, missing required fields)
- `401` - Unauthorized (invalid or missing authentication token)
- `404` - Not Found (worker not found)
- `409` - Conflict (email already exists)
- `500` - Internal Server Error

## File Upload Requirements

For ID card images:
- **Supported formats:** JPG, JPEG, PNG, WebP
- **Maximum file size:** 5MB per file
- **Required files:** Both front and back images are mandatory
- **Storage:** Files are uploaded to Cloudinary with automatic optimization

## Permission Categories

The system supports four main permission categories:

1. **Product Inventory** - Managing products, categories, stock levels
2. **Sales** - Creating and managing sales transactions
3. **Transactions** - Financial transactions and deposits
4. **Expenses** - Managing business expenses and categories

Each category has specific permissions that can be granted or revoked individually.
