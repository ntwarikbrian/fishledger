# Scalable SaaS Platform - LocalFishing

## Project Overview

A modern, scalable SaaS platform for fish business and inventory operations, built as a full-stack TypeScript monorepo. It leverages **serverless Cloudflare Workers** (backend, Hono framework), a modern **React/TypeScript** frontend with **shadcn/ui** and **Tailwind CSS**, and a **PostgreSQL (Supabase)** database. 

Designed for fast iteration, global scaling, and easy maintainability—using pnpm everywhere and a cleanly separated, well-documented repo structure.

---

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

---

## 🏗️ Stack Overview

### Frontend
- **TypeScript 5+**
- **React 18** and React Router DOM
- **Vite** (dev/build)
- **shadcn/ui** (headless component library)
- **Tailwind CSS** (utility-first styling)
- **React Hook Form + Zod** (forms & validation)
- **Recharts** (visualizations)
- **i18next** (multi-language support)
- **Lucide-react** (icon system)

### Backend
- **TypeScript 5+**
- **Cloudflare Workers** (serverless global backend)
- **Hono** (TS-first web framework for Workers)
- **Zod** (validation)
- **Supabase Auth** (authentication: SSO/JWT)
- **bcryptjs** (password hashing)
- **Supabase client** (database interaction)
- **Wrangler CLI** (deploy/manage Workers)

### Database
- **PostgreSQL** (hosted by Supabase)
- **Optimized schema with small types**
- **SQL migrations and seeds**
- **Supabase RLS** (row-level security, policies)
- **Cloudinary** (file/image uploads)

### Tooling
- **pnpm** (multi-project package manager)
- **ESLint & Prettier** (code quality/formatting)
- **TypeScript strict mode** everywhere
- **Git + Semantic Commits**
- **Automated tests (backend**, extendable to frontend)
- **Extensive Markdown docs in `/info`**

---

## 📦 Setup & Prerequisites

- **Node.js v18+** required
- **pnpm** for all dependency management. Install if needed:
  ```bash
  npm install -g pnpm
  ```

---

## 📁 Project Structure

```
├── src/                  # Frontend (React + TypeScript, Vite, shadcn/ui)
│   ├── components/       # Reusable UI (shadcn primitives in ui/, domain features)
│   ├── pages/            # Route-level screens
│   ├── hooks/            # React hooks
│   ├── lib/              # Utilities/APIs
│   ├── services/         # API/data layer
│   ├── locales/          # i18n resources
│   ├── types/            # Shared frontend types
├── backend/              # Cloudflare Workers (Hono, TypeScript)
│   ├── src/
│   │   ├── config/       # Env and third-party config
│   │   ├── routes/       # API registrations
│   │   ├── handlers/     # Request orchestration
│   │   ├── middleware/   # Supabase Auth, CORS, etc
│   │   ├── services/     # Domain logic
│   │   ├── types/        # Backend TS types
│   │   ├── utils/        # Pure helpers
│   │   └── tests/        # Backend tests
│   ├── package.json      # Backend dependencies
│   ├── wrangler.toml     # Cloudflare config
├── database/             # SQL schema for Supabase (PostgreSQL)
│   ├── main.sql          # Canonical schema
│   ├── schemas/          # Per-table SQL
│   ├── migrations/       # Time-stamped upgrade scripts
│   └── seeds/            # Optional sample data
├── info/                 # Reference documentation
│   ├── authentication.md # Auth flows (Supabase Auth)
│   └── backend/          # Backend guides
├── package.json          # (optional) Monorepo scripts
├── tailwind.config.ts    # Tailwind/shadcn configuration
├── tsconfig.json         # TS project root config
└── ...                   # Lint, env, Vite config, etc
```

---

## 🛠️ Development

- **Install dependencies** (from project root):
  ```bash
  pnpm install
  ```
- **Start backend**:
  ```bash
  cd backend; pnpm run dev
  ```
- **Start frontend**:
  ```bash
  pnpm run dev  # from project root if configured, or cd src; pnpm run dev
  ```
- **Type-check/lint/build**:
  ```bash
  pnpm run type-check
  pnpm run lint
  pnpm run build
  ```

---

## 🙏 Acknowledgments

- Developed and maintained by **Ntwari K. Brian**.
- Special thanks for architecture, code quality, and documentation contributions.
- Inspired and empowered by the open-source community and all contributors.

---

Built with ❤️ using pnpm, TypeScript, React, Hono, Supabase, shadcn/ui, and more.
