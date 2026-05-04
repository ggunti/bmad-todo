---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
lastStep: 8
status: 'complete'
completedAt: '2026-05-04'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-input-draft.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'todo-bmad'
user_name: 'Guntter'
date: '2026-05-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

29 FRs organized into 7 groups:

| Group | FRs | Architectural implication |
|---|---|---|
| Todo Viewing & List State | FR-001 – FR-006 | List rendering with 4 states (loading, empty, populated, error); completion visual distinction; user-defined ordering |
| Todo Creation | FR-007 – FR-010 | Input validation (empty, max-length) on client AND server; auto-focus on load; Enter + button submission |
| Todo Modification, Reordering & Deletion | FR-011 – FR-015 | Toggle, delete, clear-all (with confirmation dialog), drag-and-drop reorder with keyboard parity |
| Optimistic UI & Failure Handling | FR-016 – FR-018 | Every CRUD mutation updates UI before server response; per-item rollback on failure; inline retry without re-entry |
| Session & Persistence | FR-019 – FR-023 | Anonymous HttpOnly cookie; backend persistence keyed by session; 24h+ durability; clear-all decoupled from session; user isolation |
| Page Metadata & Shareability | FR-024 – FR-026 | Title, description, favicon, OG/Twitter Card meta, noindex/nofollow |
| Deployment & Reviewability | FR-027 – FR-029 | Docker Compose; README install path ≤ 10 min; FR-to-code traceability |

**Non-Functional Requirements:**

29 NFRs across 9 categories:

| Category | Key constraints |
|---|---|
| Performance | TTI ≤ 1.5s (mobile broadband); FCP ≤ 800ms (warm); CRUD p95 ≤ 200ms localhost / ≤ 500ms prod; UI update ≤ 50ms |
| Reliability & Persistence | Zero data loss on backend restart; 24h+ cross-session restore; graceful degradation when backend unreachable |
| Security | HTTPS; HttpOnly + SameSite=Lax cookie; XSS prevention; CSRF protection; server-side input validation |
| Privacy | Data minimization; cookie disclosure; 90-day idle data TTL |
| Accessibility | Keyboard-operable (all CRUD); visible focus; axe-clean (not full WCAG AA) |
| Browser Compatibility | Last 2 versions of Chrome, Firefox, Safari, Edge; 320–1920px viewport range |
| Maintainability | Linter clean; type-checker clean; test coverage on persistence logic |
| Observability | Server error logging to stdout/stderr; no client telemetry |
| Portability & Deployment | Container-only via Docker Compose; config via env vars |

**Scale & Complexity:**

- Primary domain: full-stack web (SPA + JSON REST API)
- Complexity level: low (single entity, no auth, no integrations)
- Estimated architectural components: ~6 (frontend SPA, backend API, data store, session management, Docker orchestration, static asset serving)

### Technical Constraints & Dependencies

| Constraint | Source | Architectural impact |
|---|---|---|
| Tailwind CSS as styling layer | UX spec (locked) | Frontend build must support Tailwind; tree-shaking critical for TTI budget |
| IBM Plex Sans webfont | UX spec (locked) | Font loading strategy needed (font-display: swap); impacts FCP |
| Headless dialog primitive | UX spec (locked) | Library chosen after framework decision (Radix / React Aria / Headless UI / Melt UI) |
| Headless drag-and-drop primitive | UX spec (locked) | Candidate set: dnd-kit, react-aria DnD, @formkit/drag-and-drop, SortableJS |
| Docker Compose deployment | PRD FR-027, NFR-028 | All services containerized; no host-installed runtimes |
| No auth in v1 | PRD scoping | Session management via opaque cookie only; no user model, no password storage |
| Server-side validation mirrors client | NFR-012 | Shared validation rules or duplicated logic; architecture must decide |
| Config via environment variables | NFR-029 | No hardcoded prod values; Docker Compose env file strategy |
| Container-friendly logging | NFR-026 | stdout/stderr, structured enough for post-hoc debugging |

### Cross-Cutting Concerns Identified

