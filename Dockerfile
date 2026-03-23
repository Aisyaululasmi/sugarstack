# ---- Stage 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm install

COPY turbo.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Build API (tsup bundles @sugarstack/shared inline)
RUN npm run build --workspace=apps/api

# Build Web (NEXT_PUBLIC_API_URL empty → browser uses /api relative path)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

# ---- Stage 2: Production Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

# Install PostgreSQL + su-exec (for running postgres as non-root)
RUN apk add --no-cache postgresql su-exec

# Prepare PostgreSQL data directory owned by postgres user
RUN mkdir -p /var/lib/postgresql/data && chown postgres:postgres /var/lib/postgresql/data

# Install PM2 to manage multiple processes
RUN npm install -g pm2

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Root node_modules (contains next, react, pg, etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# API build
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Web build
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Database schema (used for first-run initialization)
COPY --from=builder /app/apps/api/src/db/schema.sql ./schema.sql

COPY ecosystem.config.js ./
COPY startup.sh ./
RUN chmod +x startup.sh

EXPOSE 3000

CMD ["./startup.sh"]
