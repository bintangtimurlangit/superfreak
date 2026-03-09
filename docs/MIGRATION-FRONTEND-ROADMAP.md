# Frontend migration roadmap (Payload → Next.js only + NestJS API)

Use this as a checklist. Backend (NestJS) is deployed; switch the frontend domain by domain.

---

## ✅ Phase 0 – API client (done)

- **Added:** `src/lib/api-client.ts` with `get`, `post`, `patch`, `delete`, `postFormData`; `credentials: 'include'`.
- **Env:** `NEXT_PUBLIC_API_URL` in `.env.example`. When set (e.g. `http://localhost:4000` or your backend VPS URL), use it in new code; when unset, existing `fetch('/api/...')` still hits Next.js.

**How to use:** Import from `@/lib/api-client` and call e.g. `api.get('/api/printing/filament-types')` instead of `fetch('/api/filament-types?...')`. NestJS paths are under `/api` (e.g. `/api/orders`, `/api/cart`).

---

## ✅ Auth swap (done)

- **Added:** `src/lib/auth/api-auth.ts` (login, register, logout, getMe), `src/lib/auth/use-auth-session.ts` (useAuthSession, useSignOut).
- When `NEXT_PUBLIC_API_URL` is set: session from GET /auth/me, login/register via NestJS, logout via POST /auth/logout; Google sign-in hidden.
- **Switched:** All `useSession` → `useAuthSession`; Navbar/ProfileSidebar use `useSignOut`; SignInModal/SignUpModal use api-auth when isUsingNestApi().
- CartProvider loads/sets/clears cart via api client when isUsingNestApi().

---

## ✅ F1 – Printing and settings (done)

- **Added:** `src/lib/printing-data.ts` (fetchPrintingData) for NestJS or Payload.
- ConfigureModal uses fetchPrintingData() for filament types, options, pricing.
- SummaryStep fetches courier settings from api.get('/api/settings/courier') when isUsingNestApi().

---

## ✅ Central API URLs (done)

- **Added:** `src/lib/api/urls.ts` – all API paths (AUTH, CART, PRINTING, ORDERS, PAYMENT, ADDRESSES, WILAYAH, SLICE, FILES, BLOG, SHIPPING, USERS, etc.). Use these constants instead of string literals.

---

## ✅ F2 – Addresses (done)

- When Nest: `api.get/post/delete(ADDRESSES.base | ADDRESSES.byId(id))`. Payload fallback: `USER_ADDRESSES`.
- **Files:** `AddressForm.tsx`, `AddressSelectionModal.tsx`, `AddAddressModal.tsx`, `SummaryStep.tsx`.

---

## ✅ F3 – Profile and profile image (done)

- When Nest: `api.patch(USERS.me, { name })`, `api.postFormData(USERS.profileImage, formData)`.
- **Files:** `EditProfileForm.tsx`. (Clearing profile image when Nest not supported yet.)

---

## ✅ F4 – Cart (done)

- When Nest: `api.get/post/delete(CART)`. **Files:** `CartProvider.tsx`.

---

## ✅ F5 – Orders (done)

- When Nest: OrderForm `api.post(ORDERS.base)`, OrderHistoryList `api.get(ORDERS.base)`, orders/[id]: get, messages, stream, cancel, invoice, verify, POST message via api + ORDERS/PAYMENT urls.
- **Files:** `OrderForm.tsx`, `OrderHistoryList.tsx`, `orders/[id]/page.tsx`.

---

## ✅ F6 – Payments (done)

- When Nest: `api.post(PAYMENT.initialize)`, `api.post(PAYMENT.verify)`.
- **Files:** `PaymentSelectionModal.tsx`, `PaymentStep.tsx`, `orders/[id]/page.tsx`.

---

## ✅ F7 – Files (done)

- When Nest: temp upload (one file per request) and slice via `api.postFormData(FILES.temp | SLICE)`.
- **Files:** `UploadStep.tsx`, `lib/slice.ts`. (Finalize: call `api.post(FILES.finalize, { orderId, tempFileIds })` after order create when needed.)

---

## ✅ F8 – Blog (done)

- When Nest: `api.get(BLOG.base)` in BlogList; normalize response shape.
- **Files:** `BlogList.tsx`.

---

## ✅ F9 – Shipping (done)

- When Nest: `api.post(SHIPPING.biteshipRates)`, `api.post(SHIPPING.rajaongkirCalculateCost)`, `api.get(SHIPPING.rajaongkirSearchDestination)`.
- **Files:** `lib/biteship.ts`, `lib/rajaongkir.ts`.

---

## ✅ F10 – Wilayah and Slice (done)

- When Nest: Wilayah via `api.get(WILAYAH.provinces | regencies | districts | villages)` in `useLocation.ts`. Slice via api in `UploadStep.tsx` and `lib/slice.ts`.

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
