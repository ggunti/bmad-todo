# Story 1.1: Project Scaffold & Docker Compose Deployment

Status: ready-for-dev

## Story

As a reviewer,
I want to clone the repo and run `docker-compose up` to see a running application,
So that I can verify the project is deployable and start evaluating it within 10 minutes.

## Acceptance Criteria

1. **Given** the repo is cloned and `.env.example` is copied to `.env`, **When** I run `docker-compose up`, **Then** the `app` container (Node.js) and `db` container (postgres:17-alpine) both start successfully.

2. **Given** the containers are running, **When** I open `http://localhost:3001`, **Then** I see the app shell rendered in the browser (a page with basic HTML content).

3. **Given** the backend starts, **When** it connects to PostgreSQL, **Then** Prisma migrations run automatically via the Docker entrypoint and the Todo table is created with all schema fields (id, sessionId, text, completed, sortOrder, createdAt, updatedAt).

4. **Given** I am a developer who has never seen this project, **When** I read the README, **Then** I find step-by-step instructions covering prerequisites, setup, and running the app locally, completable in ≤ 10 minutes.

5. **Given** the application is running, **When** I check the configuration, **Then** all environment-specific values (DATABASE_URL, PORT, NODE_ENV, COOKIE_SECRET, COOKIE_SECURE) are sourced from environment variables with sensible development defaults.

## Tasks / Subtasks