| Concern | Where it surfaces | Architecture must address |
|---|---|---|
| Optimistic UI + rollback | FR-016/017/018; every CRUD mutation | Client-side state management pattern; per-item failure tracking; retry queue |
| Session/cookie management | FR-019–023; NFR-008/009 | Cookie issuance on first visit; session-to-data mapping; cookie security attributes |
| Input validation (dual) | FR-010; NFR-012 | Client and server both enforce empty/max-length; consider shared validation schema or accept duplication |
| Error handling patterns | FR-006/017/018; NFR-007 | Consistent error response shape from API; client error-state machine per item |
| Accessibility | NFR-016/017/018; FR-014 keyboard reorder | Framework + primitive choices must support aria attributes, focus management, aria-live |
| Responsive design | NFR-019/020/021 | Single CSS breakpoint at 640px; mobile-first; no JS-driven responsive logic |
| Data durability | NFR-005/006; NFR-015 | Backend store must survive process restart; 90-day idle TTL requires cleanup mechanism |
| Security posture | NFR-008–012 | HTTPS in prod; cookie flags; XSS prevention (framework-level); CSRF strategy |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web: React SPA frontend + Express JSON REST API backend + PostgreSQL, all TypeScript.

### Starter Options Considered

| Option | Verdict | Rationale |
|---|---|---|
| Full-stack starters (T3, RedwoodJS, Blitz) | Rejected | Assume SSR (Next.js), tRPC, or opinionated ORMs; PRD says no SSR; stripping-out cost exceeds setup cost |
| Community React starters (Commencis, vite-react-boilerplate) | Rejected | Bundle Redux, i18n, Storybook, React Router — features not needed in a single-route SPA with ~17 components |
| Community Express starters (express-typescript-starter, express-api-starter) | Rejected | Bundle JWT auth, rate limiting, DI frameworks, Redis — all out of scope for v1 |
| **Official Vite `react-ts` template + hand-rolled Express** | **Selected** | Minimal, well-maintained, zero stripping required; project is small enough that a minimal setup is cleaner |

### Selected Starter: Vite `react-ts` (frontend) + hand-rolled Express TypeScript (backend)

**Rationale for Selection:**

The project has ~5 API endpoints, 1 data entity, and 17 UI components. Community starters are designed for larger projects and would introduce more opinions to override than decisions to save. The official Vite template provides the build tooling, HMR, and TypeScript setup — the things that are genuinely tedious to configure from scratch — without bundling application-level opinions.

The backend has no auth, no rate limiting, no complex middleware chains, no ORM migration system — a minimal Express + TypeScript setup with a PostgreSQL client is the right scale.

**Project Structure:**

```
todo-bmad/
├── frontend/              # Vite React SPA
├── backend/               # Express API
├── docker-compose.yml     # Orchestrates frontend, backend, PostgreSQL
├── .env.example           # Environment variable template
├── README.md              # Reviewer install guide
└── _bmad-output/          # Planning artifacts (existing)
```

**Initialization Commands:**

