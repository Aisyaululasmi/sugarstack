FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# Copy source
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

FROM base AS development
WORKDIR /app/apps/api
CMD ["npx", "tsx", "watch", "src/index.ts"]

FROM base AS builder
WORKDIR /app/apps/api
RUN npx tsc --outDir dist

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/packages/shared ./packages/shared
RUN npm ci --omit=dev
EXPOSE 4000
CMD ["node", "dist/index.js"]
