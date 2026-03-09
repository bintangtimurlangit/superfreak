# Frontend migration roadmap (Payload → Next.js only + NestJS API)

Use this as a checklist. Backend (NestJS) is deployed; switch the frontend domain by domain.

---

## ✅ Phase 0 – API client (done)

- **Added:** `src/lib/api-client.ts` with `get`, `post`, `patch`, `delete`, `postFormData`; `credentials: 'include'`.
- **Env:** `NEXT_PUBLIC_API_URL` in `.env.example`. When set (e.g. `http://localhost:4000` or your backend VPS URL), use it in new code; when unset, existing `fetch('/api/...')` still hits Next.js.

**How to use:** Import from `@/lib/api-client` and call e.g. `api.get('/api/printing/filament-types')` instead of `fetch('/api/filament-types?...')`. NestJS paths are under `/api` (e.g. `/api/orders`, `/api/cart`).

---

## Next steps (in order)

### 1. Auth swap (required before most features)

- **Backend:** NestJS B2 Auth is ready (`/auth/login`, `/auth/register`, `/auth/logout`, `/auth/me`).
- **Frontend:** Create `src/lib/auth/api-auth.ts`: login, register, logout, getMe using `api.post` / `api.get` to `NEXT_PUBLIC_API_URL`.
- Replace or wrap session with a hook that calls `GET /auth/me` (e.g. React Query). Use it in CartProvider, OrderForm, OrderHistoryList, EditProfileForm.
- Point login/signup forms to NestJS auth. Keep better-auth and `/api/auth/[...all]` until cutover is verified.

**Files to touch:** `src/lib/auth/`, login/signup pages, `get-context-props.ts`, CartProvider, OrderForm, OrderHistoryList, EditProfileForm.

---

### 2. F1 – Printing and settings (read-only, good first test)

- Replace `fetch('/api/filament-types?...')`, `fetch('/api/printing-options?...')`, `fetch('/api/printing-pricing?...')`, `fetch('/api/globals/courier-settings')` with `api.get('/api/printing/filament-types')`, `api.get('/api/printing/options')`, `api.get('/api/printing/pricing')`, `api.get('/api/settings/courier')`.
- **Files:** `ConfigureModal.tsx`, `SummaryStep.tsx`, `cart/page.tsx` (if they use these).

---

### 3. F2 – Addresses

- Replace `/api/user-addresses` and `/api/user-addresses/:id` with `api.get/post/patch/delete('/api/addresses', ...)`.
- **Files:** `AddressForm.tsx`, `AddressSelectionModal.tsx`, `AddAddressModal.tsx`, `SummaryStep.tsx`.

---

### 4. F3 – Profile and profile image

- `PATCH /api/users/me`, `POST /api/users/profile-image` (FormData) via api client.
- **Files:** `EditProfileForm.tsx`.

---

### 5. F4 – Cart

- Replace `fetch('/api/cart')` with `api.get('/api/cart')`, `api.post('/api/cart', body)`, `api.delete('/api/cart')`.
- **Files:** `CartProvider.tsx`, any component that mutates cart.

---

### 6. F5 – Orders

- OrderForm: `api.post('/api/orders', body)`.
- OrderHistoryList: `api.get('/api/orders')`.
- Order detail: `api.get('/api/orders/:id')`, messages, cancel, invoice — all via api client.
- **Files:** `OrderForm.tsx`, `OrderHistoryList.tsx`, `orders/[id]/page.tsx`.

---

### 7. F6 – Payments

- `api.post('/api/payment/initialize', ...)`, `api.post('/api/payment/verify', ...)`.
- **Files:** `PaymentSelectionModal.tsx`, `PaymentStep.tsx`, `orders/[id]/page.tsx` (verify).

---

### 8. F7 – Files (checkout)

- Temp: `api.post('/api/files/temp', FormData)`, get/delete via api client.
- Finalize: `api.post('/api/files/finalize', body)` after order creation.
- **Files:** `UploadStep.tsx`, order creation flow.

---

### 9. F8 – Blog

- `api.get('/api/blog')`, `api.get('/api/blog/:slug')`; create if needed: `api.post('/api/blog', ...)`.
- **Files:** `BlogList.tsx`, `blog/[slug]/page.tsx`.

---

### 10. F9 – Shipping (Biteship, RajaOngkir)

- Replace direct fetch to Next.js routes with `api.post('/api/shipping/biteship/rates', ...)`, `api.post('/api/shipping/rajaongkir/calculate-cost', ...)`, `api.get('/api/shipping/rajaongkir/search-destination?...')`.
- **Files:** `lib/biteship.ts`, `lib/rajaongkir.ts`, `SummaryStep.tsx`.

---

### 11. F10 – Wilayah and Slice

- Wilayah: `api.get('/api/wilayah/provinces')`, `api.get('/api/wilayah/regencies/:code')`, etc.
- Slice: `api.postFormData('/api/slice', formData)`.
- **Files:** `useLocation.ts`, `SummaryStep.tsx`, `UploadStep.tsx`, `lib/slice.ts`.

---

### 12. Phase 10 – Remove Payload and clean up

- When all above are on NestJS and tested: remove Payload (collections, globals, payload.config, admin app, payload-auth).
- Remove better-auth usage; auth only via NestJS (`GET /auth/me` + cookies).
- Replace `payload-types` imports with types from API or a shared package.

---

## Quick test without auth change

1. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` (or your backend URL) in `.env.local`.
2. In one place (e.g. `ConfigureModal` or a test page), replace one `fetch('/api/...')` with `api.get('/api/printing/filament-types')` and confirm data loads from NestJS.
3. Then proceed with Auth swap, then F1–F10 in order.
