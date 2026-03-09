# Step-by-step: Test frontend ↔ backend connection

Use this to confirm the Next.js frontend can talk to the NestJS backend.

---

## 1. Run the backend

**Option A – Local**

```bash
cd superfreak-backend
npm run dev
```

Backend should be at **http://localhost:4000**.

**Option B – Docker on VPS**

Backend is already deployed. Note the URL, e.g. **http://192.168.31.128:4000** or **https://api.yourdomain.com**.

---

## 2. Allow the frontend origin in backend CORS

Backend must allow your frontend origin.

- **Local:** In `superfreak-backend/.env` set:
  ```env
  CORS_ORIGIN=http://localhost:3000
  ```
- **VPS:** Add your frontend URL, e.g.:
  ```env
  CORS_ORIGIN=http://localhost:3000,https://superfreakstudio.com,https://www.superfreakstudio.com
  ```

Restart the backend after changing `.env`.

---

## 3. Point the frontend to the backend

In the **frontend** repo (`superfreak`), create or edit `.env.local`:

**Local backend:**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend on VPS (use your real URL):**

```env
NEXT_PUBLIC_API_URL=http://192.168.31.128:4000
```

Or with a domain:

```env
NEXT_PUBLIC_API_URL=https://api.superfreakstudio.com
```

Save the file.

---

## 4. Restart the frontend

Restart the Next.js dev server so it picks up the new env:

```bash
cd superfreak
npm run dev
```

---

## 5. Open the test page

In the browser go to:

- **http://localhost:3000/en/api-test**  
  or  
- **http://localhost:3000/id/api-test**

You should see:

- **NEXT_PUBLIC_API_URL:** your backend URL (or “(not set – using Next.js routes)”)
- **Using NestJS API:** Yes

Click **“Call GET /health”**.

---

## 6. Check the result

**Success:** You see something like:

```text
Status: 200
{
  "status": "ok",
  "mongodb": "up",
  "redis": "up",
  "timestamp": "..."
}
```

**Failure:**

- **Status: 0** and an error message → network/CORS problem (check backend CORS and URL).
- **Failed to fetch** / **blocked by CORS** → backend CORS_ORIGIN must include your frontend origin (e.g. `http://localhost:3000`).
- **Connection refused** → backend not running or wrong `NEXT_PUBLIC_API_URL`.

---

## 7. Optional: check in DevTools

Open DevTools → **Network**. Click “Call GET /health” again. You should see a request to your backend URL (e.g. `http://localhost:4000/health`) with status **200**.

---

## Quick checklist

| Step | Done |
|------|------|
| Backend running (local or VPS) | ☐ |
| Backend CORS includes frontend origin | ☐ |
| Frontend `.env.local` has `NEXT_PUBLIC_API_URL` | ☐ |
| Frontend dev server restarted | ☐ |
| Opened `/en/api-test` and clicked “Call GET /health” | ☐ |
| Response is 200 with `mongodb` and `redis` | ☐ |

When all are done, the frontend can communicate with the backend. You can remove or ignore the `/api-test` page later, or keep it for debugging.
