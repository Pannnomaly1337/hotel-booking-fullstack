# Hotel Booking System

A hotel booking platform, migrated from a MERN stack (React + Express + MongoDB)
to a modern, type-safe, production-grade stack.

| | Before | After |
|---|---|---|
| Frontend | Vite + React + React Router (JS) | **Next.js 15** (App Router, TypeScript) |
| Backend | Express + Mongoose (JS) | **NestJS 10** (TypeScript) |
| Database | MongoDB (NoSQL) | **PostgreSQL + Prisma** (SQL, Neon) |
| Structure | 2 separate repos | **pnpm + Turborepo monorepo** |
| Infra | — | **Docker**, Vercel (web), Render (api) |

The data model (users ↔ bookings ↔ rooms) is strongly relational, so Postgres
is a better fit than the original document store. The migration also closes a
set of **security holes** in the original backend — see
[`docs/SECURITY.md`](docs/SECURITY.md).

---

## Repository structure

```
hotel-booking/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── prisma/          # schema.prisma + seed
│   │   └── src/
│   │       ├── common/      # guards, decorators, filters
│   │       ├── config/      # env validation
│   │       ├── prisma/      # PrismaService
│   │       └── modules/     # auth, users, rooms, bookings, contacts
│   └── web/                 # Next.js frontend (App Router)
│       └── src/
│           ├── app/         # routes
│           ├── contexts/    # auth provider
│           └── lib/         # api client, utils
├── packages/
│   └── types/               # shared TypeScript types/enums (FE + BE)
├── docker-compose.yml       # local Postgres + api + web
├── render.yaml              # Render blueprint (api)
└── turbo.json
```

---

## First-time setup: create the initial migration

The repo ships with `schema.prisma` but **no migration files** (they're
generated against a real database). Create the first migration once, then
commit it — Docker and Render apply it automatically afterwards.

```bash
pnpm install
cp .env.example .env     # set JWT_SECRET (see below) — default DATABASE_URL points at local docker Postgres
docker compose up -d db  # start just Postgres
pnpm --filter @repo/api exec prisma migrate dev --name init
git add apps/api/prisma/migrations && git commit -m "Add initial migration"
```

## Quick start (local, with Docker)

After the initial migration exists — spins up Postgres, the API
(migrated + seeded), and the web app:

```bash
cp .env.example .env
# set a JWT_SECRET — generate one with:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

docker compose up --build
```

- Web → http://localhost:3001
- API → http://localhost:3000/api/v1
- Login with the seeded admin (`admin@hotel.local` / `Admin12345`).

## Quick start (local, without Docker)

You need a running Postgres (local, or a Neon dev branch). Then:

```bash
pnpm install

# 1. Point apps/api at your database
cp .env.example .env            # set DATABASE_URL + DIRECT_URL + JWT_SECRET

# 2. Create the schema + seed data
pnpm db:migrate                 # prisma migrate dev
pnpm db:seed

# 3. Point the web app at the API
echo 'NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"' > apps/web/.env.local

# 4. Run both apps
pnpm dev
```

---

## Scripts (run from repo root)

| Command | What it does |
|---|---|
| `pnpm dev` | Run web + api in watch mode (Turborepo) |
| `pnpm build` | Build both apps |
| `pnpm db:migrate` | Create/apply a Prisma migration (dev) |
| `pnpm db:seed` | Seed admin + sample rooms |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm format` | Prettier |

---

## Documentation

- [`docs/SECURITY.md`](docs/SECURITY.md) — security holes found in the original backend and how each is fixed, plus the full endpoint auth matrix.
- [`docs/MIGRATION.md`](docs/MIGRATION.md) — phase-by-phase migration notes, the Mongo→SQL data-model mapping, and the **remaining frontend pages** to port (with a mapping table).
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — step-by-step deploy to Neon + Render + Vercel.

---

## Default seeded accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hotel.local` | `Admin12345` |
| User | `guest@hotel.local` | `User12345` |

> Change these before any real deployment (set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
