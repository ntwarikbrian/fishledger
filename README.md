# Scalable SaaS Platform - LocalFishing

## Project Overview

A modern, scalable SaaS platform built for fish management and local business operations. This full-stack TypeScript application leverages serverless architecture with Cloudflare Workers and Hono framework for optimal performance, cost-efficiency, and global scalability. The platform provides comprehensive tools for inventory management, sales tracking, financial analytics, document management, and business intelligence.

## ✨ Key Features

### 📊 **Dashboard & Analytics**
- **Real-time Dashboard**: Interactive dashboard with revenue charts, financial overview, and key metrics
- **Skeleton Loading**: Professional loading states with skeleton placeholders for better UX
- **Selective Refresh**: Smart filtering that only refreshes relevant components (e.g., revenue chart filters)
- **Multi-language Support**: Full internationalization with English and Kinyarwanda support

### 🐟 **Inventory Management**
- **Fish Stock Tracking**: Monitor fish inventory by weight (kg) and boxed quantities
- **Low Stock Alerts**: Automated notifications for items running low
- **Damage Tracking**: Record and track damaged inventory with financial impact
- **Stock Movements**: Comprehensive audit trail of all inventory changes

### 💰 **Financial Management**
- **Transaction Processing**: Handle sales, deposits, and expense transactions
- **Revenue Analytics**: Period-based revenue charts (week, month, 6 months)
- **Expense Tracking**: Categorized expense management with audit trails
- **Financial Overview**: Donut charts showing profit, expenses, and damages

### 📁 **Document Management**
- **Cloudinary Integration**: Professional file storage and management
- **Permanent Folders**: Organized document structure for different business needs
- **File Upload**: Secure file upload with validation and processing
- **Document Organization**: Hierarchical folder structure with permissions

### 👥 **User Management**
- **Role-based Access**: Admin and worker roles with appropriate permissions
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **User Profiles**: Comprehensive user management and profile handling

### 🔧 **Technical Excellence**
- **Serverless Architecture**: Built on Cloudflare Workers for global edge deployment
- **TypeScript**: Full type safety across frontend and backend
- **Modern UI**: shadcn/ui components with Tailwind CSS for professional design
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance Optimized**: Efficient data fetching with caching and selective updates

## 🏗️ Modern Architecture

This scalable SaaS platform is built with cutting-edge technologies:

### **Frontend Stack**
- **React 18** with TypeScript for type-safe, modern UI development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS + shadcn/ui** for professional, accessible design system
- **React Router** for client-side routing and navigation
- **React Hook Form + Zod** for robust form handling and validation
- **Recharts** for interactive data visualizations and charts

### **Backend Stack (Serverless-First)**
- **Cloudflare Workers** with Hono framework for edge computing
- **TypeScript** for full-stack type safety
- **Serverless Architecture** for automatic scaling and cost optimization
- **Global Edge Deployment** for minimal latency worldwide
- **JWT Authentication** with secure token management

### **Database & Storage**
- **PostgreSQL** hosted on Supabase for reliable, scalable data storage
- **Optimized Schema** with small data types for cost efficiency
- **Row Level Security (RLS)** for data protection
- **Cloudinary** for professional file and image management

### **DevOps & Performance**
- **pnpm** package management across all services
- **TypeScript** compilation and type checking
- **Environment-based Configuration** for different deployment stages
- **Comprehensive Error Handling** with user-friendly feedback
- **Performance Monitoring** with detailed logging and analytics

