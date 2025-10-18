### Local Fishing SaaS – Project Structure and Delivery Plan

This document maps the current architecture, what’s already implemented, and the remaining work to ship a usable SaaS. It is structured for quick onboarding and execution.

## 1) High-level Architecture
- **Frontend (app)**: React + TypeScript (Vite), Tailwind CSS, shadcn/ui, i18n, modular pages and hooks.
  - Entry: `src/main.tsx`, `src/App.tsx`
  - UI: `src/components/ui/*`, layouts in `src/components/layout/*`
  - Feature pages: `src/pages/*` (Dashboard, Sales, Transactions, Reports, Settings, Staff, etc.)
  - Data access: `src/lib/api/*`, `src/services/*`, feature hooks in `src/hooks/*`
  - Config: `src/config/api.ts`, `src/config/navigation.ts`, i18n via `src/i18n.ts`

- **Backend (api)**: Cloudflare Workers + Hono framework (TypeScript)
  - Entry: `backend/src/index.ts` (middleware stack, route mounting, error handling, CORS, rate limit)
  - Config: `backend/src/config/*` (env validation, Supabase client, Cloudinary config)
  - Routes: `backend/src/routes/*` (grouped API, health, debug); handlers in `backend/src/handlers/*`
  - Middleware: `backend/src/middleware/*` (request id/timing, logger, CORS, DB, rate limiting, error handler)
  - Services: `backend/src/services/*` (PDF generation, report queries)
  - Types: `backend/src/types/index.ts`
  - Infra: `backend/wrangler.toml` (deploy to Cloudflare), scripts and tests in `backend/*`

- **Database (data)**: PostgreSQL (Supabase). SQL first with migrations.
  - Master schema: `database/main.sql` (21+ tables, RLS policies, triggers)
  - Per-table schemas: `database/schemas/*`
  - Migrations: `database/migrations/*` with helpers `run-migration.js`, `apply_migration.sql`
  - Seeds: `database/seeds/*`
  - Docs: data isolation, worker password migration, migration guides

## 2) Data Model (summary)
- Core entities: `users`, `workers`, `worker_permissions`, `product_categories`, `products`, `sales`, `transactions`, `deposits`, `expenses`, `expense_categories`, `contacts`
- Inventory management: `stock_additions`, `stock_corrections`, `stock_movements`, `damaged_products`
- Files and docs: `folders`, `files` (Cloudinary metadata + folder stats triggers)
- Messaging: `messages`, `message_settings`, `automatic_messages`
- Auditing: `sales_audit`
- RLS and indexes for data isolation and performance across key tables

## 3) Current Capabilities (implemented)
- Frontend
  - Dashboard UI with stats, charts (Recharts), responsive mobile/desktop layouts
  - Pages: Sales, Transactions, Reports, Expenses, Settings, Staff, Customers, Documents, Help, Auth pages (Login/Register/ForgotPassword)
  - Hooks for feature data: dashboard, sales, expenses, categories, deposits, transactions, audits, notifications
  - i18n scaffold (English + Kinyarwanda locales) and currency context
  - UI library and design system components (shadcn/ui), theming via `ThemeProvider`

- Backend
  - Hono app with robust middleware: request id/timing, logging (dev/prod), CORS (dev/prod), rate limiting, error handling
  - Environment validation and Supabase config validation on each request
  - Organized routes and feature handlers (`auth`, `products`, `sales`, `transactions`, `reports`, `files`, `folders`, `settings`, `workers`, etc.)
  - PDF/report services

- Database
  - Comprehensive schema with constraints, indexes, and triggers
  - Inventory logic for box/kg flows and stock events; audit trail for sales
  - Transactions denormalization and auto-creation from sales via triggers
  - Messaging settings for email/WhatsApp integration placeholders
  - Data isolation policies and performance indexes across major tables

## 4) Gaps and Assumptions
- Authentication/authorization
  - Backend `auth`/`googleAuth` handlers exist; confirm JWT flow, refresh tokens, and worker session fields are fully wired.
  - Worker RBAC exists at DB level (`worker_permissions`), but ensure end-to-end enforcement in API middleware and frontend route guards.
- File storage
  - Cloudinary config present; verify upload endpoints, signed uploads, and cleanup flows.
- Messaging
  - `message_settings` and `automatic_messages` modeled; send pipelines (email/WhatsApp) likely need service integration + background processing.
- Multitenancy
  - Data isolation via user_id enforced; ensure every API path validates tenant scope.
- Payments/Billing
  - No subscription/billing integration observed; needed for SaaS.
- Observability
  - Logging present; add error tracking, analytics, uptime/health checks.
- Deployment
  - Wrangler config present; ensure CI/CD, env management across dev/staging/prod.

