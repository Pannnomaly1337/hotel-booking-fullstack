# Migration notes (MERN → Next/Nest/Postgres)

## Data model: MongoDB → Postgres/Prisma

| Mongoose | Prisma / Postgres |
|---|---|
| `_id: ObjectId` | `id String @id @default(cuid())` |
| `ref: "User"` + `populate()` | relation FK + `include` / `select` |
| `pricing: { roomRate, totalAmount }` (embedded) | two flat columns `roomRate`, `totalAmount` on `Booking` |
| `enum: [...]` | Prisma `enum` (`Role`, `RoomType`, `RoomStatus`, `BookingStatus`) |
| `timestamps: true` | `createdAt @default(now())`, `updatedAt @updatedAt` |
| `pre("save")` password hash | `UsersService` / seed hash with bcrypt |
| `pre("validate")` price calc + `post("save")` room-status sync | `BookingsService` inside a `prisma.$transaction` (atomic) |
| `currentGuest: ObjectId` | `currentGuestId String?` → `User?` relation (`onDelete: SetNull`) |

The booking business logic (validate room is `Available`, lock the room rate,
compute `nights` and `totalAmount`, generate a confirmation number, and sync the
room's status/guest) now lives in `BookingsService` and runs in a single
transaction, so a failure can't leave a room in a half-updated state.

## Phases

- **Phase 0 — Scaffold** ✅ pnpm + Turborepo, `apps/web`, `apps/api`, `packages/types`.
- **Phase 1 — Database** ✅ `schema.prisma`, enums, relations, `seed.ts`.
- **Phase 2 — Backend** ✅ NestJS modules, DTO validation, JWT + Roles guards, security fixes (see `SECURITY.md`).
- **Phase 3 — Frontend** 🚧 scaffold + auth/API wiring + `Home`/`Login` done; remaining pages below.
- **Phase 4 — Docker** ✅ Dockerfiles + `docker-compose`.
- **Phase 5 — Deploy** → see `DEPLOYMENT.md`.

## Frontend: React Router → Next App Router

Patterns used when porting each page:

| Old (Vite/React Router) | New (Next App Router) |
|---|---|
| `import.meta.env.VITE_API_URL` | `process.env.NEXT_PUBLIC_API_URL` (already in `src/lib/api.ts`) |
| `axios` + `withCredentials` per call | the shared `api` instance from `@/lib/api` |
| `createBrowserRouter` children | folders under `src/app/` with `page.tsx` |
| `<Layout>` wrapper route | `src/app/(public)/layout.tsx` |
| `<AdminRoute>` + `<LayoutAdmin>` | `src/app/admin/layout.tsx` with a client-side role guard using `useAuth()` |
| `useNavigate()` | `useRouter()` from `next/navigation` |
| `<Link to=…>` (react-router) | `<Link href=…>` from `next/link` |
| `useParams()` / `useSearchParams()` | same names from `next/navigation` |
| React Router `navigate(path, { state })` | pass data via URL search params or a store (Next has no router `state`) — **watch `BookingConfirm`, which likely relied on nav state** |
| any component using hooks/state | add `"use client"` at the top |
| `/public/*` assets | keep in `apps/web/public/*` (copy from the old repo) |

### Remaining pages to port

Copy each old page from `GroupProject-6-React/src/pages`, convert to `.tsx`,
and place it at the path below. Most `components/ui/*` (shadcn) components are
framework-agnostic and port almost unchanged.

| Old page | New route file | Notes |
|---|---|---|
| `Homepage.jsx` | `src/app/(public)/page.tsx` | replace the placeholder `src/app/page.tsx` |
| `Login.jsx` | `src/app/login/page.tsx` | ✅ done (reference impl) |
| `Registration.jsx` | `src/app/register/page.tsx` | POST `/users` |
| `RoomDetail.jsx` | `src/app/roomdetail/page.tsx` | GET `/rooms/:roomNumber` |
| `ExploreDetail.jsx` | `src/app/explore/page.tsx` | |
| `BookingDetail.jsx` | `src/app/bookingdetail/page.tsx` | |
| `BookingConfirm.jsx` | `src/app/bookingconfirm/page.tsx` | POST `/bookings` — no more `userId` in body |
| `User.jsx` | `src/app/user/page.tsx` | GET `/bookings/my-bookings` |
| `ContactUs.jsx` | `src/app/contactus/page.tsx` | POST `/contacts` |
| `ForgetPassword.jsx` | `src/app/forgetpassword/page.tsx` | |
| `AdminDashboard.jsx` | `src/app/admin/dashboard/page.tsx` | under admin layout |
| `AdminRoomLists.jsx` | `src/app/admin/rooms/page.tsx` | |
| `AdminBookingManagement.jsx` | `src/app/admin/bookings/page.tsx` | |
| `AdminUserManagement.jsx` | `src/app/admin/users/page.tsx` | |
| `Admin.jsx` | `src/app/admin/page.tsx` | |
| `Error.jsx` | `src/app/not-found.tsx` + `src/app/error.tsx` | |

### Re-adding shadcn/ui
```bash
cd apps/web
npx shadcn@latest init        # Tailwind v4, CSS variables
# then re-add the components you used:
npx shadcn@latest add button input dialog calendar popover select \
  dropdown-menu sheet sidebar label textarea separator skeleton alert
```
Then copy the page/component bodies from the old repo, swap routing/env per the
table above, and add `"use client"` where needed.

### Admin route protection (replaces `AdminRoute.jsx`)
Create `src/app/admin/layout.tsx` as a client component that reads `useAuth()`,
shows a loader while `authLoading`, and redirects to `/login` if
`user?.role !== "admin"`. (The API already enforces admin-only on the server —
this is just UX.)
