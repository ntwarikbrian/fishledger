# LocalFishing - Fish Management System

## Project Overview

LocalFishing is a comprehensive fish management system designed for local fish selling operations. The system provides tools for inventory management, sales tracking, customer management, staff management, document handling, and comprehensive reporting.

## Features

- **Fish Inventory Management**: Track fish stock by weight (kg) and boxed quantities with real-time updates
- **Sales Management**: Process sales transactions, track revenue, and manage customer orders
- **Customer Management**: Maintain customer records, contact information, and purchase history
- **Staff Management**: Handle worker accounts, permissions, and task assignments
- **Document Management**: Upload, organize, and manage business documents with folder structure
- **Expense Tracking**: Monitor business expenses with categorization and reporting
- **Reports & Analytics**: Generate comprehensive sales, profit, expense, and stock reports
- **Message System**: Email messaging system for customer and staff communication
- **Authentication**: Secure user authentication with role-based access control

## Architecture

This is a full-stack TypeScript application with:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript + Node.js OR Cloudflare Workers (serverless)
- **Database**: PostgreSQL (hosted on Supabase)
- **File Storage**: Cloudinary for document and image management
- **Email Service**: Gmail SMTP for messaging functionality
- **Authentication**: JWT-based authentication system

### 🆕 Cloudflare Workers Backend

The system now supports **Cloudflare Workers** as a modern, serverless backend alternative:

- **Serverless**: No server management required
- **Global Edge**: Deployed on Cloudflare's global network
- **Auto-scaling**: Handles traffic spikes automatically
- **Cost-effective**: Pay only for what you use
- **Better Performance**: Reduced latency with edge computing

See [CLOUDFLARE_WORKERS_MIGRATION.md](./CLOUDFLARE_WORKERS_MIGRATION.md) for complete migration guide.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm package manager
- PostgreSQL database (Supabase account recommended)
- Cloudinary account for file storage

### Installation

```sh
# Step 1: Clone the repository
git clone https://github.com/bilyv/localfishing.git

# Step 2: Navigate to the project directory
cd localfishing

# Step 3: Install frontend dependencies
npm install

# Step 4: Install backend dependencies
cd server; npm install

# Step 5: Set up environment variables (see Environment Setup below)

# Step 6: Set up the database (see Database Setup below)

# Step 7: Choose your backend and start development servers

# Option A: Cloudflare Workers Backend (Recommended)
cd workers; npm install; npm run dev  # API at http://localhost:8787

# Option B: Traditional Express Backend
cd server; npm run dev  # API at http://localhost:5004

# Terminal 2 - Frontend development server (configure VITE_API_URL accordingly)
npm run dev
```

### Environment Setup

#### Frontend Environment
Create a `.env` file in the root directory:
```env
# API Configuration
VITE_API_MODE=workers  # or 'express'
VITE_API_URL=http://localhost:8787  # Workers: 8787, Express: http://localhost:5004/api

# Supabase (if using client-side features)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary (for file uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
```

#### Backend Environment

**For Cloudflare Workers (Recommended):**
1. Create a `.env` file in the `workers` directory (copy from `.env.example`)
2. Set up Cloudflare secrets:
```bash
cd workers
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

**For Express Server:**
Create a `.env` file in the `server` directory:
```env
PORT=5004
NODE_ENV=development
DATABASE_URL=your_postgresql_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### Database Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Run the database migrations**:
   ```sh
   # Navigate to the database directory
   cd database

   # Run the main schema file in your Supabase SQL editor
   # Copy and paste the contents of main.sql
   ```
3. **Set up Row Level Security (RLS)** policies as needed for your security requirements

### Email Configuration

For the messaging system to work, you need to configure email settings:

1. **Set email environment variables** in your `.env` file:
   ```sh
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

2. **For Gmail users**: Generate an App Password:
   - Enable 2-Factor Authentication on your Google account
   - Go to Google Account → Security → App passwords
   - Generate a password for "Mail" and use it as `EMAIL_PASSWORD`

3. **Test email configuration**:
   ```sh
   cd server; npm run test:email
   ```

📖 **Detailed setup guide**: See [server/EMAIL_SETUP.md](server/EMAIL_SETUP.md) for complete instructions.

### Development

- **Frontend**: Runs on `http://localhost:5173` by default
- **Backend**: Runs on `http://localhost:3001` by default

## Technologies Used

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - High-quality, accessible UI component library
- **React Router DOM** - Client-side routing for single-page application
- **React Query (TanStack Query)** - Powerful data fetching and caching
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation
- **Lucide React** - Beautiful and consistent icon library
- **Recharts** - Composable charting library for data visualization

### Backend
- **Express.js** - Fast, unopinionated web framework for Node.js
- **TypeScript** - Type safety for server-side development
- **PostgreSQL** - Robust relational database
- **Supabase** - Backend-as-a-Service for database and authentication
- **JWT** - JSON Web Tokens for secure authentication
- **Cloudinary** - Cloud-based image and video management
- **Multer** - Middleware for handling multipart/form-data
- **bcryptjs** - Password hashing library
- **Express Validator** - Middleware for input validation
- **Helmet** - Security middleware for Express apps
- **CORS** - Cross-Origin Resource Sharing middleware

## Project Structure

```
localfishing/
├── src/                          # Frontend source code
│   ├── components/               # Reusable UI components
│   │   ├── ui/                  # Base UI components (shadcn/ui)
│   │   └── inventory/           # Inventory-specific components
│   ├── pages/                   # Application pages/routes
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions and configurations
│   │   └── api/                 # API client and services
│   ├── services/                # Business logic services
│   └── utils/                   # Helper utilities
├── server/                      # Backend source code
│   ├── src/                     # Server entry point
│   ├── config/                  # Configuration files
│   ├── controllers/             # Route controllers
│   ├── middleware/              # Express middleware
│   ├── routes/                  # API route definitions
│   ├── services/                # Business logic services
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Server utilities
├── database/                    # Database schema and migrations
│   ├── schemas/                 # Individual table schemas
│   └── main.sql                 # Complete database schema
├── scripts/                     # Utility scripts
└── public/                      # Static assets
```

## Available Scripts

### Frontend Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run build:dev` - Build frontend for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for frontend

### Backend Scripts
- `cd server; npm run dev` - Start backend development server with hot reload
- `cd server; npm run build` - Build backend for production
- `cd server; npm run start` - Start production server
- `cd server; npm run lint` - Run ESLint for backend
- `cd server; npm run test` - Run backend tests

### Database Scripts
- `cd server; npm run migrate:schema` - Apply database schema
- `cd server; npm run test:supabase` - Test Supabase connection

## Deployment

### Production Deployment

1. **Build the applications**:
   ```sh
   # Build frontend
   npm run build

   # Build backend
   cd server; npm run build
   ```

2. **Set up production environment variables**

3. **Deploy to your hosting platform** (Vercel, Netlify, Railway, etc.)

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment:
- Database connection strings
- API keys for external services
- JWT secrets
- CORS origins

## API Documentation

The backend provides RESTful APIs for:
- Authentication (`/api/auth`)
- User management (`/api/users`)
- Product management (`/api/products`)
- Sales management (`/api/sales`)
- Customer management (`/api/contacts`)
- Document management (`/api/files`, `/api/folders`)
- Expense tracking (`/api/expenses`)
- Reports (`/api/reports`)
- Staff management (`/api/workers`)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- Helmet security headers
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
