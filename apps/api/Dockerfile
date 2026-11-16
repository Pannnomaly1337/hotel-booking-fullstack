# syntax=docker/dockerfile:1
# NestJS API — built from the MONOREPO ROOT context:
#   docker build -f apps/api/Dockerfile -t hotel-api .
#
# (the build needs pnpm-workspace + packages/types, so context is the repo root)

# ---------- base ----------
FROM node:20-slim AS base
# OpenSSL is required by Prisma's query engine.
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ---------- deps (cached) ----------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
COPY turbo.json ./
COPY packages/types ./packages/types
COPY apps/api ./apps/api
# Generates the Prisma client (downloads the linux query engine here —
# this build runs where binaries.prisma.sh is reachable).
RUN pnpm --filter @repo/api exec prisma generate
# turbo builds @repo/types first (via ^build), then the API.
RUN pnpm turbo build --filter=@repo/api

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Copy the full (workspace) node_modules — keeps pnpm symlinks + the
# generated Prisma client intact.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3000
# Run pending migrations, then start. (Safe to run on every boot.)
CMD ["sh", "-c", "pnpm --filter @repo/api exec prisma migrate deploy && node apps/api/dist/main.js"]
