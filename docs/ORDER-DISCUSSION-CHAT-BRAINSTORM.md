# Order discussion chat – implementation brainstorm

## Goal

Let the customer and admin have a **per-order chat** when an order is in **needs discussion**, so they can discuss the 3D model (e.g. wall thickness, design changes) in one place. Reuse the idea of the **Contact Support** button to open or focus this discussion.

---

## Current state

- **Order detail page** already has a **Discussion** block (sidebar) when `order.status === 'needs-discussion'`: message list (customer vs admin bubbles), textarea, Send, Attach. It uses **mock** `order.conversations` (hardcoded in the page).
- **Contact Support** is a generic button in the header; it doesn’t link to this discussion.
- **Orders** have `adminNotes` (single textarea) and `customerNotes`, but **no real conversation/messages** in the database.

---

## 1. Button behavior: Contact Support → Discuss order

**Option A – Replace by context (recommended)**  
- When order is **needs discussion**: show **“Discuss order”** (or “Order chat”) instead of “Contact Support”. Click scrolls to / focuses the existing Discussion chat on the same page (or opens it if we move it to a modal).  
- When order is **not** needs discussion: keep **“Contact Support”** as a generic action (e.g. mailto, help center link, or a simple “Ask about this order” that could create a discussion – see phase 2).

**Option B – One button, two behaviors**  
- Single button **“Contact support / Discuss order”**:  
  - If needs discussion → scroll to chat or open chat.  
  - Else → open generic contact (link or modal).

**Recommendation:** Start with **Option A**: “Discuss order” only when status is `needs-discussion`, and wire that button to the real chat (scroll to section or open chat panel). Keep “Contact Support” for other statuses as a separate, generic action.

---

## 2. Data model: where to store messages

We need **one thread per order** and **many messages** (customer + admin).

**Option A – New collection `order-messages` (recommended)**  
- **Collection:** `order-messages`  
  - `order` (relationship → `orders`, required)  
  - `author` (relationship → `app-users` or polymorphic user/admin; or `authorType`: 'customer' | 'admin' + `authorId`)  
  - `body` (textarea or richText)  
  - `createdAt` (timestamps)  
  - Optional: `readAt` (date), `attachments` (upload relationship) later  
- **Access:**  
  - Create: customer can create only for their own orders; admin can create for any order.  
  - Read: customer only for their orders; admin for all.  
- **Pros:** Simple queries (“all messages for this order”), pagination, easy to add read receipts or attachments later.  
- **Cons:** One more collection and API to maintain.

**Option B – Embedded array on Order**  
- Add field to **Orders**: `messages: array` of `{ authorType, authorId, body, createdAt }`.  
- **Pros:** No new collection; everything in one document.  
- **Cons:** Document grows unbounded; harder to paginate and to enforce size limits; less flexible for future features (e.g. attachments, read state).

**Recommendation:** **Option A – new `order-messages` collection.** Fits Payload’s patterns, keeps Orders document small, and scales better.

---

## 3. API design

- **GET** `/api/orders/[orderId]/messages`  
  - Query params: `page`, `limit` (e.g. 20), optional `before` (cursor).  
  - Returns messages for that order (sorted by `createdAt` asc or desc).  
  - Auth: customer only for their order; admin for any order (respect Payload access).

- **POST** `/api/orders/[orderId]/messages`  
  - Body: `{ body: string }` (optional later: `attachmentIds[]`).  
  - Creates a new message; sets `order`, `author` from auth.  
  - Auth: same as above; optionally restrict to “needs discussion” or allow for any order (your product choice).

- **Optional later:**  
  - PATCH mark as read, or GET unread count for admin.

Use **Payload’s Local API** inside these route handlers with `overrideAccess: false` and the request user so access rules are enforced.

---

## 4. Where the chat lives (UI)

