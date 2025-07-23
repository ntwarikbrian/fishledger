# Copilot Instructions for LocalFishing SaaS Platform

## Architecture & Tech Stack
- **Frontend**: React.js + TypeScript, styled with Tailwind CSS, built using Vite. All UI code is in `src/`.
- **Backend**: Hono framework on Cloudflare Workers, written in TypeScript. Main backend code is in `backend/src/`.
- **Database**: PostgreSQL hosted on Supabase. Schemas and migrations are in `database/`.
- **Package Manager**: Use `npm` for all installs and scripts.

## Developer Workflows
- **Frontend**: Start with `npm run dev` (see tasks.json). Main entry: `src/main.tsx`. Use React functional components and hooks.
- **Backend**: Start with `npm run dev` in `backend/`. Main entry: `backend/src/index.ts`. Use Hono for routing and middleware.
- **Database**: Edit schemas in `database/main.sql` (all tables) and individual files (e.g., `database/schemas/users.sql`). Keep table data types small (e.g., `SMALLINT`, `VARCHAR(32)`) to save cost/space.
- **Migrations**: Add migration files in `database/migrations/` using the `{version}_{description}.sql` pattern. Run with Supabase CLI (`supabase db push`).

## Project Conventions
- **Comments**: Add clear, descriptive comments for all functions, classes, and complex logic.
- **Error Handling**: Use try/catch in async code. Return detailed error responses in backend handlers.
- **Code Organization**: Group code by feature (e.g., `handlers/`, `services/`, `middleware/`). Use TypeScript types for all data models.
- **Readability**: Prefer clear variable names, avoid magic numbers, and split large files into smaller modules.
- **Internationalization**: Use the i18n setup in `src/i18n.ts` for multi-language support.

## Integration Points
- **Supabase**: All database access goes through Supabase client (`backend/src/config/supabase.ts`).
- **Cloudinary**: File uploads and document management use Cloudinary (see backend handlers and docs).
- **JWT Auth**: Use JWT for authentication. See `backend/src/handlers/auth.ts`.

## Examples
- **React Component**: `src/components/Dashboard.tsx` (dashboard UI, charts, skeleton loading)
- **Backend Handler**: `backend/src/handlers/sales.ts` (sales transaction logic)
- **Migration File**: `database/migrations/001_add_audit_approval_workflow.sql`

## Suggestions for Improvement
- Add automated tests for critical backend routes and React components.
- Implement CI/CD for deployment to Cloudflare and Supabase.
- Add more granular role-based permissions.
- Optimize database queries for cost and speed.
- Expand documentation for onboarding new developers.



For questions or unclear conventions, review the relevant README files or ask for clarification.
To maximize productivity, Copilot agents should:
- Reference recent tasks, terminal outputs, and file changes when generating code or making decisions.
- Summarize previous actions and decisions in responses when relevant.
- Use workspace context (active tasks, terminal output, file edits) to avoid redundant work and maintain continuity.
- When asked to continue or iterate, review the last agent actions and outputs before proceeding.
- Always check for active tasks and terminal sessions before running new commands.
- Document important decisions or changes in comments or commit messages for future reference.