### 🚀 **Serverless Benefits**
- **Zero Server Management**: Focus on code, not infrastructure
- **Global Edge Network**: Sub-100ms response times worldwide
- **Automatic Scaling**: Handle traffic spikes without configuration
- **Cost Optimization**: Pay only for actual usage
- **High Availability**: Built-in redundancy and failover

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **pnpm** package manager (install with: npm install -g pnpm)
- **Supabase Account** - [Sign up here](https://supabase.com)
- **Cloudinary Account** - [Sign up here](https://cloudinary.com)
- **Cloudflare Account** (for deployment) - [Sign up here](https://cloudflare.com)

### 📦 Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd scalable-saas

# 2. Install client dependencies
cd client
pnpm install

# 3. Install backend dependencies
cd ../backend
pnpm install

# 4. Set up environment variables (see Environment Setup below)

# 5. Set up the database (see Database Setup below)

# 6. Start development servers

# Terminal 1 - Backend (Hono + Cloudflare Workers)
cd backend
pnpm run dev  # API at http://localhost:8787

# Terminal 2 - Frontend (React + Vite)
cd client
pnpm run dev  # App at http://localhost:5173
```

### 🔧 Development Commands

```bash
# Backend development
cd backend; pnpm run dev

# Frontend development
cd client; pnpm run dev

# Type checking
cd client; pnpm run type-check
cd backend; pnpm run type-check

# Build for production
cd client; pnpm run build
cd backend; pnpm run build
```

### ⚙️ Environment Setup

#### Frontend Environment (`client/.env`)
```env
# API Configuration
VITE_API_URL=http://localhost:8787

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

#### Backend Environment (`backend/.env`)
```env
# Development Configuration
NODE_ENV=development
PORT=8787

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

#### 🔐 Cloudflare Secrets (Production)
For production deployment, set up Cloudflare Workers secrets:
```bash
cd backend
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put JWT_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
```

### 🗄️ Database Setup

#### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys from the project settings

#### 2. Run Database Schema
```bash
# Navigate to database directory
cd database

# Option 1: Run the complete schema
# Copy and paste contents of main.sql into Supabase SQL Editor

# Option 2: Run individual schemas
# Copy contents of schemas/*.sql files one by one
```

#### 3. Database Schema Structure
```
database/
├── main.sql                    # Complete database schema
├── schemas/                    # Individual table schemas
│   ├── users.sql              # User management tables
│   ├── sales.sql              # Sales and transactions
│   ├── expenses.sql           # Expense tracking
│   ├── folders.sql            # Document management
│   ├── deposits.sql           # Deposit transactions
│   └── transactions.sql       # Transaction history
└── migrations/                 # Database migrations
    ├── 001_create_deposits_table.sql
    ├── 002_add_to_recipient_column.sql
    └── 003_add_expense_categories_audit_fields.sql
```

#### 4. Key Database Features
- **Optimized Data Types**: Small data types for cost efficiency
- **Audit Trails**: Comprehensive tracking of all changes
- **Foreign Key Constraints**: Data integrity and relationships
- **Indexes**: Optimized for common query patterns
- **Row Level Security**: Ready for multi-tenant architecture

### 🌐 Development URLs

- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:8787 (Hono + Cloudflare Workers)
- **Database**: Supabase Dashboard (your project URL)
- **File Storage**: Cloudinary Dashboard

## 🛠️ Technology Stack

### **Frontend Technologies**
| Technology | Purpose | Version |
|------------|---------|---------|
| **React 18** | UI Framework with concurrent features | ^18.0.0 |
| **TypeScript** | Type-safe JavaScript development | ^5.0.0 |
| **Vite** | Fast build tool and dev server | ^5.0.0 |
| **Tailwind CSS** | Utility-first CSS framework | ^3.4.0 |
| **shadcn/ui** | Professional component library | Latest |
| **React Router** | Client-side routing | ^6.0.0 |
| **React Hook Form** | Performant form handling | ^7.0.0 |
| **Zod** | Schema validation | ^3.0.0 |
| **Recharts** | Data visualization | ^2.8.0 |
| **Lucide React** | Icon library | ^0.400.0 |
| **React i18next** | Internationalization | ^13.0.0 |

### **Backend Technologies**
| Technology | Purpose | Version |
|------------|---------|---------|
| **Cloudflare Workers** | Serverless edge computing | Latest |
| **Hono** | Fast web framework for Workers | ^4.0.0 |
| **TypeScript** | Type-safe server development | ^5.0.0 |
| **PostgreSQL** | Relational database | ^15.0 |
| **Supabase** | Database hosting and APIs | Latest |
| **JWT** | Authentication tokens | ^9.0.0 |
| **Cloudinary** | File storage and processing | ^1.40.0 |
| **Zod** | Runtime type validation | ^3.0.0 |

### **DevOps & Tools**
| Tool | Purpose |
|------|---------|
| **pnpm** | Package management |
| **Wrangler** | Cloudflare Workers CLI |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Git** | Version control |

## 📁 Project Structure

```
scalable-saas/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/             # shadcn/ui base components
│   │   │   ├── layout/         # Layout components (Navbar, Sidebar)
│   │   │   └── inventory/      # Business-specific components
│   │   ├── pages/              # Application pages/routes
│   │   │   ├── Index.tsx       # Dashboard with analytics
│   │   │   ├── Transactions.tsx # Transaction management
│   │   │   ├── Expenses.tsx    # Expense tracking
│   │   │   └── Documents.tsx   # Document management
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── use-dashboard-data.ts
│   │   │   ├── use-transactions.ts
│   │   │   └── use-deposits.ts
│   │   ├── lib/                # Utilities and configurations
│   │   │   ├── api/           # API client and services
│   │   │   └── utils.ts       # Helper functions
│   │   ├── services/          # Business logic services
│   │   ├── locales/           # Internationalization files
│   │   │   ├── en/            # English translations
│   │   │   └── rw/            # Kinyarwanda translations
│   │   └── types/             # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── backend/                     # Serverless backend (Hono + Workers)
│   ├── src/
│   │   ├── handlers/           # Request handlers
│   │   │   ├── dashboard.ts    # Dashboard analytics
│   │   │   ├── transactions.ts # Transaction processing
│   │   │   ├── expenses.ts     # Expense management
│   │   │   └── deposits.ts     # Deposit handling
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/         # Authentication & validation
│   │   ├── config/             # Configuration files
│   │   └── utils/              # Server utilities
│   ├── package.json
│   └── wrangler.toml           # Cloudflare Workers config
├── database/                    # Database schema and migrations
│   ├── main.sql                # Complete database schema
│   ├── schemas/                # Individual table schemas
│   │   ├── users.sql
│   │   ├── sales.sql
│   │   ├── expenses.sql
│   │   ├── transactions.sql
│   │   └── deposits.sql
│   └── migrations/             # Database migrations
└── README.md                   # This file
```

## 📜 Available Scripts

### **Client Scripts** (`cd client`)
```bash
pnpm run dev          # Start development server (http://localhost:5173)
pnpm run build        # Build for production
pnpm run preview      # Preview production build
pnpm run lint         # Run ESLint
pnpm run type-check   # TypeScript type checking
```

### **Backend Scripts** (`cd backend`)
```bash
pnpm run dev          # Start development server (http://localhost:8787)
pnpm run build        # Build for production
pnpm run deploy       # Deploy to Cloudflare Workers
pnpm run lint         # Run ESLint
pnpm run type-check   # TypeScript type checking
```

### **Development Workflow**
```bash
# Start both servers simultaneously
# Terminal 1
cd backend && pnpm run dev

# Terminal 2
cd client && pnpm run dev

# Production build
cd client && pnpm run build
cd backend && pnpm run build
```

## 🚀 Deployment

### **Frontend Deployment (Vercel/Netlify)**

```bash
# Build the client
cd client
pnpm run build

# Deploy to Vercel
pnpm dlx vercel --prod

# Or deploy to Netlify
pnpm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### **Backend Deployment (Cloudflare Workers)**

```bash
# Deploy to Cloudflare Workers
cd backend
pnpm run deploy

# Or using Wrangler directly
pnpm dlx wrangler deploy
```

### **Environment Variables for Production**

#### Frontend (Vercel/Netlify)
```env
VITE_API_URL=https://your-worker.your-subdomain.workers.dev
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

#### Backend (Cloudflare Workers Secrets)
Set up using Wrangler CLI:
```bash
cd backend
pnpm dlx wrangler secret put SUPABASE_URL
pnpm dlx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm dlx wrangler secret put JWT_SECRET
pnpm dlx wrangler secret put CLOUDINARY_API_SECRET
# ... etc
```

## 📚 API Documentation

### **API Endpoints**

| Endpoint | Purpose | Methods |
|----------|---------|---------|
| `/api/auth/*` | Authentication & user management | POST, GET |
| `/api/dashboard/*` | Dashboard analytics & stats | GET |
| `/api/transactions/*` | Transaction processing | GET, POST, PUT, DELETE |
| `/api/expenses/*` | Expense management | GET, POST, PUT, DELETE |
| `/api/deposits/*` | Deposit handling | GET, POST, PUT, DELETE |
| `/api/files/*` | File upload & management | GET, POST, DELETE |
| `/api/folders/*` | Folder organization | GET, POST, PUT, DELETE |

### **Key API Features**
- **RESTful Design**: Standard HTTP methods and status codes
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation with Zod
- **Error Handling**: Consistent error responses with helpful messages
- **CORS Support**: Configurable cross-origin resource sharing
- **Type Safety**: Full TypeScript support for request/response types

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Input Validation**: Comprehensive validation using Zod schemas
- **CORS Protection**: Configurable cross-origin resource sharing
- **Environment Security**: Secure environment variable handling
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Database Security**: Row Level Security (RLS) ready for multi-tenancy
- **File Upload Security**: Secure file handling with Cloudinary
- **Error Handling**: Secure error messages without sensitive data exposure

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow TypeScript best practices
   - Add proper type definitions
   - Include comments for complex logic
   - Follow the existing code style
4. **Test your changes**
   ```bash
   cd client && pnpm run type-check
   cd backend && pnpm run type-check
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'feat: Add amazing feature'
   ```
6. **Push and create a Pull Request**
   ```bash
   git push origin feature/amazing-feature
   ```

### **Development Guidelines**
- Use TypeScript for all new code
- Follow the existing project structure
- Add comments for complex business logic
- Use semantic commit messages
- Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: Check the `/docs` folder for detailed guides

---

**Built with ❤️ using modern web technologies for scalable SaaS applications**