```bash
# Frontend (Vite React TypeScript template)
npm create vite@latest frontend -- --template react-ts

# Backend (hand-rolled, initialized manually)
mkdir backend && cd backend && npm init -y
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript 5.9.x with strict mode
- Node.js 20.19+ or 22.12+
- ESM modules

**Frontend Stack (from Vite template + additions):**
- Vite 8.0.10 — build tool, dev server, HMR
- React 19.2.5 — UI framework
- Tailwind CSS 4.2.4 — styling (added post-scaffold)
- @dnd-kit/react 0.4.0 — drag-and-drop reorder (added post-scaffold)
- @radix-ui/react-dialog 1.1.15 — Clear-all confirmation dialog (added post-scaffold)

**Backend Stack (hand-rolled):**
- Express 5.2.1 — HTTP framework
- PostgreSQL — data store (client library TBD in architecture decisions)
- TypeScript with tsup or tsx for development

**Build Tooling:**
- Vite for frontend bundling and tree-shaking (critical for TTI budget)
- Docker multi-stage builds for production images

**Testing Framework:**
- Vitest (frontend) — aligned with Vite ecosystem
- Vitest (backend) — single test runner across the monorepo

**Code Organization:**
- Monorepo with `frontend/` and `backend/` directories
- Shared Docker Compose at root
- Separate `package.json` per workspace

**Development Experience:**
- Vite dev server with React Fast Refresh (frontend)
- tsx or nodemon with ts-node for backend hot reload
- Single `docker-compose up` for full-stack development

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data access layer (Prisma) — must be set up before any API endpoint
- State management (TanStack Query) — must be set up before any UI-to-API interaction
- Session/cookie strategy — must be set up before any data is persisted per-user

**Important Decisions (Shape Architecture):**
- API endpoint design — shapes frontend-backend contract
- Error response format — shapes failure handling across the stack
- Shared validation — prevents client/server rule drift
- Static asset serving — shapes Docker and deployment configuration

**Deferred Decisions (Post-MVP):**
- Caching strategy — not needed at v1 scale
- Rate limiting — not needed without auth or public API
- CI/CD pipeline — deferred; v1 deploys via Docker Compose locally
- Scaling strategy — single-user demo, not a concern

### Data Architecture

**Database:** PostgreSQL (decided in Step 3)

**ORM:** Prisma 7.8.0
- Rationale: Type-safe queries generated from a declarative schema; built-in migration system; schema file serves as single source of truth for the data model; good fit even for a single-entity project because the migration tooling and type generation cost nothing at this scale and prevent raw-SQL drift.
- Affects: Backend API layer, Docker Compose (Prisma needs a migration step on startup)

**Schema (single entity):**

```prisma
model Todo {
  id          String   @id @default(uuid())
  sessionId   String
  text        String   @db.VarChar(1024)
  completed   Boolean  @default(false)
  sortOrder   Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([sessionId])
}
```

**Migration strategy:** Prisma Migrate. Migrations run as part of the Docker entrypoint (`prisma migrate deploy`) so the database is always in sync with the schema on container start.

**Data validation:** Zod 4.4.3
- Shared validation schemas in a `shared/` directory at the monorepo root (or inlined in both frontend and backend if a shared package adds too much monorepo tooling overhead for a 2-rule schema).
- Two validation rules: (1) text must not be empty/whitespace-only; (2) text must be ≤ 1024 characters.
- Client uses Zod for immediate validation before optimistic insert. Server uses the same Zod schema as the authority (NFR-012).

**Data retention:** 90-day idle TTL (NFR-015). Implemented as a scheduled cleanup query (e.g., a simple cron job or a Prisma script run periodically) that deletes sessions with no activity in 90 days. For v1, this can be a manual script documented in the README; automated scheduling is a post-MVP concern.

### Authentication & Security

**Authentication:** None in v1 (PRD scoping). Anonymous cookie-scoped sessions only.

**Session/cookie implementation:** Custom middleware (~20 lines)
- On each request, read the session cookie. If absent, generate a UUIDv4, set it as an HttpOnly cookie, and proceed.
- Cookie attributes: `HttpOnly`, `SameSite=Lax`, `Secure` (in production), `Path=/`, `Max-Age=7776000` (90 days, matching NFR-015 TTL).
- The session ID is passed to route handlers via Express request context.
- Rationale: express-session is designed for server-side session stores with data; we only need an opaque identifier. Custom middleware is simpler and avoids a dependency + session store table.

**CSRF strategy:** SameSite=Lax is sufficient; no CSRF token in v1.
- Rationale: The cookie identifies an anonymous session with no privileges. An attacker forging a cross-site POST would only modify todos in the attacker's own browser session (since the cookie wouldn't be sent cross-site under Lax). The attack surface is negligible.

**XSS prevention:** React's JSX escaping handles output encoding by default. Todo text is always rendered as text content, never as `dangerouslySetInnerHTML`. Server stores text as-is (no HTML encoding on write; encoding is the rendering layer's job). Prisma parameterized queries prevent SQL injection.

**Security middleware:** Helmet.js for standard HTTP security headers (X-Content-Type-Options, X-Frame-Options, etc.). Minimal configuration — defaults are fine for v1.

### API & Communication Patterns

**API style:** RESTful JSON over HTTP. All endpoints prefixed with `/api`.

**Endpoints:**

| Method | Path | Purpose | Request body | Response |
|---|---|---|---|---|
| GET | `/api/todos` | List all todos for session | — | `{ todos: Todo[] }` |
| POST | `/api/todos` | Create a new todo | `{ text: string }` | `{ todo: Todo }` |
| PATCH | `/api/todos/:id` | Toggle completion | `{ completed: boolean }` | `{ todo: Todo }` |
| PATCH | `/api/todos/reorder` | Update sort order | `{ orderedIds: string[] }` | `{ success: true }` |
| DELETE | `/api/todos/:id` | Delete a single todo | — | `{ success: true }` |
| DELETE | `/api/todos` | Clear all todos | — | `{ success: true }` |

**Error response format:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Todo text cannot be empty"
  }
}
```

