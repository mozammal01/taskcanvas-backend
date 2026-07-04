# TaskCanvas Backend

Express + TypeScript + PostgreSQL API for [TaskCanvas](https://github.com/mozammal01/taskcanvas-frontend) — a Kanban task board and image annotation tool. The assignment's brief called for Django, but this backend intentionally uses **Node.js + Express** instead, with **PostgreSQL** (via Prisma) for persistence.

## Tech stack

- **Runtime**: Node.js + Express 5, written in TypeScript (strict mode)
- **Database**: PostgreSQL, accessed through Prisma ORM (typed queries + migrations)
- **Auth**: JWT access/refresh tokens, passwords hashed with bcrypt
- **File uploads**: multer (in-memory) + `image-size` to read real pixel dimensions server-side
- **Validation**: zod on every request body/query
- **Package manager**: pnpm

## Demo credentials

```
email:    demo@taskcanvas.dev
password: Demo1234!
```

## Getting started

**Requirements**: Node.js ≥ 20 (developed on v24.11.0), pnpm, and a PostgreSQL database (local install or a free hosted instance like [Neon](https://neon.tech)).

1. Install dependencies:
   ```
   pnpm install
   ```

2. Create `.env` from the template and fill in your own values:
   ```
   cp .env.example .env
   ```
   At minimum set `DATABASE_URL` to a Postgres connection string, e.g.:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/taskcanvas?schema=public&sslmode=require"
   ```
   Generate real random values for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

3. Run the initial migration (creates all tables in your database):
   ```
   pnpm prisma:migrate
   ```

4. Seed the demo user:
   ```
   pnpm prisma:seed
   ```

5. Start the dev server (defaults to port 8000, matching the frontend's `NEXT_PUBLIC_API_BASE_URL`):
   ```
   pnpm dev
   ```

6. Point the `taskcanvas-frontend` dev server at this backend (its default `.env.local` already targets `http://localhost:8000/api`) and log in with the demo credentials above.

### Other scripts

| Script | Purpose |
|---|---|
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run the compiled build (`dist/server.js`) |
| `pnpm prisma:migrate` | Run/create Prisma migrations |
| `pnpm prisma:seed` | Re-run the demo user seed (idempotent) |
| `pnpm prisma:studio` | Open Prisma Studio to browse the database |

## API overview

All routes are mounted under `/api` and, except `/auth/login/`, require `Authorization: Bearer <access-token>`.

```
POST   /api/auth/login/
GET    /api/tasks/?due_date=YYYY-MM-DD
POST   /api/tasks/
PATCH  /api/tasks/:id/
DELETE /api/tasks/:id/
GET    /api/annotate/images/
POST   /api/annotate/images/          (multipart/form-data, field "file")
GET    /api/annotate/shapes/?image=:imageId
PUT    /api/annotate/images/:imageId/shapes/
```

Uploaded images are served statically from `/uploads/<filename>`.

## Challenges along the way

**Canvas-tainting via CORS on uploaded images.** The frontend loads uploaded images into a Konva canvas with `crossOrigin="anonymous"` so it can later read pixel data off the canvas. The static `/uploads` route needed its own explicit `cors()` middleware — same-origin defaults from Express's static file serving weren't enough, and without the right `Access-Control-Allow-Origin` header the canvas would have thrown a tainted-canvas security error the moment any drawing/export logic touched it.

**Getting real image dimensions server-side.** The frontend never sends an uploaded image's width/height (the browser doesn't reliably expose this from a raw `File` before it's rendered), but the annotation canvas needs accurate dimensions to size itself and to un-scale click coordinates back into the image's native pixel space. Solved by reading the uploaded buffer with `image-size` before writing it to disk, so the dimensions returned to the frontend are always correct.

**A `.partial()` schema footgun.** The Tasks `PATCH` endpoint originally derived its validation schema from `taskDraftSchema.partial()`. Zod's `.partial()` doesn't clear a field's `.default()` — so a `PATCH` that only sent `{ status: "in_progress" }` (exactly what the frontend does on a drag-and-drop column change) would silently reset `tags` back to `[]` on every save, because the omitted field fell through to its default instead of being left untouched. Caught this by testing the actual partial-update flow end-to-end rather than trusting the schema definition, and fixed it by defining the patch schema's fields independently instead of composing it from the draft schema.

**Prisma major-version churn.** Prisma 7 (current at the time of writing) removed the classic `url = env("DATABASE_URL")` datasource pattern in favor of a `prisma.config.ts` + driver-adapter setup. To keep the setup simple and avoid an extra `@prisma/adapter-pg` dependency for a project this size, the project pins to the last stable Prisma 6.x release, which still supports the schema-file connection string directly.

**Auth/401 contract with the frontend.** The frontend's axios interceptor force-logs-out the user on *any* `401` and has no refresh-token retry logic. That meant the auth middleware had to be strict about only ever returning `401` (never `403`) for missing, malformed, or expired tokens — a `403` would have looked like a hang to the user instead of a clean logout.

## Project structure

```
prisma/            Schema, migrations, and the demo-user seed script
src/
  config/          Environment variable validation (zod)
  lib/             Prisma client singleton, JWT signing/verification
  middleware/      Auth guard, multer upload config, centralized error handler
  routes/          Express routers, mounted under /api
  controllers/     Request handlers per resource
  validators/      zod schemas per resource
uploads/           Uploaded image files (gitignored, directory tracked via .gitkeep)
```
