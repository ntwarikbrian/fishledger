## FishLedger Codebase Rules

These rules define how we structure, name, and build features across the monorepo. They reflect our current stack: TypeScript everywhere, Cloudflare Workers backend with Hono, React + Vite frontend with shadcn/ui, and Tailwind.

### Monorepo layout
- **backend**: Cloudflare Workers app using Hono
  - `backend/src/index.ts`: worker entry; mounts routes and middleware
  - `backend/src/{routes,handlers,middleware,services,utils,config,types}`: see sections below
  - `wrangler.toml`: worker env/bindings; keep in sync with `config`
- **frontend**: React app (Vite)
  - `src/{components,pages,hooks,lib,services,config,contexts,types,utils}`
  - `src/components/ui`: shadcn/ui primitives; do not modify generated tokens ad‑hoc
- **database**: SQL schemas and migrations
  - `database/schemas`: canonical schema files
  - `database/migrations`: incremental migrations; never edit applied migrations, add new ones

---

### TypeScript conventions (full‑stack)
- **Strict TypeScript**: prefer explicit function signatures and exported types; avoid `any` and unsafe casts.
- **File naming**: kebab-case for files and folders, except React components use `PascalCase.tsx`.
- **Barrel exports**: avoid deep barrel trees; only create `index.ts` in leaf modules when it clearly simplifies imports.
- **Types vs interfaces**:
  - Use `type` for compositions, unions, utility types.
  - Use `interface` for object shapes intended for extension/implementation.
- **DTOs and schemas**:
  - Define request/response DTO types near the route/handler.
  - Co‑locate validation schemas (Zod or equivalent) with the handler and export the inferred types.
- **Error types**: create small tagged error types (e.g., `{ _tag: 'NotFoundError'; message: string }`) and handle centrally.

---

### Backend (Hono on Cloudflare Workers)
- **Structure**
  - `routes/`: route registration only (HTTP verbs, paths, attach middleware, delegate to handlers)
  - `handlers/`: request orchestration (validate input, call service, map domain errors to HTTP)
  - `services/`: domain logic and persistence orchestration; pure and testable
  - `middleware/`: cross‑cutting concerns (auth, rate‑limit, CORS, logging)
  - `config/`: environment bindings and configuration readers (Durable Objects, KV, R2, D1, secrets)
  - `types/`: shared backend types (Env, domain models)
  - `utils/`: pure helpers (parsers, mappers, formatters)
- **Entry**
  - Mount middleware at app level in `src/index.ts` (security headers, CORS). Mount route groups by feature (`/auth`, `/products`, `/sales`, etc.).
- **Env typing**
  - Define `Env` in `types` and use `Hono<{ Bindings: Env }>` so handlers get typed `c.env`.
  - Keep `wrangler.toml` and `config/*` in sync; add a single source of truth for binding names.
- **Validation**
  - Validate all inputs at the edge: params, query, body. Reject early with 400 and an error code.
  - Use a single `validationError(c, details)` helper for consistent responses.
- **Error handling**
  - Throw or return tagged errors from services; translate in handlers to HTTP codes.
  - Register a global `app.onError` to catch unexpected errors and return 500 with a request id.
- **Response shape**
  - JSON responses: `{ success: boolean; data?: T; error?: { code: string; message: string; details?: unknown } }`.
  - Prefer 2xx only when `success: true`.
- **Routing**
  - Version under `/api/v1` from the top. Breaking changes increment version.
  - Keep routes flat and resource‑oriented; nest by identity (`/sales/:id/audit`).
- **Performance and edge constraints**
  - Avoid Node‑only APIs; use Web/Fetch APIs (Workers runtime).
  - Stream large responses where possible; avoid large in‑memory buffers.
  - Timeouts: design idempotent operations; retries should be safe.

---

### Frontend (React + Vite + shadcn/ui)
- **Structure**
  - `components/`: reusable UI; domain‑agnostic pieces live under `components/ui` (shadcn). Feature‑specific components in feature folders.
  - `pages/`: route‑level screens; assemble components and data hooks.
  - `hooks/`: reusable hooks; do not fetch data inside components directly unless trivial.
  - `lib/`: framework‑agnostic utilities; `lib/api` for fetch clients and API wrappers.
  - `services/`: domain service facades for API calls; keep request/response mapping here.
  - `config/`: app‑level constants, navigation, API base URLs.
  - `contexts/`: app‑wide contexts (e.g., currency).