Standard error codes: `VALIDATION_ERROR`, `NOT_FOUND`, `SESSION_ERROR`, `INTERNAL_ERROR`. HTTP status codes used conventionally (400, 404, 500).

**CORS:** Not needed in production (frontend and API served from the same origin by Express). In development, Vite's proxy handles `/api` requests to the Express dev server, avoiding CORS entirely.

### Frontend Architecture

**State management:** TanStack Query 5.100.8
- Rationale: First-class support for optimistic mutations with automatic rollback on failure — the single hardest UX requirement in this project (FR-016/017/018). Handles cache invalidation, background refetching, and retry out of the box.
- `useQuery` for the todo list fetch.
- `useMutation` with `onMutate` (optimistic update), `onError` (rollback), `onSettled` (refetch) for all CRUD operations.
- Per-item failure state tracked via a local React state map (`Map<todoId, FailedMutation>`) that TanStack Query's `onError` populates. This drives the per-row failure indication in the UI.

**Component architecture:** Functional components with hooks. No class components. Component tree mirrors the UX spec's component inventory (17 components). Co-located Tailwind utility classes (no separate CSS files).

**Routing:** None. Single-page, single-route app. No React Router.

**Font loading:** IBM Plex Sans loaded via `<link rel="preload">` in `index.html` with `font-display: swap`. Fallback chain: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

**Bundle optimization:** Vite's tree-shaking + code splitting handles this automatically. The total dependency set is small (React, TanStack Query, dnd-kit, Radix Dialog, Zod, Tailwind runtime is CSS-only). No lazy loading needed for a single-view app.

### Infrastructure & Deployment

**Docker Compose services:**

| Service | Image | Purpose |
|---|---|---|
| `app` | Node.js (multi-stage build) | Express serves API + Vite production build (static files) |
| `db` | `postgres:17-alpine` | PostgreSQL database |

Two containers total. The `app` container runs Prisma migrations on startup, then starts Express.

**Development workflow:**
- `docker-compose up db` — start PostgreSQL only
- Frontend: `cd frontend && npm run dev` (Vite dev server with proxy to Express)
- Backend: `cd backend && npm run dev` (tsx watch mode)
- OR: `docker-compose up` — full stack in containers (for reviewer install path)

**Environment variables (NFR-029):**

| Variable | Purpose | Default (dev) |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://todo:todo@localhost:5432/todo_bmad` |
| `PORT` | Express listen port | `3001` |
| `NODE_ENV` | Environment flag | `development` |
| `COOKIE_SECRET` | Cookie signing key (if signed cookies used) | `dev-secret` |
| `COOKIE_SECURE` | Set Secure flag on cookie | `false` (dev), `true` (prod) |

**Logging (NFR-026):** `console.log` / `console.error` to stdout/stderr. No structured logging library in v1 — the scale doesn't justify it. Errors include request path, session ID (hashed), and stack trace.

**Static asset serving (production):** Express serves the Vite `dist/` directory as static files. A single catch-all route serves `index.html` for the SPA. API routes are matched first (`/api/*`), then static files, then the SPA fallback.

**Test coverage target (NFR-024):** Backend persistence logic (Prisma queries + session middleware) must have meaningful integration tests. Specific percentage: **≥ 80% line coverage on `backend/src/routes/` and `backend/src/middleware/`**. Frontend component tests are recommended but not gated.

### Decision Impact Analysis

