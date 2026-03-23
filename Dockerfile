# ---- Stage 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace package files first (layer cache)
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm install

# Copy source code
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Build API (tsup bundles @sugarstack/shared inline → dist/index.js)
RUN npm run build --workspace=apps/api

# Build Web
# NEXT_PUBLIC_API_URL is intentionally empty so the browser uses /api (relative),
# which Next.js proxies internally to http://localhost:4000/api
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

# ---- Stage 2: Production Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g pm2

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Root node_modules (contains next, react, pg, etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# API build output (single bundled file)
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Web build output
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/package.json ./apps/web/

COPY ecosystem.config.js ./

EXPOSE 3000

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
