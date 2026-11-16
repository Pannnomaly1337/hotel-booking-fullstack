# syntax=docker/dockerfile:1
# Next.js web — built from the MONOREPO ROOT context:
#   docker build -f apps/web/Dockerfile -t hotel-web .
# (On Vercel you do NOT use this Dockerfile — Vercel builds Next natively.
#  This exists for local docker-compose and self-hosting.)

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
# NEXT_PUBLIC_* must be present at BUILD time (baked into the browser bundle).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY turbo.json ./
COPY packages/types ./packages/types
COPY apps/web ./apps/web
# turbo builds @repo/types first (via ^build), then the web app.
RUN pnpm turbo build --filter=@repo/web

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Next.js "standalone" output bundles only what it needs.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3001
CMD ["node", "apps/web/server.js"]