**Implementation Sequence:**
1. Docker Compose + PostgreSQL container
2. Backend: Express + Prisma setup + session middleware
3. Backend: API endpoints (CRUD)
4. Frontend: Vite + React + Tailwind setup
5. Frontend: TanStack Query integration + optimistic UI
6. Frontend: Components (UX spec Wave 1 → 2 → 3)
7. Integration: Express serves Vite build
8. Testing + verification

**Cross-Component Dependencies:**
- Prisma schema defines the data shape → API response shape → TanStack Query cache shape → Component props
- Zod validation schemas used by both frontend (pre-submit) and backend (route handlers)
- Session cookie middleware must be in place before any CRUD endpoint works
- TanStack Query's optimistic mutation pattern depends on the API error response format being consistent

## Implementation Patterns & Consistency Rules

### Naming Conventions

**Database (Prisma schema):**
- Model names: PascalCase singular (`Todo`)
- Fields: camelCase (`sortOrder`, `sessionId`, `createdAt`)
- Prisma handles SQL-level naming automatically

**API:**
- Endpoints: plural nouns, lowercase (`/api/todos`)
- JSON fields: camelCase — matches Prisma's default serialization
- Query params: camelCase

**Files:**
- React components: PascalCase (`TodoCard.tsx`, `InlineValidation.tsx`)
- Non-component TypeScript: kebab-case (`session-middleware.ts`, `todo-routes.ts`)
- Test files: co-located, same name + `.test` suffix (`todo-routes.test.ts`, `TodoCard.test.tsx`)
- Config files: standard names (`vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`)

**Code:**
- Functions/variables: camelCase (`getTodos`, `sessionId`)
- Types/interfaces: PascalCase (`Todo`, `CreateTodoInput`)
- Constants: UPPER_SNAKE_CASE (`MAX_TODO_LENGTH = 1024`)
- React hooks: `use` prefix (`useTodos`, `useCreateTodo`)
- Boolean variables: `is`/`has` prefix (`isCompleted`, `hasFailed`)

### Structure Patterns

**Frontend (`frontend/src/`):**

```
src/
├── components/          # All UI components (flat, not nested by feature)
│   ├── Wordmark.tsx
│   ├── TodoInput.tsx
│   ├── TodoCard.tsx
│   ├── TodoList.tsx
│   └── ...
├── hooks/               # Custom hooks (TanStack Query wrappers)
│   ├── useTodos.ts
│   ├── useCreateTodo.ts
│   └── ...
├── api/                 # API client functions (fetch wrappers)
│   └── todos.ts
├── validation/          # Zod schemas
│   └── todo.ts
├── types/               # Shared TypeScript types
│   └── todo.ts
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Tailwind imports + CSS custom properties
```

Components are flat by type — the app has one feature. No barrel files (`index.ts` re-exports) — direct imports only.

**Backend (`backend/src/`):**

```
src/
├── routes/              # Express route handlers
│   └── todos.ts
├── middleware/           # Express middleware
│   └── session.ts
├── validation/          # Zod schemas
│   └── todo.ts
├── prisma/              # Prisma client instance
│   └── client.ts
├── app.ts               # Express app setup (middleware, routes, static serving)
└── server.ts            # Entry point (listen)
```

### Format Patterns

**API responses:**
- Success: `{ todos: [...] }` or `{ todo: {...} }` or `{ success: true }` — always an object, never a raw array or bare value
- Error: `{ error: { code: "VALIDATION_ERROR", message: "..." } }` — always this shape
- HTTP status codes: 200 (success), 201 (created), 400 (validation), 404 (not found), 500 (server error)

**Dates:** ISO 8601 strings in JSON (`"2026-05-04T12:00:00.000Z"`). Prisma serializes `DateTime` this way by default.

**IDs:** UUIDs as strings (Prisma `@default(uuid())`).

**Null handling:** `null` for explicitly absent optional fields. Never `undefined` in JSON. For the v1 Todo entity, all fields are non-nullable.

### Process Patterns

**Optimistic UI mutation pattern (all CRUD mutations follow this exactly):**