## 5) Remaining Work to Reach “Usable SaaS”

### A) Authentication, Users, and Access Control
1. Finalize owner and worker auth flows (register, login, logout, refresh, password reset)
2. Route guards and session management in frontend; token storage and renewal
3. Enforce RBAC: API middleware reads `worker_permissions`; UI hides/disables per-permission
4. Onboarding wizard post-signup: set business profile, currency, language, seed categories

### B) Billing, Plans, and Trials
1. Integrate Stripe (or Paddle) for subscriptions: free trial, monthly/yearly plans
2. Webhooks and seat management (workers as seats?); plan enforcement in API
3. Billing UI: manage plan, payment methods, invoices

### C) Productization and Data Integrity
1. Validate all API routes return tenant-scoped data; add tests for cross-tenant access
2. Harden input validation with Zod on both client and server
3. Finalize inventory workflows: additions, corrections, damage approvals (if required) and stock movements linkage
4. Sales workflows: partial payments, edits with audit trail approvals

### D) Files and Cloudinary
1. Secure upload endpoints (signed uploads), max sizes, mime validation
2. Folder lifecycle and automatic stats (already in DB) surfaced in UI
3. Deletion/retention policies and cleanup jobs

### E) Messaging and Notifications
1. Email sending service (SMTP provider or transactional email) using `message_settings`
2. WhatsApp integration via WHAPI: service + UI in Settings
3. Automatic messages for low stock/thresholds; scheduler hooks (cron Workers) and rate limits

### F) Reports and PDFs
1. Ensure all business reports are accurate and downloadable; harden `pdfService`
2. Add export formats (CSV/XLSX) for sales/transactions

### G) Observability and SRE
1. Error tracking (Sentry or similar) in frontend and backend
2. Request metrics, latency, rate limit dashboards
3. Health/readiness routes and uptime monitoring

### H) Security and Compliance
1. Secrets management; rotate keys; secure env validation
2. Strong CORS configuration per environment
3. Data backups and restore runbooks (Supabase backups); retention policies
4. Privacy Policy, Terms, Cookies; cookie consent if needed

### I) Performance and UX
1. API pagination, caching, and optimistic UI updates
2. Mobile UX polish; skeletons added—ensure all feature pages have loading/error/empty states
3. Accessibility pass (ARIA, color contrast)

### J) QA, CI/CD, and Release
1. Expand unit/integration tests backend; add E2E (Playwright/Cypress) for key flows
2. GitHub Actions: lint, type-check, build, test, deploy (preview + production)
3. Staging environment with seed data and feature flags

## 6) Prioritized Roadmap (phased)
- Phase 1: Core Access and Data Safety
  - Ship owner signup/login, password reset; basic worker invites
  - Lock tenant isolation in every endpoint; add auth middleware gate everywhere
  - Stripe checkout + plans + trial; restrict features by plan

- Phase 2: Inventory and Sales Completeness
  - Finish products, stock additions/corrections/damages flows end-to-end
  - Sales creation/editing with audits; transactions auto-sync verified; reporting MVP

- Phase 3: Messaging and Files
  - Email + WhatsApp configuration and sending; thresholds -> automatic messages
  - Cloudinary uploads from UI, secure delete; documents page production-ready

- Phase 4: Product Quality and Ops
  - Observability (Sentry, logs, metrics) + uptime
  - Accessibility, i18n completeness, performance
  - CI/CD, staging, data backups, incident runbooks

## 7) Environment & Deployment
- Environments: `.env` for frontend, Wrangler secrets for Workers, Supabase project vars
- Dev: `wrangler dev` for backend; `npm run dev` for frontend
- Staging/Prod: `wrangler deploy`; frontend to a CDN/host (e.g., Netlify/Vercel/Cloudflare Pages)
- Database migrations: `database/run-migration.js` and SQL files in `database/migrations/*`

## 8) Acceptance Checklist for “Usable to Users”
- Auth: signup/login/logout + password reset + email verification (optional)
- Billing: trial + plan + checkout + cancellation
- Inventory: create/edit products; add/correct/damage stock; low-stock alert
- Sales: create/edit; partial payments; transactions generated; basic reports
- Files: upload/view/delete; folder stats accurate
- Messaging: configure email/WhatsApp; send test; threshold notification works
- Settings: currency/language; business profile
- Stability: monitored, error tracked, rate-limited, recoverable from failures

## 9) Action Items (next up)
1. Finalize auth/worker flows and front-route guards
2. Add Stripe subscription with plan gating
3. Verify multitenant scoping on all handlers and add tests
4. Implement secure Cloudinary uploads end-to-end
5. Wire messaging services and basic notifications
6. Add error tracking + CI pipeline for build/test/deploy

— End —