- **Component rules**
  - Use **controlled components** for forms; compose shadcn primitives.
  - Keep components small; extract subcomponents when they exceed ~200 lines or have distinct responsibilities.
  - Props must be typed; export prop types for reuse.
  - Prefer **composition over props** (children, slots) to avoid prop explosions.
- **Styling**
  - Tailwind for layout/spacing; encapsulate complex variants with `class-variance-authority` when needed.
  - Respect design tokens and themes in `tailwind.config.ts`; do not hardcode colors.
  - Dark mode: use semantic classes and shadcn/theming primitives.
- **Data and effects**
  - Data‑fetching lives in `hooks` or `services`; components subscribe via hooks.
  - Co-locate query keys and cache invalidations with services/hooks.
  - Handle loading/empty/error states explicitly with consistent UI patterns.

---

### Adding new backend features
1) Create a route group under `backend/src/routes/<feature>.ts` and mount under `/api/v1/<feature>`.
2) For each endpoint, add a handler in `backend/src/handlers/<feature>.<action>.ts`.
3) Add or extend a service in `backend/src/services/<feature>.ts`.
4) Define validation schemas next to the handler; export inferred types.
5) If storage changes are needed, add a migration in `database/migrations/NNN_<description>.sql` and a schema update in `database/schemas`.
6) Update `types/Env` and `wrangler.toml` if new bindings are required.

Naming examples:
- Route file: `routes/sales.ts`
- Handler: `handlers/sales.create.ts` exporting `createSaleHandler`
- Service: `services/sales.ts` exporting `createSale`

---

### Adding new frontend features
1) Create a feature directory if needed: `src/components/<Feature>/` for reusable pieces; keep screens in `src/pages`.
2) If you need reusable primitives, add to `src/components/ui` only when they are generic (and follow shadcn style).
3) Add a `service` file for API calls: `src/services/<feature>.ts`.
4) Add hooks for data/state: `src/hooks/use<Feature>*.ts`.
5) Keep types in `src/types` if cross‑feature; otherwise co‑locate with the feature.

Naming examples:
- Page: `pages/SalesPage.tsx`
- Feature component: `components/sales/SaleForm.tsx`
- UI primitive: `components/ui/Tag.tsx` (only if generic)
- Hook: `hooks/useSales.ts`
- Service: `services/sales.ts`

---

### shadcn/ui and modern design rules
- **Use primitives**: build features by composing shadcn primitives; avoid ad‑hoc bespoke components when a primitive fits.
- **Accessibility first**: leverage Radix underpinnings; ensure proper ARIA and keyboard support out of the box.
- **Consistency**: keep spacing, sizing, and typography consistent with tokens; avoid one‑off pixel values.
- **Variants**: prefer variants via `cva` over boolean prop soup; expose minimal public API.
- **Theming**: support light/dark; no inline color literals. Respect `className` passthrough for customization.
- **Icons**: use a single icon set consistently; size via Tailwind utilities.

---

### API contracts and versioning
- Add endpoints under `/api/v1`; breaking changes require `/api/v2`.
- Document request/response DTOs in handler files. Any change requires updating frontend `services` and `types`.
- Use consistent error codes and messages; avoid leaking internal error details.

---

### Database migrations
- One change per migration file; name as `NNN_action_subject.sql`.
- Never modify applied migrations; create new forward migrations and, if needed, explicit rollbacks.
- Test locally using provided migration scripts before merging.

---

### Testing and quality
- Keep domain logic in services to enable unit testing.
- Lint before commit; fix type errors immediately.
- Small, descriptive commits; prefix with scope: `[backend]`, `[frontend]`, `[db]`.

---

### Checklist for new work
- Types defined and exported; no `any`.
- Validation at boundaries; clear error handling.
- Files placed in correct folders; names follow conventions.
- UI uses shadcn primitives; follows tokens and variants.
- API service, hook, and page/component boundaries are respected.
- Migrations added if schema changed; environment updated if bindings changed.

---

### Examples
Backend endpoint flow:
1) `routes/products.ts` defines `POST /api/v1/products` → `createProductHandler`.
2) `handlers/products.create.ts` validates body → calls `services/products.createProduct`.
3) `services/products.ts` applies domain rules → persists → returns domain object.
4) Handler maps to `{ success: true, data }` with 201.

