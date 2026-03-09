# Migration Analysis: Payload (Next.js) → Next.js Frontend + NestJS Backend

This document analyzes your current Superfreak project and outlines how to migrate to a **Next.js frontend only** plus **NestJS backend**.

---

## 1. Current Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js App (single codebase)                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Frontend (React)          │  API Routes (Next.js)    │  Payload        │
│  - [locale]/(frontend)/    │  - /api/orders, /api/cart │  - Admin UI    │
│  - Cart, checkout, orders  │  - /api/auth, /api/files  │    /admin       │
│  - Profile, blog          │  - /api/payment, etc.     │  - REST API     │
│                            │                           │    (payload)/api│
│                            │  Auth: better-auth        │  - Collections  │
│                            │  (payload-auth plugin)   │  - MongoDB      │
│                            │  → stores in Payload     │  - S3/R2, Resend│
└─────────────────────────────────────────────────────────────────────────┘
```

- **Database:** MongoDB (via Payload mongoose adapter).
- **Auth:** Better-auth (email/password, Google, magic link, admin) with **payload-auth** plugin; users/sessions/accounts stored in Payload collections (`app-users`, `accounts`, `sessions`, `verifications`).
- **Storage:** Cloudflare R2 (S3-compatible) for media and user-files; Resend for email.
- **Redis:** Used for caching (shipping, etc.) and order discussion live updates (pub/sub).

---

## 2. What Payload Is Used For Today

### 2.1 Collections (data models)

| Collection        | Purpose |
|-------------------|--------|
| **app-users**     | Users (better-auth); admin panel login; roles `user` / `admin`. |
| **accounts**      | OAuth/linked accounts (better-auth). |
| **sessions**      | Sessions (better-auth). |
| **verifications** | Email verification tokens (better-auth). |
| **media**         | Public media (blog images, etc.); stored in R2. |
| **user-files**    | Private 3D files per user; R2. |
| **addresses**     | User addresses (linked to app-users). |
| **FilamentTypes** | Printing config (materials, colors, etc.). |
| **PrintingPricing** | Pricing rules (layer height, etc.). |
| **PrintingOptions** | Options (infill, wall count, etc.). |
| **orders**        | Orders (items, payment, shipping, status, notes). |
| **order-messages**| Per-order discussion (needs-discussion). |
| **carts**         | One cart per user (items as JSON). |
| **blog-posts**    | Blog (Lexical rich text, featured image). |

### 2.2 Globals

| Global            | Purpose |
|-------------------|--------|
| **courier-settings** | Warehouse, Biteship/RajaOngkir config. |

### 2.3 Custom API routes (Next.js) that use Payload

These live under `src/app/api/` and call `getPayload()` / Payload Local API:

| Route | Methods | Purpose |
|-------|---------|--------|
| `/api/auth/[...all]` | * | Better-auth handler (forwarded to Payload plugin). |
| `/api/orders` | GET, POST, DELETE | List/create/delete orders (auth + access). |
| `/api/orders/[id]` | GET, PATCH, DELETE | Get/update/delete one order. |
| `/api/orders/[id]/messages` | GET, POST | Order discussion messages. |
| `/api/orders/[id]/messages/stream` | GET | SSE stream for live messages (Redis). |
| `/api/orders/[id]/cancel` | POST | Cancel order. |
| `/api/orders/[id]/invoice` | GET | PDF invoice. |
| `/api/cart` | GET, POST, DELETE | Cart CRUD. |
| `/api/user-addresses` | GET, POST | Addresses CRUD. |
| `/api/user-addresses/[id]` | GET, DELETE | One address. |
| `/api/profile-image` | POST | Upload profile image (Payload media). |
| `/api/files/temp` | POST | Create temp file. |
| `/api/files/temp/retrieve` | GET | Get temp file. |
| `/api/files/temp/delete` | DELETE | Delete temp file. |
| `/api/files/finalize` | POST | Move temp → user-files. |
| `/api/files/cleanup` | POST | Cleanup old temp files. |
| `/api/payment/initialize` | POST | Midtrans init, update order. |
| `/api/payment/verify` | POST | Verify payment, update order. |
| `/api/blog` | GET | List blog posts. |
| `/api/blog/[slug]` | GET | Get post by slug. |
| `/api/blog/create` | POST | Create post (admin). |
| `/api/biteship/rates` | POST | Biteship shipping rates (uses courier-settings). |
| `/api/rajaongkir/calculate-cost` | POST | RajaOngkir cost (uses courier-settings). |
| `/api/midtrans/notification` | POST | Midtrans webhook; update order/payment. |
| `/api/slice` | POST | Slicing (external or internal). |

### 2.4 Payload REST API (catch-all)

`(payload)/api/[...slug]/route.ts` serves Payload’s REST API for:

- **Collections:** `filament-types`, `printing-options`, `printing-pricing`, `addresses`, `media`, `user-files`, `orders`, `order-messages`, `carts`, `blog-posts`, `app-users`, `accounts`, etc.
- **Globals:** `globals/courier-settings`.

Frontend calls that hit this (not your custom routes):

- `GET /api/filament-types?where[isActive][equals]=true&...`
- `GET /api/printing-options?where[isActive][equals]=true&...`
- `GET /api/printing-pricing?where[isActive][equals]=true&...`
- `GET /api/globals/courier-settings`
- `GET /api/addresses?...` (in one place in SummaryStep)

### 2.5 Admin panel

- **URL:** `/admin`
- **Auth:** Same app-users (better-auth); admin role required.
- **Used for:** Orders, Order Messages, Carts, Blog, Media, User Files, Addresses, FilamentTypes, PrintingPricing, PrintingOptions, Courier Settings, App Users, Accounts.
- **Custom:** Order discussion field (sidebar when status = needs-discussion).

### 2.6 Auth flow (current)

- Better-auth handles sign-in/sign-up/session (cookies).
- payload-auth plugin stores users/accounts/sessions/verifications in Payload (MongoDB).
- `payload.auth({ headers })` in API routes returns the current user; access control is enforced in custom routes and Payload access rules.

---

## 3. Target Architecture: Next.js Frontend + NestJS Backend

```
┌──────────────────────────────┐     ┌─────────────────────────────────────┐
│  Next.js (frontend only)    │     │  NestJS (backend)                   │
│  - React app                 │     │  - REST (or GraphQL) API            │
│  - SSR/SSG where needed      │────▶│  - Auth (JWT/session/cookies)       │
│  - Calls backend API         │     │  - MongoDB (Mongoose)                │
│  - No Payload, no getPayload │     │  - S3/R2, Redis, Resend, Midtrans   │
└──────────────────────────────┘     └─────────────────────────────────────┘
```

- **Next.js:** Only UI and static assets; all data and auth go to NestJS.
- **NestJS:** All business logic, validation, DB, file uploads, webhooks, and “admin” APIs (you can keep an admin SPA or simple internal UI).

---

## 4. NestJS Backend: Suggested Structure

### 4.1 High-level modules

- **AuthModule** – Registration, login, JWT or session cookies, roles (user/admin), optional Google/magic link (e.g. Passport + strategies, or integrate better-auth-compatible flow if you want to reuse).
- **UsersModule** – Profile, profile image upload (stream to R2).
- **AddressesModule** – CRUD for user addresses.
- **CartModule** – Cart per user (MongoDB or Redis).
- **OrdersModule** – Create, list, get, update status, cancel; order numbers, status history.
- **OrderMessagesModule** – Messages per order; Redis pub/sub + SSE for live updates.
- **PaymentsModule** – Midtrans init/verify, webhook; update order payment status.
- **FilesModule** – Temp uploads, finalize to user-files, R2; cleanup.
- **PrintingModule** – Filament types, printing options, printing pricing (read-only or CRUD for admin).
- **BlogModule** – Posts (title, slug, rich text, featured image); public + admin.
- **MediaModule** – Public media uploads (e.g. blog), R2.
- **GlobalsModule** or **SettingsModule** – Courier/warehouse settings (replace Payload global).
- **BiteshipModule** / **RajaOngkirModule** – Proxy or encapsulate external APIs; use settings for origin.
- **SliceModule** – Call external slice API (or internal service).

### 4.2 Data layer

- **MongoDB** – Keep it; use **Mongoose** in NestJS. You can keep the same database and migrate Payload collections to Mongoose schemas (field names and structure can stay very close to current Payload docs).
- **Redis** – Keep for cache and for order-messages pub/sub (NestJS can use `ioredis` or `@nestjs/bull`).
- **R2/S3** – Use `@nestjs/config` + AWS SDK or a small wrapper for presigned uploads/downloads and cleanup.

### 4.3 Auth in NestJS

Options:

1. **JWT** – Stateless; frontend stores token (cookie or memory) and sends in `Authorization` or cookie; NestJS guards validate and attach user.
2. **Session cookies** – Session store (e.g. MongoDB or Redis); similar to current better-auth behavior from the frontend’s perspective (cookie-based).
3. **Reuse better-auth** – Run better-auth only in the Next.js app for “auth UI” and token/session issuance; Next.js API routes become thin proxies to NestJS, forwarding auth (e.g. cookie or Bearer). NestJS then only validates the token/session and does not run better-auth itself. This reduces migration of auth logic but keeps two places that touch “auth”.

Recommendation: **JWT in cookie (httpOnly)** or **session in DB + cookie** in NestJS so the frontend stays cookie-based and CORS is simple.

### 4.4 Replacing Payload REST for “read-only” config

- **Filament types, printing options, printing pricing** – Expose NestJS endpoints, e.g. `GET /printing/filament-types`, `GET /printing/options`, `GET /printing/pricing` (with query params if needed). Frontend switches from Payload query strings to these.
- **Courier settings** – `GET /settings/courier` (and optionally `PATCH` for admin). Used by Biteship and RajaOngkir services inside NestJS.

---

## 5. Frontend Changes (Next.js)

### 5.1 API base URL

- Set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000` in dev, your NestJS URL in prod).
- Replace all `fetch('/api/...')` with `fetch(\`${API_URL}/...\`)` or a small `api` client that prefixes the base URL and sends credentials (cookies or Authorization).

