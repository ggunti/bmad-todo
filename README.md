# todo-bmad

A session-based todo application built with React, Express, and PostgreSQL.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+ — included with Docker Desktop)

That's it. Node.js is not required on the host machine to run the app.

## Setup & Run (≤ 10 minutes)

```bash
# 1. Clone the repository
git clone <repo-url>
cd todo-bmad

# 2. Copy the example environment file
cp .env.example .env

# 3. Start the application
docker-compose up --build
```

Once both containers are healthy, open your browser at:

**http://localhost:3001**

You should see the app shell. The `GET /api/health` endpoint returns `{ "status": "ok" }`.

> **Note:** The first build downloads Docker images and installs npm packages. Subsequent starts are much faster.

## Stopping the App

```bash
docker-compose down
```

To also remove the database volume (wipes all data):

```bash
docker-compose down -v
```

## Local Development (without Docker)

Requires Node.js 20.19+ or 22.12+ and a running PostgreSQL 17 instance.

```bash
# Update DATABASE_URL in .env to use localhost instead of db:
# DATABASE_URL=postgresql://todo:todo@localhost:5432/todo_bmad

# Install dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Run migrations
cd backend && npx prisma migrate deploy && cd ..

# Start frontend dev server (port 5173, proxies /api → localhost:3001)
cd frontend && npm run dev &

# Start backend dev server (port 3001, hot reload)
cd backend && npm run dev
```

## Project Structure

```
todo-bmad/
├── README.md
├── docker-compose.yml        # Orchestrates app + db containers
├── Dockerfile                # Multi-stage build (deps → builder → production)
├── docker-entrypoint.sh      # Runs Prisma migrations then starts the server
├── .env.example              # Template — copy to .env before running
├── .gitignore
├── .dockerignore
│
├── frontend/                 # Vite + React 19 + TypeScript
│   ├── package.json
│   ├── vite.config.ts        # Dev proxy: /api → localhost:3001
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       └── index.css
│
├── backend/                  # Express 5 + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma.config.ts      # Prisma 7 configuration
│   ├── prisma/
│   │   ├── schema.prisma     # Todo model definition
│   │   └── migrations/       # Committed migration history
│   └── src/
│       ├── server.ts         # Entry: binds to PORT (default 3001)
│       ├── app.ts            # Express: Helmet, JSON, /api/health, static SPA
│       └── prisma/
│           └── client.ts     # Singleton PrismaClient
│
└── _bmad-output/             # Planning artifacts — do not modify
```

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://todo:todo@db:5432/todo_bmad` |
| `PORT` | Express listen port | `3001` |
| `NODE_ENV` | Environment flag | `development` |
| `COOKIE_SECRET` | Cookie signing key | `dev-secret-change-in-production` |
| `COOKIE_SECURE` | Set Secure flag on cookie | `false` |

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22-alpine (Docker) | Runtime |
| TypeScript | 6.x | Type safety |
| Vite | 8.x | Frontend build tool |
| React | 19.x | UI framework |
| Express | 5.2.1 | HTTP server |
| Prisma | 7.8.0 | ORM + migrations |
| PostgreSQL | 17 | Database |