```typescript
useMutation({
  mutationFn: apiCall,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], optimisticUpdate);
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['todos'], context.previous);
    setFailedMutations(prev => prev.set(itemId, { error, retry }));
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

Every CRUD mutation uses this structure. No variation.

**Error handling layers:**
1. **API route handler:** try/catch around Prisma calls; caught errors return the standard error JSON shape; uncaught errors hit a global Express error handler that logs + returns 500
2. **Frontend API client:** `fetch` wrapper that throws on non-2xx responses, parsing the error JSON body
3. **TanStack Query `onError`:** rolls back optimistic update + populates failure state map
4. **React Error Boundary:** wraps the app root as a last-resort catch for render errors; shows a simple "Something went wrong" fallback

**Import ordering (enforced by ESLint):**
1. React / external library imports
2. Internal absolute imports (components, hooks, api, types)
3. Relative imports
4. CSS imports last

**Export style:** Named exports only. No default exports (except root `App` component which Vite requires as default). Prevents import name inconsistencies.

### Enforcement Guidelines

**All AI agents MUST:**
- Follow the naming conventions above — no exceptions, no "I prefer" overrides
- Place files in the directory structure defined above — no new top-level directories without explicit discussion
- Use the exact optimistic UI mutation pattern for all CRUD operations
- Use the exact error response shape for all API endpoints
- Use named exports (no default exports except `App`)
- Co-locate test files with their source files
- Never add a dependency not listed in the architecture document without discussion

**Verification:**
- TypeScript strict mode catches type mismatches
- ESLint enforces import ordering and naming conventions
- Prisma schema is the single source of truth for the data model
- The architecture document is the single source of truth for patterns

## Project Structure & Boundaries

### Complete Project Directory Structure

```
todo-bmad/
├── README.md                          # Reviewer install guide (FR-028)
├── docker-compose.yml                 # Orchestrates app + db (FR-027)
├── .env.example                       # Environment variable template (NFR-029)
├── .gitignore
├── _bmad-output/                      # Planning artifacts (existing)
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts                 # Vite config + dev proxy to backend
│   ├── index.html                     # SPA shell + meta tags (FR-024/025/026) + font preload
│   ├── public/
│   │   └── favicon.ico                # Favicon (FR-024)
│   └── src/
│       ├── main.tsx                   # React entry point + QueryClientProvider
│       ├── App.tsx                    # Root component + Error Boundary
│       ├── index.css                  # Tailwind imports + CSS custom properties (design tokens)
│       ├── components/
│       │   ├── Wordmark.tsx           # UX component 1
│       │   ├── TodoInput.tsx          # UX components 2+3+4 (input + add button + validation)
│       │   ├── TodoList.tsx           # UX component 5 (list container)
│       │   ├── TodoCard.tsx           # UX component 6 (composite card)
│       │   ├── Checkbox.tsx           # UX component 7
│       │   ├── DragHandle.tsx         # UX component 8
│       │   ├── DeleteButton.tsx       # UX component 9
│       │   ├── DiagonalHairline.tsx   # UX component 10
│       │   ├── FailureIndication.tsx  # UX component 11
│       │   ├── EmptyState.tsx         # UX component 12
│       │   ├── LoadingState.tsx       # UX component 13
│       │   ├── ErrorState.tsx         # UX component 14
│       │   ├── Footer.tsx             # UX component 15
│       │   └── ClearAllDialog.tsx     # UX component 16 (Radix Dialog)
│       ├── hooks/
│       │   ├── useTodos.ts            # useQuery wrapper for GET /api/todos
│       │   ├── useCreateTodo.ts       # useMutation for POST /api/todos
│       │   ├── useToggleTodo.ts       # useMutation for PATCH /api/todos/:id
│       │   ├── useDeleteTodo.ts       # useMutation for DELETE /api/todos/:id
│       │   ├── useReorderTodos.ts     # useMutation for PATCH /api/todos/reorder
│       │   ├── useClearAllTodos.ts    # useMutation for DELETE /api/todos
│       │   └── useFailedMutations.ts  # Per-item failure state tracking
│       ├── api/
│       │   └── todos.ts              # fetch wrappers for all API endpoints
│       ├── validation/
│       │   └── todo.ts               # Zod schema (shared rules)
│       └── types/
│           └── todo.ts               # Todo, CreateTodoInput, ApiError types
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma             # Data model (single Todo entity)
│   │   └── migrations/               # Prisma Migrate output
│   └── src/
│       ├── server.ts                  # Entry point (listen + startup log)
│       ├── app.ts                     # Express app (middleware stack + routes + static serving)
│       ├── middleware/
│       │   ├── session.ts             # Cookie session middleware (FR-019)
│       │   ├── session.test.ts        # Session middleware tests
│       │   └── error-handler.ts       # Global error handler (NFR-026)
│       ├── routes/
│       │   ├── todos.ts               # All /api/todos route handlers
│       │   └── todos.test.ts          # Route handler integration tests
│       ├── validation/
│       │   └── todo.ts                # Zod schema (same rules as frontend)
│       └── prisma/
│           └── client.ts              # Prisma client singleton
│
└── scripts/
    └── cleanup-stale-sessions.ts      # 90-day idle data purge (NFR-015)