### 5.2 Auth

- If NestJS issues JWT/session cookie: after login/register on NestJS, the frontend just uses the same cookie (or token) for subsequent requests. You can keep a similar “auth context” in Next.js but get user from NestJS (e.g. `GET /auth/me`) instead of Payload/better-auth.
- If you keep better-auth in Next.js: keep login/signup UI and auth routes in Next.js; add a small “sync to backend” step (e.g. Next.js calls NestJS to register session or get a backend token) or proxy all API calls through Next.js so the backend only sees a token you forward.

### 5.3 Remove Payload

- Remove Payload, payload-auth, and all `@payloadcms/*` dependencies from `package.json`.
- Remove `src/collections`, `src/globals`, `src/payload.config.ts`, `src/app/(payload)/**`, Payload admin and Payload API route.
- Remove `getPayload()`, `payload-types.ts`, and any Payload-specific types; replace with types generated from NestJS DTOs or shared types package.
- `next.config.mjs`: remove `withPayload`; keep Next.js and next-intl as needed.

### 5.4 Endpoints to align with NestJS

Map each current URL to a NestJS endpoint and update the frontend once the backend is ready, e.g.:

| Current (Next.js) | NestJS (example) |
|-------------------|------------------|
| `POST /api/auth/...` | Keep in Next if using better-auth; or move to `POST /auth/login`, etc. |
| `GET/POST/DELETE /api/orders` | `GET/POST/DELETE /orders` |
| `GET/PATCH/DELETE /api/orders/:id` | `GET/PATCH/DELETE /orders/:id` |
| `GET/POST /api/orders/:id/messages` | `GET/POST /orders/:id/messages` |
| `GET /api/orders/:id/messages/stream` | `GET /orders/:id/messages/stream` (SSE) |
| `POST /api/orders/:id/cancel` | `POST /orders/:id/cancel` |
| `GET /api/orders/:id/invoice` | `GET /orders/:id/invoice` |
| `GET/POST/DELETE /api/cart` | `GET/POST/DELETE /cart` |
| `GET/POST /api/user-addresses`, `GET/DELETE /api/user-addresses/:id` | Same under `/addresses` or `/user-addresses` |
| `POST /api/profile-image` | `POST /users/profile-image` |
| `POST/GET/DELETE /api/files/temp*`, `POST /api/files/finalize`, `POST /api/files/cleanup` | Same under `/files/...` |
| `POST /api/payment/initialize`, `POST /api/payment/verify` | `POST /payment/initialize`, `POST /payment/verify` |
| `POST /api/midtrans/notification` | `POST /payment/webhooks/midtrans` |
| `GET /api/blog`, `GET /api/blog/:slug`, `POST /api/blog/create` | `GET /blog`, `GET /blog/:slug`, `POST /blog` |
| `POST /api/biteship/rates` | `POST /shipping/biteship/rates` |
| `POST /api/rajaongkir/calculate-cost` | `POST /shipping/rajaongkir/calculate-cost` |
| `POST /api/slice` | `POST /slice` |
| `GET /api/filament-types?where...` | `GET /printing/filament-types` |
| `GET /api/printing-options?where...` | `GET /printing/options` |
| `GET /api/printing-pricing?where...` | `GET /printing/pricing` |
| `GET /api/globals/courier-settings` | `GET /settings/courier` |
| `GET /api/addresses?...` (SummaryStep) | `GET /addresses` or same as user-addresses |

