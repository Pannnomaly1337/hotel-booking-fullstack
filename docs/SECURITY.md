# Security — holes in the original backend & how they're fixed

The original Express/Mongoose API had several vulnerabilities. The NestJS
rewrite fixes all of them, mostly *by design* (secure-by-default guards +
DTO validation) rather than per-route patches.

## Findings & fixes

| # | Severity | Original problem | Fix in the new backend |
|---|---|---|---|
| 1 | 🔴 Critical | **Rooms CRUD wide open** — `createRoom` / `updateRoom` / `deleteRoom` had no auth (`authUser` was commented out). Anyone could create/edit/delete rooms. | `@Roles("admin")` on all room writes; global `JwtAuthGuard` means routes are **auth-by-default**. |
| 2 | 🔴 Critical | **`createBooking` took `userId` from the request body** and had no auth → book as anyone (IDOR), and price was client-supplied. | `userId` comes from the JWT (`@CurrentUser`); `roomRate`/`nights`/`totalAmount` computed server-side from the room. |
| 3 | 🔴 Critical | **`updateBooking` (PATCH) had no auth** → modify any booking by its confirmation number. | Requires auth + owner-or-admin check in the service. |
| 4 | 🔴 Critical | **`updateUser`/`deleteUser` had no ownership/role check**, and `req.body` went straight into `findByIdAndUpdate` → any user could set `role: "admin"` (privilege escalation / mass assignment). | Owner-or-admin enforced; `role` only applied when requester is admin; `ValidationPipe({ whitelist, forbidNonWhitelisted })` strips unknown fields. |
| 5 | 🟠 High | **`getUsers` / `getUser` public** → anyone could dump all users. | `GET /users` is `@Roles("admin")`; `GET /users/:id` is self-or-admin. |
| 6 | 🟠 High | **Contacts `getContacts` / `deleteContact` public** → read/delete every contact message. | Admin-only; only `POST /contacts` stays public (the form). |
| 7 | 🟠 High | **Error handler returned `err.stack`** to the client → leaked file paths & code structure. | `AllExceptionsFilter` never sends the stack; it's logged server-side only. |
| 8 | 🟡 Medium | **Password updates via `findByIdAndUpdate` bypassed the hash hook** → plaintext passwords stored. | `UsersService.update` re-hashes with bcrypt whenever `password` is present. |
| 9 | 🟡 Medium | **No real input validation** (presence checks only). | `class-validator` DTOs on every endpoint + global `ValidationPipe`. |
| 10 | 🟡 Medium | **No brute-force protection on login.** | `@nestjs/throttler`: global 100/15min + a tighter **5/min on login**. |
| 11 | 🟡 Medium | `createUser` catch overwrote a 409 with 500. | Prisma `P2002` → clean `409 Conflict`. |
| 12 | 🟡 Medium | `JWT_SECRET` never validated; token also returned in the response body. | Env validated at startup (Zod); secret must be ≥32 chars; token only set as an httpOnly cookie. |

## Endpoint auth matrix (new API)

`🔓 public · 👤 any logged-in user · 🧍 owner-or-admin · 🛡️ admin only`

### `users`
| Method | Path | Access |
|---|---|---|
| POST | `/users` (register) | 🔓 |
| POST | `/users/auth/cookie/login` | 🔓 (5/min) |
| POST | `/users/auth/cookie/logout` | 🔓 |
| GET | `/users/auth/cookie/me` | 👤 |
| GET | `/users` | 🛡️ |
| GET | `/users/:id` | 🧍 |
| PATCH | `/users/:id` | 🧍 (role change → 🛡️) |
| DELETE | `/users/:id` | 🧍 |

### `rooms`
| Method | Path | Access |
|---|---|---|
| GET | `/rooms` | 🔓 |
| GET | `/rooms/:roomNumber` | 🔓 |
| POST | `/rooms` | 🛡️ |
| PATCH | `/rooms/:roomNumber` | 🛡️ |
| DELETE | `/rooms/:roomNumber` | 🛡️ |

### `bookings`
| Method | Path | Access |
|---|---|---|
| POST | `/bookings` | 👤 (userId from token) |
| GET | `/bookings/my-bookings` | 👤 |
| GET | `/bookings` | 🛡️ |
| GET | `/bookings/:cnumber` | 🧍 |
| PATCH | `/bookings/:cnumber` | 🧍 |
| DELETE | `/bookings/:cnumber` | 🧍 |

### `contacts`
| Method | Path | Access |
|---|---|---|
| POST | `/contacts` | 🔓 |
| GET | `/contacts` | 🛡️ |
| GET | `/contacts/:id` | 🛡️ |
| DELETE | `/contacts/:id` | 🛡️ |

## Other hardening carried over / added
- `helmet` for security headers.
- CORS locked to an allow-list from `CORS_ORIGINS`, `credentials: true`.
- httpOnly + `SameSite=None; Secure` cookie in production (safe cross-site auth between Vercel and Render).
- `trust proxy` set so secure cookies + rate limiting work behind Render's proxy.
- Atomic booking/room updates via Prisma `$transaction` (the original used separate Mongoose hooks that could leave room status inconsistent on failure).