```

### Architectural Boundaries

**API boundary (the single integration surface):**

Frontend knows nothing about Prisma, PostgreSQL, or session implementation. Backend knows nothing about React, TanStack Query, or UI state. They communicate exclusively through:
- `/api/todos` endpoints (defined in Core Architectural Decisions)
- The JSON response shapes (defined in Core Architectural Decisions)
- The session cookie (set by backend, sent automatically by browser)

**Data flow:**

```
User input → React component → TanStack Query mutation
  → optimistic cache update (immediate UI)
  → fetch() to /api/todos → Express route handler
  → session middleware extracts sessionId from cookie
  → Zod validates input → Prisma query → PostgreSQL
  → JSON response → TanStack Query reconciliation
  → (on error) rollback + failure state map → per-row failure UI
```

**Component boundaries (frontend):**

```
App (QueryClientProvider + ErrorBoundary)
└── Wordmark
└── TodoInput (owns input state + validation + add mutation)
└── TodoList (receives todos from useTodos hook)
    └── TodoCard × N (receives single todo + mutation hooks)
        ├── DragHandle
        ├── Checkbox (owns toggle mutation)
        ├── Todo text
        ├── DeleteButton (owns delete mutation)
        ├── DiagonalHairline (conditional, completed only)
        └── FailureIndication (conditional, failed only)
└── EmptyState / LoadingState / ErrorState (conditional, replaces TodoList)
└── Footer
    └── ClearAllDialog (owns clear-all mutation)
```

### Requirements to Structure Mapping

| FR Group | Frontend files | Backend files |
|---|---|---|
| Todo Viewing (FR-001–006) | `TodoList`, `TodoCard`, `EmptyState`, `LoadingState`, `ErrorState`, `useTodos` | `routes/todos.ts` (GET handler) |
| Todo Creation (FR-007–010) | `TodoInput`, `useCreateTodo`, `validation/todo.ts` | `routes/todos.ts` (POST handler), `validation/todo.ts` |
| Modification & Deletion (FR-011–015) | `Checkbox`, `DeleteButton`, `DragHandle`, `ClearAllDialog`, `Footer`, `useToggleTodo`, `useDeleteTodo`, `useReorderTodos`, `useClearAllTodos` | `routes/todos.ts` (PATCH/DELETE handlers) |
| Optimistic UI (FR-016–018) | All `use*` hooks (mutation pattern), `useFailedMutations`, `FailureIndication` | Error response format in all handlers |
| Session (FR-019–023) | (transparent — browser sends cookie) | `middleware/session.ts`, Prisma queries filtered by `sessionId` |
| Metadata (FR-024–026) | `index.html` (static meta tags) | — |
| Deployment (FR-027–029) | — | `docker-compose.yml`, `README.md` |

### Development Workflow

**Local development (preferred):**
1. `docker-compose up db` — PostgreSQL starts
2. `cd backend && npx prisma migrate dev` — apply migrations
3. `cd backend && npm run dev` — Express on port 3001 (tsx watch)
4. `cd frontend && npm run dev` — Vite on port 5173 with proxy to 3001

**Docker-only (reviewer path / FR-028):**
1. `cp .env.example .env`
2. `docker-compose up`
3. Open `http://localhost:3001`