### 5.5 Admin UI

- Payload admin goes away. Options:
  - **Separate admin SPA** (e.g. Next.js or React) that talks to NestJS and uses the same auth (admin role); NestJS exposes `/admin/*` or role-guarded endpoints.
  - **NestJS + simple admin routes** – Serve a minimal admin UI from NestJS (e.g. React in NestJS or a separate small app).
  - Reuse your **Order discussion** and “admin” flows by having the same Next.js app call NestJS; only the “edit order / edit blog / manage settings” UI needs to be rebuilt.

---

## 6. Data Migration (MongoDB)

- You can keep the **same MongoDB** and **same database name**.
- Payload’s Mongoose adapter uses collections that match collection slugs (e.g. `orders`, `order-messages`, `carts`, `media`, `users` if that’s the slug, etc.). Check Payload’s actual collection names in MongoDB.
- In NestJS, define Mongoose schemas that mirror the current document shape (you can export a sample from Payload or infer from `payload-types.ts`). Rename or adjust only where you want a cleaner schema.
- **Users/accounts/sessions:** If you switch to NestJS-managed auth, you need to either:
  - Migrate existing users/sessions into NestJS’s user/session model, or
  - Run both systems in parallel during a transition (e.g. better-auth in Next.js + NestJS trusts a token issued by Next.js).

