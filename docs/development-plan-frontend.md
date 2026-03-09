# Frontend (Next.js) Development Plan

This document is the development plan for the **Next.js frontend** only. For the backend plan see [development-plan-backend.md](development-plan-backend.md). For migration context see [MIGRATION-NEXT-NESTJS-ANALYSIS.md](MIGRATION-NEXT-NESTJS-ANALYSIS.md).

Switch one domain at a time to the NestJS API; use the API client and new auth where applicable.

---

## 1. API client and env

**When:** Before switching any feature to NestJS (align with backend B2 or B3).

### Env

- Add **`NEXT_PUBLIC_API_URL`** (e.g. `http://localhost:4000` in dev). Use it in a single API client so all requests go through one place.

### API client

- Create **`src/lib/api-client.ts`** (or `api.ts`):
  - Base URL from `process.env.NEXT_PUBLIC_API_URL`.
  - Default `credentials: 'include'` for cookie auth.
  - Helpers: `get(path)`, `post(path, body)`, `patch(path, body)`, `delete(path)`; optional `postFormData(path, FormData)` for file uploads.
  - Optional: attach `Authorization: Bearer <token>` if using token from cookie/localStorage.
- Replace all `fetch('/api/...')` gradually with this client (e.g. `api.get('/printing/filament-types')`). Prefer doing it per domain (printing first, then auth, then cart, etc.) to avoid big-bang.

---

## 2. Auth client swap (NestJS auth)

**When:** After backend B2 (Auth module) is ready.

### New auth client

- Create e.g. **`src/lib/auth/api-auth.ts`** (or extend existing):
  - `login(email, password)` → `POST ${API_URL}/auth/login` (with credentials).
  - `register(...)` → `POST ${API_URL}/auth/register`.
  - `logout()` → `POST ${API_URL}/auth/logout`.
  - `getMe()` → `GET ${API_URL}/auth/me`.

### Session state

- Replace or wrap `useSession` (from better-auth) with a hook that calls `GET /auth/me` and caches result (e.g. React Query: `useQuery(['auth/me'], () => api.get('/auth/me'))`).
- Use that hook in:
  - `src/components/providers/CartProvider.tsx`
  - `src/components/forms/order/OrderForm.tsx`
  - `src/components/orders/OrderHistoryList.tsx`
  - `src/components/profile/EditProfileForm.tsx`

### Login/signup pages

- Point form submit to NestJS auth endpoints (via new client). Keep UI; change only the API target.

### Server-side auth

- Replace `src/lib/auth/context/get-context-props.ts` (and any layout/props that need user) with a call to NestJS `GET /auth/me` forwarding the request cookies (or use middleware that validates JWT from cookie and attaches user).
- Ensure protected layouts and server components get user from this new source.

**Note:** Do not remove better-auth package or `/api/auth/[...all]` until cutover is verified and you are ready for migration Phase 10.

---

## 3. Development order (by feature)

### F1. Printing and settings (read-only)

- **Files:** `src/components/forms/order/ConfigureModal.tsx`, `src/components/forms/order/SummaryStep.tsx`, `src/app/[locale]/(frontend)/cart/page.tsx`.
- **Tasks:**
  - Replace `fetch('/api/filament-types?...')`, `fetch('/api/printing-options?...')`, `fetch('/api/printing-pricing?...')`, `fetch('/api/globals/courier-settings')` with `api.get('/printing/filament-types')`, etc., using `NEXT_PUBLIC_API_URL`.
  - Adjust query params to match NestJS (e.g. `?isActive=true` if that’s the contract).
- **Types:** Define local interfaces or use shared types for filament types, options, pricing, courier settings.

---

### F2. Addresses

- **Files:** `src/components/profile/AddressForm.tsx`, `src/components/orders/AddressSelectionModal.tsx`, `src/components/orders/AddAddressModal.tsx`, `src/components/forms/order/SummaryStep.tsx` (if it uses addresses).
- **Tasks:** Replace `/api/user-addresses` and `/api/user-addresses/:id` with `api.get/post/patch/delete('/addresses', ...)`. Keep same request/response shape or adapt to NestJS DTOs. Use API client with credentials.

---

### F3. Profile and profile image

- **Files:** `src/components/profile/EditProfileForm.tsx`.
- **Tasks:** `PATCH /users/me` for name etc.; `POST /users/profile-image` (FormData) for avatar. Use API client; update session/user cache after update.

---

### F4. Cart

- **Files:** `src/components/providers/CartProvider.tsx`, any component that mutates cart.
- **Tasks:** Replace `fetch('/api/cart')` with `api.get('/cart')`, `api.post('/cart', body)`, `api.delete('/cart')`. Keep cart item shape compatible so cart UI and checkout logic don’t break.

---

### F5. Orders

- **Files:** `src/components/forms/order/OrderForm.tsx`, `src/components/orders/OrderHistoryList.tsx`, `src/app/[locale]/(frontend)/orders/[id]/page.tsx`, order cancel and invoice.
- **Tasks:**
  - **OrderForm:** POST order to NestJS; get order id and redirect to order page or payment.
  - **OrderHistoryList:** GET orders from NestJS.
  - **Order detail:** GET order, GET messages, POST message, EventSource for stream, cancel, invoice download — all to NestJS base URL.
- **Types:** Order, OrderItem, etc. from shared types or from API response types.

---

### F6. Payments