- [ ] Task 1: Initialize frontend project (AC: #2)
  - [ ] 1.1 Run `npm create vite@latest frontend -- --template react-ts` from project root
  - [ ] 1.2 Verify `frontend/package.json` has React 19.x, Vite 8.x, TypeScript 5.9.x
  - [ ] 1.3 Confirm default Vite app renders on `npm run dev`
  - [ ] 1.4 Configure Vite dev proxy: in `vite.config.ts`, proxy `/api` requests to `http://localhost:3001`

- [ ] Task 2: Initialize backend project (AC: #2, #5)
  - [ ] 2.1 Create `backend/` directory, run `npm init -y`
  - [ ] 2.2 Install production dependencies: `express@5.2.1`, `helmet`, `cookie-parser` (or `cookie` package — Express 5 handles cookies via middleware)
  - [ ] 2.3 Install dev dependencies: `typescript`, `@types/express`, `@types/node`, `tsx`, `vitest`
  - [ ] 2.4 Create `backend/tsconfig.json` — strict mode, target ES2022, module NodeNext, outDir `dist`
  - [ ] 2.5 Create `backend/src/server.ts` — entry point that listens on PORT env var (default 3001)
  - [ ] 2.6 Create `backend/src/app.ts` — Express app with Helmet, JSON body parser, and placeholder health route `GET /api/health` returning `{ status: "ok" }`
  - [ ] 2.7 Add npm scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist/server.js)

- [ ] Task 3: Set up Prisma with PostgreSQL (AC: #3)
  - [ ] 3.1 Install `prisma@7.8.0` (dev) and `@prisma/client@7.8.0` (prod) in backend
  - [ ] 3.2 Run `npx prisma init` — generates `prisma/schema.prisma` and default `.env`
  - [ ] 3.3 Define the Todo model in `schema.prisma` exactly as specified (see Dev Notes)
  - [ ] 3.4 Set datasource provider to `postgresql` with `env("DATABASE_URL")`
  - [ ] 3.5 Create `backend/src/prisma/client.ts` — singleton Prisma client instance
  - [ ] 3.6 Run `npx prisma migrate dev --name init` to generate initial migration

- [ ] Task 4: Create Docker Compose configuration (AC: #1, #3)
  - [ ] 4.1 Create `docker-compose.yml` at project root with 2 services: `app` and `db`
  - [ ] 4.2 `db` service: `postgres:17-alpine`, env vars for POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, named volume for data persistence
  - [ ] 4.3 `app` service: multi-stage Node.js Dockerfile, depends_on `db`, port mapping 3001:3001
  - [ ] 4.4 Create root `Dockerfile` with 3 stages: deps → builder (frontend build + backend compile) → production (copy artifacts, run Express)
  - [ ] 4.5 Create `docker-entrypoint.sh` that runs `npx prisma migrate deploy` then starts the server
  - [ ] 4.6 Create `.dockerignore` (node_modules, dist, .env, .git, _bmad-output)

- [ ] Task 5: Configure Express to serve Vite production build (AC: #2)
  - [ ] 5.1 In `app.ts`, add static file serving from `frontend/dist/` (or `/app/frontend/dist` in Docker)
  - [ ] 5.2 Add SPA fallback: any non-`/api` GET request serves `index.html`
  - [ ] 5.3 Route priority: `/api/*` routes first → static files → SPA fallback

- [ ] Task 6: Create environment configuration (AC: #5)
  - [ ] 6.1 Create `.env.example` with all env vars and sensible dev defaults
  - [ ] 6.2 Add `.env` to `.gitignore`

- [ ] Task 7: Write README (AC: #4)
  - [ ] 7.1 Write README.md with: project description, prerequisites (Docker, Docker Compose), setup steps (clone → cp .env.example .env → docker-compose up → open localhost:3001), local development instructions, project structure overview
  - [ ] 7.2 Ensure install path is completable in ≤ 10 minutes

- [ ] Task 8: End-to-end verification
  - [ ] 8.1 Run `docker-compose up` from clean state → both containers start
  - [ ] 8.2 Open `http://localhost:3001` → app shell renders
  - [ ] 8.3 Verify Prisma migrations ran → Todo table exists with correct schema
  - [ ] 8.4 Verify `GET /api/health` returns 200

## Dev Notes

### Technology Stack (Exact Versions)

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22-alpine (Docker) / 20.19+ or 22.12+ (local) | Runtime |
| TypeScript | 5.9.x | Type safety (strict mode) |
| Vite | 8.0.10 | Frontend build tool |
| React | 19.2.5 | UI framework |
| Express | 5.2.1 | Backend HTTP framework |
| Prisma | 7.8.0 | ORM + migrations |
| PostgreSQL | 17 (postgres:17-alpine) | Database |
| Helmet | latest | HTTP security headers |
| Vitest | latest | Test framework |

### Prisma Schema (Exact Definition)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

### Prisma 7.8 Docker Migration — Known Issue

Prisma 7.x has a known issue where `prisma migrate deploy` fails during Docker **build** with "The datasource.url property is required." This is because DATABASE_URL is not available at build time.

**Solution:** Run migrations at **runtime** via a Docker entrypoint script, NOT during the build stage:

```sh
#!/bin/sh
set -e
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Starting server..."
exec node dist/server.js
```

Prisma client generation (`prisma generate`) CAN run at build time since it doesn't need the database connection.

### Environment Variables

| Variable | Purpose | Dev Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://todo:todo@db:5432/todo_bmad` |
| `PORT` | Express listen port | `3001` |
| `NODE_ENV` | Environment flag | `development` |
| `COOKIE_SECRET` | Cookie signing key | `dev-secret-change-in-production` |
| `COOKIE_SECURE` | Set Secure flag on cookie | `false` |

**Note:** In `.env.example` for local non-Docker dev, use `localhost` instead of `db` in DATABASE_URL: `postgresql://todo:todo@localhost:5432/todo_bmad`. The Docker Compose config uses the service name `db`.

### Docker Compose Architecture

```
docker-compose.yml
├── db (postgres:17-alpine)
│   ├── POSTGRES_USER=todo
│   ├── POSTGRES_PASSWORD=todo
│   ├── POSTGRES_DB=todo_bmad
│   └── volume: pgdata:/var/lib/postgresql/data
│
└── app (Node.js multi-stage build)
    ├── depends_on: db
    ├── ports: "3001:3001"
    ├── env_file: .env
    └── entrypoint: docker-entrypoint.sh
        → prisma migrate deploy
        → node dist/server.js
```

### Multi-Stage Dockerfile Pattern

```
Stage 1 — deps:
  FROM node:22-alpine AS deps
  Copy package.json + package-lock.json from both frontend/ and backend/
  Run npm ci in both directories

Stage 2 — builder:
  FROM deps AS builder
  Copy source code
  Run: cd frontend && npm run build    (produces frontend/dist/)
  Run: cd backend && npx prisma generate   (generates Prisma client)
  Run: cd backend && npm run build     (tsc → backend/dist/)

Stage 3 — production:
  FROM node:22-alpine AS production
  Copy backend/dist/, backend/node_modules/, backend/prisma/
  Copy frontend/dist/ → /app/public/   (Express serves this)
  Copy docker-entrypoint.sh
  EXPOSE 3001
  ENTRYPOINT ["./docker-entrypoint.sh"]
```

### Express Static Serving (app.ts)

Route priority is critical:
1. API routes (`/api/*`) — matched first
2. Static files from Vite build directory (`express.static`)
3. SPA fallback — all other GET requests serve `index.html`

```typescript
// Simplified pattern — exact implementation may vary
app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
```

The static path should resolve to the `frontend/dist` output copied into the Docker image.

### Express 5 Key Differences

Express 5.2.1 includes native async error propagation — route handlers can be `async` and thrown/rejected errors automatically reach the error handler without `next(err)`. This simplifies error handling compared to Express 4.

### Naming Conventions (Architecture Enforced)

| Target | Convention | Example |
|---|---|---|
| React components | PascalCase | `TodoCard.tsx` |
| Non-component TS files | kebab-case | `session-middleware.ts`, `todo-routes.ts` |
| Functions/variables | camelCase | `getTodos`, `sessionId` |
| Types/interfaces | PascalCase | `Todo`, `CreateTodoInput` |
| Constants | UPPER_SNAKE_CASE | `MAX_TODO_LENGTH` |
| Exports | Named only | No default exports (except `App`) |

### File Structure Created by This Story

```
todo-bmad/
├── README.md
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh
├── .env.example
├── .gitignore
├── .dockerignore
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts          # + dev proxy to backend
│   ├── index.html              # Basic Vite shell (meta tags in story 1.2)
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # Minimal app shell — "hello world" level
│       └── index.css
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/        # Generated by prisma migrate dev
│   └── src/
│       ├── server.ts           # Entry: listen on PORT
│       ├── app.ts              # Express setup: Helmet, JSON, static, SPA fallback
│       └── prisma/
│           └── client.ts       # Prisma client singleton
│
└── _bmad-output/               # Existing — do not modify
```

### What This Story Does NOT Include

- No session middleware (Story 2.1)
- No API routes beyond health check (Story 2.1)
- No Tailwind CSS, design tokens, or typography (Story 1.2)
- No page metadata (title, OG tags, favicon) (Story 1.2)
- No TanStack Query or frontend state management (Story 2.2)
- No Zod validation schemas (Story 2.1)
- No ESLint/Prettier configuration (can be added but not required)

The app shell rendered at `localhost:3001` should be the bare Vite React default content or a minimal "todo-bmad" placeholder — enough to confirm the full stack is wired.

### Project Structure Notes

- Frontend and backend are sibling directories at project root — monorepo without workspace tooling (separate `package.json` per directory)
- The Dockerfile is at the project root (not inside frontend/ or backend/) because it needs both directories
- `_bmad-output/` must be excluded from Docker context (`.dockerignore`)
- Prisma migrations directory is committed to git (it's the migration source of truth)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Initialization commands, project structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — Docker Compose config, env vars, static serving
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Prisma schema, migration strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming conventions, file patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Full directory structure, development workflow
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1 Story 1.1] — Acceptance criteria, FR coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Deployment & Reviewability] — FR-027, FR-028

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
