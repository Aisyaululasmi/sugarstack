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

# Normalize tsup output path if nested
RUN if [ ! -f apps/api/dist/index.js ]; then \
      ACTUAL=$(find apps/api/dist -name 'index.js' | head -1) && \
      echo "Normalizing tsup output: $ACTUAL -> apps/api/dist/index.js" && \
      cp "$ACTUAL" apps/api/dist/index.js; \
    fi

# Build Web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

# ---- Stage 2: Production Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

# Install PostgreSQL + su-exec (for running postgres as non-root)
RUN apk add --no-cache postgresql postgresql-contrib su-exec

# Prepare PostgreSQL directories
RUN mkdir -p /var/lib/postgresql/data /run/postgresql && \
    chown postgres:postgres /var/lib/postgresql/data /run/postgresql

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Web standalone output FIRST (it contains its own node_modules + package.json)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Then overlay API build + full node_modules on top (API needs express, pg, etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/api/dist/index.js ./apps/api/dist/index.js
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Schema for auto-migration and first-run DB init
COPY --from=builder /app/apps/api/src/db/schema.sql ./apps/api/src/db/schema.sql
COPY --from=builder /app/apps/api/src/db/schema.sql ./schema.sql

COPY startup.sh ./
RUN chmod +x startup.sh

EXPOSE 3000

CMD ["./startup.sh"]