Frontend feature flow:
1) `services/products.ts` exposes `createProduct(dto)`.
2) `hooks/useCreateProduct.ts` wraps mutation and cache updates.
3) `components/products/ProductForm.tsx` is controlled, uses shadcn inputs.
4) `pages/ProductsPage.tsx` composes list + form; handles states.

---

If in doubt, mirror an existing, well‑structured feature and keep concerns isolated: routes → handlers → services on the backend; services → hooks → components → pages on the frontend.

---

### additions specific
- **Frontend stack**: Use React + TypeScript exclusively.
- **Backend stack**: Use Hono on Cloudflare Workers, written in TypeScript.
- **Package manager**: Standardize on pnpm. Do not mix package managers.
  - When chaining commands, use semicolons (e.g., `cd backend; pnpm run dev`), not `&&`.
- **Code comments policy**: Add comments where they add lasting value:
  - File/module headers: purpose, key responsibilities, and invariants.
  - Public functions/classes: succinct description, params, return, and notable errors.
  - Non-obvious logic: explain intent and constraints; keep comments updated when logic changes.
  - Avoid restating the obvious; prefer clear names over excessive comments.
- **Best practices**: Prioritize clear error handling, organized modules, and readability over cleverness.

---

### Database rules (Postgres on Supabase)
- **Platform**: Use Postgres hosted on Supabase.
- **Schema files**:
  - `database/main.sql`: contains the complete canonical schema (includes all tables and relations).
  - `database/schemas/<table>.sql`: one file per table (e.g., `users.sql`) containing only that table’s DDL.
  - Migrations under `database/migrations/NNN_<description>.sql` apply deltas; do not edit old migrations.
- **Data size and cost control**: prefer smallest suitable types:
  - Identifiers: `bigserial` only if required; otherwise `serial`/`int` or `int2` for small ranges.
  - Counts/flags: `smallint` or `boolean`.
  - Money/decimal: `numeric(12,2)` or tight precision as needed.
  - Short codes/enums: use PostgreSQL `enum` or `varchar(n)` with reasonable `n`; prefer `text` only when unbounded.
  - Timestamps: `timestamptz` for all time fields; index selectively.
  - Use `uuid` if global uniqueness is required (Supabase provides `gen_random_uuid()`).
  - Normalize where practical; avoid large JSON blobs for hot paths. Use `jsonb` only with purpose and indexes.

### Command usage
- Prefer `pnpm run <script>` over invoking binaries directly.
- Chain terminal commands with semicolons (`;`) not `&&`.
- Do not combine different package managers in the same repo; npm is the default.

### Security and output validation
- Validate inputs and outputs at boundaries.
  - Inputs: validate all params, query, body at the edge and reject early.
  - Outputs: validate and shape data against explicit response schemas before sending.
- Backend response validation and sanitization
  - Define response schemas (Zod or similar) per handler and `parse` before `c.json`.
  - Whitelist fields; never expose secrets, internal ids, or server-only metadata.
  - Normalize values (truncate long strings, clamp ranges, round decimals).
  - Encode/escape user-provided strings in any HTML contexts; return plain JSON strings otherwise.
  - Set strict headers via middleware: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`.
  - CORS: deny by default; allow only known origins/methods; avoid `*` with credentials.
  - Errors: return generic messages with stable error codes; do not leak stack traces.
  - Apply rate limiting on sensitive routes (auth, uploads) and abuse protections.
  - Database: parameterized queries only; enforce RLS/policies on Supabase where applicable.
- Frontend rendering safety
  - React escapes by default; avoid raw HTML. If required, sanitize with an allowlist (e.g., DOMPurify) before `dangerouslySetInnerHTML`.
  - Escape per-context when constructing attributes, URLs, or JS strings.
  - Exclude server-only fields at the type level in DTOs.
  - Enforce CSP aligned with asset domains; avoid inline scripts/styles unless hashed.
  - Validate file uploads client-side (type/size) and re-validate server-side.
  - Logging/analytics: exclude PII/secrets; strip user-provided content.
- Authorization and least privilege
  - Always verify ownership/tenancy in services before read/write.
  - Use least-privilege keys/roles for Supabase and third-party services.

