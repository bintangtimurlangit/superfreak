# Backend (NestJS) Development Plan

This document is the development plan for the **NestJS API** only. For the frontend plan see [development-plan-frontend.md](development-plan-frontend.md). For migration context see [MIGRATION-NEXT-NESTJS-ANALYSIS.md](MIGRATION-NEXT-NESTJS-ANALYSIS.md).

Execute tasks in the order below so the frontend can integrate incrementally.

---

## 1. Project setup and structure

### Repo choice

- **Monorepo:** `apps/api` (NestJS), `apps/web` (Next.js); root `package.json` workspaces.
- **Separate repo:** Standalone NestJS repo; share types via package or OpenAPI.

### Create NestJS app

- Run: `nest new api` (or `npx @nestjs/cli new api`) in `apps/api` or repo root.
- **Stack:** NestJS (Node 18+), Mongoose, TypeScript, class-validator, class-transformer, @nestjs/config, ioredis (or @nestjs/bull). Add @nestjs/serve-static only if serving admin assets later.

### Folder structure

Keep default NestJS layout and add:

- `src/modules/` — one folder per domain: auth, users, addresses, cart, orders, order-messages, payments, files, printing, blog, media, settings, shipping.
- `src/common/` — guards (JwtAuthGuard, RolesGuard), decorators (CurrentUser, Roles), filters, interceptors.
- `src/config/` — config factory (database, redis, r2, midtrans, resend).
- `src/shared/` — shared services (R2Service, RedisService) if not per-module.

### Env and config

- **`.env.example`** with: `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `R2_*`, `MIDTRANS_*`, `RESEND_*`, `BITESHIP_*`, `RAJAONGKIR_*`, etc.
- `ConfigModule.forRoot({ isGlobal: true })`; inject `ConfigService` where needed.
- **CORS:** `origin: process.env.CORS_ORIGIN || 'http://localhost:3000'`, `credentials: true`.

**Deliverable:** App runs; `GET /health` returns 200; MongoDB and Redis are checked in health.

---

## 2. Development order (by module)

### B1. Skeleton and health

- Bootstrap NestJS; add MongooseModule (async connection); add Redis (custom module or BullModule with Redis).
- Health controller: `GET /health` (check MongoDB + Redis).
- Global validation pipe (class-validator); optional global prefix (e.g. `/api`).

---

### B2. Auth module

- **User schema (Mongoose):** email (unique), name, password (hashed), role (enum: user, admin), image (optional), timestamps. Collection name `app-users` to match existing DB if reusing.
- **AuthService:** register (hash password with bcrypt), login (compare, return JWT or set cookie), validateUser.
- **AuthController:**
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout` (clear cookie)
  - `GET /auth/me` (from JWT/session)
- **JWT strategy (Passport):** extract from cookie or Authorization header; attach user to request.
- **Guards:** JwtAuthGuard, RolesGuard (admin only).
- **Secrets:** JWT_SECRET; cookie options (httpOnly, sameSite, secure in prod).

---

### B3. Printing module

- **Schemas:** FilamentType, PrintingOption, PrintingPricing — mirror Payload collection fields; use same collection names so existing data is readable.
- **PrintingModule:** Read-only:
  - `GET /printing/filament-types`
  - `GET /printing/options`
  - `GET /printing/pricing`
- Optional query params (e.g. isActive). Optional seed script to verify/copy data from Payload collections.

---

### B4. Settings module

- **Schema:** CourierSettings (single doc or key-value): warehousePostalCode, warehouseId, etc. — mirror Payload global.
- **SettingsModule:**
  - `GET /settings/courier`
  - `PATCH /settings/courier` (admin only)
- Service reads/writes one document. Used by Biteship/RajaOngkir later.

---

### B5. Users module

- **UsersModule:**
  - `GET /users/me`
  - `PATCH /users/me` (name, etc.)
  - `POST /users/profile-image` (multipart, upload to R2, save URL/key in user doc)
- Reuse User schema from Auth. Add R2 service (presigned or direct upload, AWS SDK, R2-compatible endpoint).

---

### B6. Addresses module

- **Schema:** Address — user, recipientName, phoneNumber, address fields, isDefault, etc. Mirror Payload Addresses collection.
- **AddressesModule:**
  - `GET /addresses` (by current user)
  - `POST /addresses`
  - `GET /addresses/:id`
  - `PATCH /addresses/:id`
  - `DELETE /addresses/:id`
- Enforce user ownership in service; implement default-address logic if present in current app.

---

### B7. Cart module