- **Current:** Discussion block is already on the **order detail page** in the sidebar when status is needs discussion.  
- **Recommendation:**  
  - Keep the chat **on the order detail page** (no new route for v1).  
  - Change **“Contact Support”** to **“Discuss order”** when `status === 'needs-discussion'` and make it **scroll to** the Discussion section (or focus the textarea) so the user lands exactly on the chat.  
  - Optional later: same chat in a **modal or slide-over** opened from “Discuss order” so it works from list view or other entry points.

---

## 5. Who can send messages

- **Customer:** Can send when viewing their own order (order detail page). Only for that order.  
- **Admin:** Can reply from:  
  - **Payload Admin:** Custom list/detail view or a dedicated “Order messages” list filtered by order, or an embedded message list in the Order edit view.  
  - **Frontend:** If you add an admin-only view of the same order detail page, reuse the same Discussion component and APIs (author derived from auth: admin vs customer).

Start with **Payload Admin** for admin replies (custom component in Order edit showing messages + textarea and “Send” calling Local API), and **frontend** for customer. If you later add an admin frontend, reuse the same API and UI.

---

## 6. When can the chat be used?

- **Strict:** Only when status is **needs discussion**.  
- **Relaxed:** Allow customer to send a message for any order (e.g. “Ask about this order”); backend still creates messages in `order-messages`. Status “needs discussion” then means “admin has flagged this for discussion” and the thread is already in use.

**Recommendation:** Start **strict** – only show and allow sending when `order.status === 'needs-discussion'`. You can relax later (e.g. allow customer to open discussion from “Contact Support” and set status to needs discussion or a separate “has open discussion” flag).

---

## 7. Notifications (optional)

- When **admin sends** a message: notify customer (e.g. email “You have a new message about order ORD-…”).  
- When **customer sends**: notify admins (e.g. in Payload, or email).  
Can be added in a later phase via Payload hooks or a small job.

---

## 8. Implementation phases

**Phase 1 – Backend & wiring (no new UI)**  
1. Add **`order-messages`** collection (order, author, body, timestamps, access control).  
2. Add **GET** and **POST** `/api/orders/[id]/messages` (using Payload Local API, enforce order ownership for customers).  
3. Regenerate types (`generate:types`).

**Phase 2 – Frontend: real data + button**  
4. On order detail page, **fetch** messages from `GET /api/orders/[id]/messages` instead of mock.  
5. **Send** button: POST new message, then refetch (or append optimistically) and clear textarea.  
6. Replace **Contact Support** with **“Discuss order”** when `status === 'needs-discussion'` and make it scroll to (or focus) the Discussion section.  
7. Optional: disable Send when order is not needs discussion (or hide Discussion when not needs discussion, as now).

**Phase 3 – Admin can reply**  
8. In Payload Admin: add a **custom component** (or block) on the Order edit view that lists messages for this order and has a textarea + “Send” that creates a new message via Local API (with `req.user` as admin).  
9. Or: add an **Order Messages** list view in admin (filter by order) and admin replies from there.

**Phase 4 – Polish**  
10. Attachments (optional): add `attachments` to `order-messages` and file upload in UI.  
11. Notifications (optional): email on new message.  
12. “Contact Support” for non–needs-discussion: keep as mailto or link, or later “Start discussion” that creates a message and sets status to needs discussion (if you want).

---

## 9. Summary

| Topic              | Recommendation                                                                 |
|--------------------|---------------------------------------------------------------------------------|
| Button             | “Discuss order” when needs discussion (replaces Contact Support); scroll to chat |
| Data model         | New collection `order-messages` (order, author, body, createdAt)               |
| API                | GET/POST `/api/orders/[id]/messages` with auth                                 |
| Chat UI            | Keep current Discussion block on order detail; feed it from API                 |
| Who sends          | Customer on order detail; admin from Payload Admin (custom component)           |
| When               | Only when status is needs discussion (for v1)                                  |

If you want to proceed, the next step is **Phase 1**: define the `order-messages` collection and the two API routes, then wire the existing Discussion UI to them and change the header button as in Phase 2.
