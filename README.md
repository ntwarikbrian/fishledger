# AquaManage - Fish Management System

## Project Overview

AquaManage is a comprehensive fish management system designed for fish selling operations. The system provides tools for inventory management, sales tracking, customer management, and reporting.

## Features

- **Fish Inventory Management**: Track fish stock by weight (kg) and boxed quantities
- **Sales Management**: Process sales transactions and track revenue
- **Customer Management**: Maintain customer records and purchase history
- **Order Management**: Handle customer orders and fulfillment
- **Product Catalog**: Manage fish product information and pricing
- **Reports & Analytics**: Generate sales reports and business insights

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Bun package manager

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies using Bun
bun install

# Step 4: Start the development server
bun run dev
```

### Development

The application runs on `http://localhost:8080` by default.

## Technologies Used

This project is built with:

- **Vite** - Build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - Frontend framework
- **shadcn-ui** - UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Application pages/routes
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
└── index.css      # Global styles
```

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run build:dev` - Build for development
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request
