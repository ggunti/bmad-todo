# Stage 1: Install all dependencies
FROM node:22-alpine AS deps

WORKDIR /app

COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN cd frontend && npm ci
RUN cd backend && npm ci

# Stage 2: Build frontend and backend
FROM deps AS builder

WORKDIR /app

COPY frontend/ ./frontend/
COPY backend/ ./backend/

RUN cd frontend && npm run build
RUN cd backend && npx prisma generate
RUN cd backend && npm run build

# Stage 3: Production image
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/backend/dist/ ./dist/
COPY --from=builder /app/backend/node_modules/ ./node_modules/
COPY --from=builder /app/backend/prisma/ ./prisma/
COPY --from=builder /app/backend/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/frontend/dist/ ./public/

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
