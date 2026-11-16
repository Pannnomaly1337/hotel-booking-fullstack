# syntax=docker/dockerfile:1
# NestJS API — built from the MONOREPO ROOT context:
#   docker build -f apps/api/Dockerfile -t hotel-api .

# ---------- base ----------
FROM node:20-slim AS base
# OpenSSL is required by Prisma's query engine.
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# Pin pnpm 9.12.0 into the image so corepack never downloads another version at runtime.
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
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
# Generates the Prisma client (downloads the linux query engine here).
RUN pnpm --filter @repo/api exec prisma generate
# turbo builds @repo/types first (via ^build), then the API.
RUN pnpm turbo build --filter=@repo/api

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Copy the whole built workspace — keeps pnpm's node_modules symlinks,
# the generated Prisma client, and the workspace manifests intact.
COPY --from=build /app ./
EXPOSE 3000
# Apply pending migrations, then start. (Safe to run on every boot.)
CMD ["sh", "-c", "pnpm --filter @repo/api exec prisma migrate deploy && node apps/api/dist/main.js"]