---

## 7. Suggested Migration Order

1. **NestJS skeleton** – New repo or monorepo package; MongoDB connection, config, auth module (e.g. JWT or session), global guards.
2. **Auth** – Implement login/register and “me” in NestJS; optionally migrate existing users or keep better-auth and proxy.
3. **Read-only and settings** – Printing (filament-types, options, pricing), courier-settings; no Payload dependency in frontend for these.
4. **Users and addresses** – Profile, profile image, addresses CRUD in NestJS; point Next.js to NestJS.
5. **Cart** – Cart API in NestJS; switch CartProvider and checkout flow.
6. **Orders** – Full order lifecycle (create, list, get, update, cancel, invoice) in NestJS; then order messages + SSE.
7. **Payments** – Midtrans init/verify/webhook in NestJS.
8. **Files** – Temp and finalize and R2 in NestJS; update checkout upload flow.
9. **Blog and media** – Blog and media in NestJS; update blog pages and any media URLs.
10. **Remove Payload** – Strip Payload, payload-auth, admin, and Payload API from Next.js; fix env and config.
11. **Admin** – Build minimal admin (orders, blog, settings, users) on top of NestJS.

---

## 8. Effort and Risks

- **High effort:** Full parity of access control, file handling, webhooks, and edge cases (order status, payment flows, discussion live updates). Auth migration and “admin” rebuild are the heaviest parts.
- **Risks:** Breaking existing users/sessions if auth migration is not planned; breaking checkout or payment if order/payment flow is not tested end-to-end; losing admin convenience until a new admin is built.
- **Benefits:** Clear separation of frontend and backend; NestJS’s structure and testability; no Payload upgrade lock-in; freedom to change DB or add services per module.

---

## 9. Next Steps

1. Decide auth strategy: **full NestJS auth** vs **keep better-auth in Next.js and proxy**.
2. Create NestJS project (standalone or inside a monorepo with the Next.js app).
3. Define Mongoose schemas for the main collections (orders, users, cart, order-messages, etc.) and align with current MongoDB docs.
4. Implement Auth + one small module (e.g. Printing or Settings) and one frontend page that uses it; then iterate module by module.
5. Add a shared TypeScript types package (or OpenAPI-generated client) so Next.js and NestJS stay in sync.

If you tell me your preference (e.g. “NestJS auth from scratch” vs “keep better-auth and proxy”), I can outline concrete NestJS module structure and example DTOs/controllers for the first few modules.