**Production build:**
1. `cd frontend && npm run build` — produces `frontend/dist/`
2. `app` container copies `frontend/dist/` into the Express static serving path
3. Express serves static files + API from a single origin

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology versions verified as mutually compatible. No version conflicts. React 19 + Vite 8 + TanStack Query 5 + dnd-kit 0.4 + Radix Dialog 1.1 work together. Express 5 + Prisma 7.8 + PostgreSQL 17 work together. Zod 4.4 and Tailwind CSS 4.2 are framework-agnostic.

**Pattern Consistency:** camelCase JSON matches Prisma defaults — no serialization transform needed. Named exports, PascalCase components, kebab-case non-components, co-located tests — all enforceable by ESLint. Optimistic mutation pattern is documented once and applied uniformly to all 5 CRUD operations.

**Structure Alignment:** Frontend directory maps 1:1 to UX spec's 17 components. Backend structure matches the 6-endpoint API surface. API boundary is the sole integration point between frontend and backend.

### Requirements Coverage ✅

All 29 functional requirements (FR-001 through FR-029) have explicit architectural support mapped to specific files and components. All 29 non-functional requirements (NFR-001 through NFR-029) are addressed by technology choices, patterns, or process conventions.

### Implementation Readiness ✅

**Decision Completeness:** All critical and important decisions documented with verified versions. Deferred decisions explicitly listed with rationale.

**Structure Completeness:** Every file in the project tree is mapped to a purpose. Every FR group maps to specific frontend and backend files.

**Pattern Completeness:** Naming, structure, format, and process patterns are comprehensive. The optimistic UI mutation pattern — the single hardest implementation requirement — is documented with a concrete code example.

### Gap Analysis

**Critical gaps:** None.

**Minor items:**
- Cookie disclosure page (`/cookies`): Implement as a static HTML file at `frontend/public/cookies.html`. No architectural impact.
- Helmet.js needs to be added to the backend `package.json` dependencies (documented in Security section but not yet in the explicit dependency list).

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (29 FRs, 29 NFRs)
- [x] Scale and complexity assessed (low — single entity, no auth)
- [x] Technical constraints identified (9 constraints from PRD + UX spec)
- [x] Cross-cutting concerns mapped (8 concerns)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions (Prisma 7.8, TanStack Query 5.100, Zod 4.4)
- [x] Technology stack fully specified (React 19, Vite 8, Express 5, PostgreSQL 17, Tailwind 4.2)
- [x] Integration patterns defined (REST API, optimistic UI, session cookie)
- [x] Performance considerations addressed (Vite tree-shaking, font preload, Prisma indexing)

**✅ Implementation Patterns**
- [x] Naming conventions established (database, API, files, code)
- [x] Structure patterns defined (flat components, co-located tests)
- [x] Format patterns specified (JSON response shapes, error format, date format)
- [x] Process patterns documented (optimistic UI, error handling layers, import ordering)

**✅ Project Structure**
- [x] Complete directory structure defined (every file mapped)
- [x] Component boundaries established (frontend tree, API boundary)
- [x] Integration points mapped (data flow diagram)
- [x] Requirements to structure mapping complete (FR group → files table)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Minimal, well-understood stack — no exotic dependencies
- Every FR and NFR has explicit architectural support
- Optimistic UI pattern (the hardest requirement) is documented with a concrete code example
- Single API boundary makes testing and debugging straightforward
- Docker Compose deployment is simple (2 containers)

**Areas for Future Enhancement (post-MVP):**
- CI/CD pipeline (GitHub Actions or similar)
- Structured logging (Pino or Winston) if observability needs grow
- Rate limiting if the app becomes publicly accessible
- Dark mode (CSS custom properties already structured for it per UX spec)
- Shared Zod schemas as a proper monorepo package if validation rules grow

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- Never add a dependency not listed here without explicit discussion

**First Implementation Priority:**
1. Scaffold frontend with `npm create vite@latest frontend -- --template react-ts`
2. Initialize backend with `npm init` + Express + Prisma + TypeScript setup
3. Create `docker-compose.yml` with PostgreSQL service
4. Run `prisma migrate dev` to create the Todo table
5. Implement session middleware
6. Build API endpoints
7. Integrate TanStack Query with optimistic mutations
8. Build components following UX spec Wave 1 → 2 → 3
