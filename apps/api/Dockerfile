# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# ---- Stage 2: Build ----
FROM deps AS builder
WORKDIR /app

COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY tsconfig.base.json ./

RUN npm run build --workspace=apps/api

# Normalize tsup output path if nested
RUN if [ ! -f apps/api/dist/index.js ]; then \
      ACTUAL=$(find apps/api/dist -name 'index.js' | head -1) && \
      cp "$ACTUAL" apps/api/dist/index.js; \
    fi

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist/index.js ./apps/api/dist/index.js
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