- **Files:** `src/components/orders/PaymentSelectionModal.tsx`, `src/components/forms/order/PaymentStep.tsx`, `src/app/[locale]/(frontend)/orders/[id]/page.tsx` (verify).
- **Tasks:** `POST /payment/initialize` and `POST /payment/verify` via API client; same body/response handling as today where possible.

---

### F7. Files (checkout flow)

- **Files:** `src/components/forms/order/UploadStep.tsx`; order creation flow that references temp files and finalize.
- **Tasks:**
  - Upload temp to NestJS `POST /files/temp`; retrieve/delete temp via NestJS.
  - After order creation, ensure finalize is called (either from frontend or backend); if finalize is explicit from frontend, call NestJS `POST /files/finalize`.
  - The behavior in `src/collections/Orders/hooks/finalizeOrderFiles.ts` moves to NestJS (order creation + finalize in one flow or two calls).

---

### F8. Blog

- **Files:** `src/components/sections/BlogList.tsx`, `src/app/[locale]/(frontend)/blog/[slug]/page.tsx`, any blog create UI.
- **Tasks:** Fetch list and post from NestJS `GET /blog`, `GET /blog/:slug`. If blog create exists in app, point to `POST /blog` (admin only).

---

### F9. Shipping (Biteship, RajaOngkir)

- **Files:** `src/lib/biteship.ts`, `src/lib/rajaongkir.ts`, `src/components/forms/order/SummaryStep.tsx` (if it calls these).
- **Tasks:** Call NestJS `POST /shipping/biteship/rates` and RajaOngkir endpoints instead of Next.js API routes.

---

### F10. Wilayah and Slice

- **Wilayah:** `src/hooks/location/useLocation.ts`, `src/components/forms/order/SummaryStep.tsx` — if NestJS exposes `/wilayah/:type/:code?`, switch to API client; else keep Next.js proxy.
- **Slice:** `src/components/forms/order/UploadStep.tsx`, `src/lib/slice.ts` — call NestJS `POST /slice` or keep Next.js proxy until backend has it.

---

## 4. Remove Payload and clean up (Phase 10)

**When:** All features above are on NestJS and tested.

### Remove Payload

- Delete: `src/collections`, `src/globals`, `src/payload.config.ts`, `src/app/(payload)/**`, `src/lib/payload.ts`, `src/components/payload/OrderDiscussionField.tsx`.
- Remove from package.json: `payload`, `payload-auth`, all `@payloadcms/*`.
- Remove `withPayload` from `next.config.mjs`.

### Remove better-auth usage

- Remove or replace `src/lib/auth/client.ts` (better-auth client); remove `/api/auth/[...all]` route; ensure server-side auth uses only NestJS (e.g. `GET /auth/me` with cookies).

### Replace payload-types

- Replace `payload-types.ts` imports with shared types package or types inferred from NestJS API (OpenAPI or hand-written). Search for `@/payload-types` and `PayloadOrder`, etc.; replace with new types.

### Cleanup

- Fix any remaining `getPayload()` or `payload.` references (e.g. in server components or legacy routes); delete or stub those routes.

---

## 5. Admin UI (Phase 11)

Choose one:

- **Option A:** New app under same repo (e.g. `apps/admin`) — Next.js or Vite React; login to NestJS (admin role); pages: Orders list/detail (with status edit and discussion), Blog create/edit, Courier settings. Order discussion: same as current `OrderDiscussionField` but calling NestJS `GET/POST /orders/:id/messages`.
- **Option B:** Admin routes inside current Next.js app (e.g. `/admin`) — same auth and API client; admin-only routes guarded by role from `GET /auth/me`.
- **Option C:** NestJS serves a simple React admin (e.g. static build in NestJS).

Implement only the screens you need: orders (list, detail, status, messages), blog, settings.

---

## 6. Testing and deployment

- **E2E (e.g. Playwright):** Login, add to cart, checkout (address, payment init), order detail, order messages. Run against local NestJS + Next.js.
- **Env:** `NEXT_PUBLIC_API_URL` points to NestJS in staging/prod. Build Next.js as static/SSR as today; no Payload build step.
- **Optional:** Shared TypeScript types in `packages/shared-types` (used by both `apps/web` and `apps/api`) or generate client from NestJS OpenAPI.

---

## 7. Sync with backend

Run frontend steps **after** the corresponding backend module is ready. See [development-plan-backend.md](development-plan-backend.md) for backend module order (B1–B15).

| Step | Backend (NestJS)         | Frontend (Next.js)                    |
|------|--------------------------|----------------------------------------|
| 1    | B1 Skeleton + health     | Add API client + NEXT_PUBLIC_API_URL  |
| 2    | B2 Auth                  | Auth client swap + useSession replacement |
| 3    | B3 Printing, B4 Settings| F1 Printing + settings                |
| 4    | B5 Users, B6 Addresses   | F2 Addresses, F3 Profile              |
| 5    | B7 Cart                  | F4 Cart                               |
| 6    | B8 Orders                | F5 Orders                             |
| 7    | B9 Order-messages        | (same pages as F5; messages + SSE)    |
| 8    | B10 Payments             | F6 Payments                           |
| 9    | B11 Files                | F7 Files                              |
| 10   | B12 Blog (B13 Media)     | F8 Blog                               |
| 11   | B14 Shipping, B15 Slice/Wilayah | F9, F10 Shipping, Wilayah, Slice |
| 12   | —                        | Remove Payload; Admin UI               |
