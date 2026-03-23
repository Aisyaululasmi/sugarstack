FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=apps/web --workspace=packages/shared --include-workspace-root

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/web
RUN npx next build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/package.json ./apps/web/
WORKDIR /app/apps/web
CMD ["../../node_modules/.bin/next", "start", "-p", "3000"]