- **Schema:** Cart — user ref, items (JSON); one per user.
- **CartModule:**
  - `GET /cart`
  - `POST /cart` (upsert body with items)
  - `DELETE /cart`
- Resolve user from JWT; create or update single cart doc.

---

### B8. Orders module (core)

- **Schema:** Order — orderNumber, user, status, items[], paymentInfo, summary, shipping, adminNotes, customerNotes, statusHistory[], timestamps. Match Payload Orders collection.
- **OrdersModule:**
  - `GET /orders` (list for current user; admin: all)
  - `POST /orders` (create from body + cart; generate orderNumber; clear or update cart)
  - `GET /orders/:id`
  - `PATCH /orders/:id` (admin or restricted)
  - `DELETE /orders/:id` (admin)
  - `POST /orders/:id/cancel` (set status canceled; append statusHistory)
  - `GET /orders/:id/invoice` (generate PDF; port logic from Next.js invoice builder)
- Order number: same pattern (e.g. ORD-{timestamp}-{random}). Status history: append on status change.

---

### B9. Order-messages module

- **Schema:** OrderMessage — order ref, author ref, body, createdAt.
- **OrderMessagesModule:**
  - `GET /orders/:id/messages` (auth + order access: owner or admin)
  - `POST /orders/:id/messages` (only if order.status === needs-discussion)
  - After create: publish to Redis channel `order-messages:{orderId}` (same as current app)
  - `GET /orders/:id/messages/stream` — SSE; subscribe to Redis channel; push events; cleanup on disconnect
- Reuse Redis pub/sub pattern from current Next.js `src/app/api/orders/[id]/messages/stream/route.ts`.

---

### B10. Payments module

- **PaymentsModule:**
  - `POST /payment/initialize` — body orderId, paymentMethod; call Midtrans; update order (snap token, expiry); return client payload
  - `POST /payment/verify` — verify transaction; update order (paidAt, payment status)
  - `POST /payment/webhooks/midtrans` — verify signature; update order; idempotent
- Use Midtrans client; env for server key and client key.

---

### B11. Files module

- **Temp:** `POST /files/temp` (multipart), `GET /files/temp/:id`, `DELETE /files/temp/:id`. Store in R2 with temp prefix or metadata in DB + R2 key.
- **Finalize:** `POST /files/finalize` — body orderId or temp ids; copy temp → user-files in R2; create user-file records; update order if needed.
- **Cleanup:** `POST /files/cleanup` or cron to delete old temp files.
- R2 service: same bucket and env as current app (R2_*).

---

### B12. Blog module

- **Schema:** BlogPost — title, slug, content, featuredImage, author, status, timestamps.
- **BlogModule:**
  - `GET /blog`
  - `GET /blog/:slug`
  - `POST /blog` (admin; optional multipart for featured image)
- Media upload to R2; store URL in post.

---

### B13. Media module (optional)

- If blog featured image is handled inside BlogModule, a thin MediaModule can still expose `POST /media` for generic uploads and return URL.

---

### B14. Shipping (Biteship + RajaOngkir)

- **Biteship:** `POST /shipping/biteship/rates` — body with destination, weight, etc.; read courier settings for origin; call Biteship API; return rates.
- **RajaOngkir:** `POST /shipping/rajaongkir/calculate-cost`, `GET /shipping/rajaongkir/search-destination` (or similar). Use settings for origin; call external API; cache with Redis if desired.
- Port logic from current Next.js routes: `src/app/api/biteship/rates/route.ts`, `src/app/api/rajaongkir/*`.

---

### B15. Slice and Wilayah (optional)

- **Slice:** `POST /slice` — proxy to external slice API (port `src/app/api/slice/route.ts`).
- **Wilayah:** `GET /wilayah/:type/:code?` — proxy to wilayah.id; cache in Redis (port `src/app/api/wilayah/`).

---

## 3. Testing and deployment

- **Unit tests:** Services with mocked repositories.
- **E2E:** Critical flows (auth, order create, payment webhook) with test DB.
- **Deployment:** Run NestJS on a port (e.g. 4000); set CORS_ORIGIN to frontend URL; DATABASE_URL, REDIS_URL, R2, Midtrans, Resend from env.
- **Midtrans webhook:** Point to NestJS base URL (e.g. `https://api.yourdomain.com/api/payment/webhooks/midtrans`).

---

## 4. Sync with frontend

Run backend steps **before** the corresponding frontend phase so the frontend can switch to NestJS as soon as endpoints are ready. See [development-plan-frontend.md](development-plan-frontend.md) for the step-by-step mapping.
