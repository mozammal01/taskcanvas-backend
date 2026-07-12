# TaskCanvas Backend

Express + TypeScript + PostgreSQL API for [TaskCanvas](https://github.com/mozammal01/taskcanvas-frontend) — a Kanban task board and image annotation tool. The assignment's brief called for Django, but this backend intentionally uses **Node.js + Express** instead, with **PostgreSQL** (via Prisma) for persistence, and is deployable as-is to **Vercel**.

## Tech stack

- **Runtime**: Node.js + Express 5, written in TypeScript (strict mode)
- **Database**: PostgreSQL, accessed through Prisma ORM (typed queries + migrations)
- **Auth**: JWT access/refresh tokens, passwords hashed with bcrypt
- **File uploads**: multer (in-memory) streamed straight to **Cloudinary**, which also reports real pixel dimensions
- **Validation**: zod on every request body/query
- **Package manager**: pnpm

## Live deployment

- Backend: https://taskcanvas-backend.vercel.app
- Frontend: https://taskcanvas-frontend.vercel.app

## Demo credentials

```
email:    demo@taskcanvas.dev
password: Demo1234!
```

## Getting started (local development)

**Requirements**: Node.js ≥ 20 (developed on v24.11.0), pnpm, a PostgreSQL database (local install or a free hosted instance like [Neon](https://neon.tech)), and a free [Cloudinary](https://cloudinary.com) account.

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
   Generate real random values for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), and fill in `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` from your Cloudinary dashboard (Settings → API Keys — use a key with full/default permissions, not a restricted one).

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
| `pnpm build` | Compile TypeScript to `dist/` (also runs on Vercel's build step) |
| `pnpm start` | Run the compiled build (`dist/server.js`) |
| `pnpm prisma:migrate` | Run/create Prisma migrations |
| `pnpm prisma:seed` | Re-run the demo user seed (idempotent) |
| `pnpm prisma:studio` | Open Prisma Studio to browse the database |

## Deploying to Vercel

The app ships with `api/index.ts` (exports the Express app as a serverless function) and `vercel.json` (rewrites every request to it), so no extra scaffolding is needed — the same Express routes run locally and on Vercel unchanged.

1. Push this repo to GitHub (already done) and import it into Vercel ("Add New Project" → select `taskcanvas-backend`). Vercel auto-detects the Node.js/`api/` setup; no framework preset needed.

2. In the Vercel project's **Settings → Environment Variables**, add every variable from `.env.example`:
   - `DATABASE_URL` — use a **pooled** connection string (e.g. Neon's `-pooler` host, or add `?pgbouncer=true` for other providers) since serverless functions open a fresh connection per invocation.
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
   - `CORS_ORIGIN` — your deployed frontend's URL (e.g. `https://your-frontend.vercel.app`)
   - `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `PORT` is not needed on Vercel (serverless functions don't listen on a port).

3. Deploy. Vercel runs `pnpm install` (which also runs `prisma generate` via the `postinstall` script) and then `pnpm build`, so the Prisma client is always generated with the `rhel-openssl-3.0.x` binary target the Vercel runtime needs (see `prisma/schema.prisma`'s `binaryTargets`).

4. Migrations are **not** run automatically on every deploy (deliberately — running `prisma migrate deploy` as part of a build step can race across concurrent deployments). Run it yourself once per schema change, pointed at the production database:
   ```
   DATABASE_URL="<your production DATABASE_URL>" npx prisma migrate deploy
   ```
   Seed the demo user the same way if needed: `DATABASE_URL="<prod>" npx prisma db seed`.

5. Once deployed, update the frontend's `NEXT_PUBLIC_API_BASE_URL` to `https://<your-backend>.vercel.app/api` and redeploy the frontend.

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
DELETE /api/annotate/images/:id/
GET    /api/annotate/shapes/?image=:imageId
PUT    /api/annotate/images/:imageId/shapes/
```

Uploaded images are hosted on Cloudinary; `ImageAsset.url` is Cloudinary's own CDN URL, served with permissive CORS by default (needed for the frontend's `crossOrigin="anonymous"` canvas reads).

## Challenges along the way

**Local disk uploads don't survive serverless.** The first version of this backend wrote uploaded images to a local `uploads/` folder and served them via `express.static`. That works fine on a normal server but breaks entirely on Vercel, where each function invocation gets an ephemeral, mostly read-only filesystem. Switched to streaming the multer buffer straight to Cloudinary and storing its returned CDN URL instead — this also conveniently removed the need for a separate `image-size` dependency, since Cloudinary's upload response already includes real width/height.

**A scoped Cloudinary API key silently failing.** During setup, uploads kept failing with a bare `403` while the credential-check (`ping`) endpoint succeeded — a confusing combination since a wrong secret usually fails *authentication*, not authorization. It turned out the API key had restricted permissions (Cloudinary lets you scope keys to read-only, etc.). Diagnosed by hitting `cloudinary.api.usage()` directly, which returned an explicit "missing permissions" message the upload call didn't surface, and resolved by switching to a key with full/default permissions.

**Canvas-tainting via CORS on uploaded images.** The frontend loads uploaded images into a Konva canvas with `crossOrigin="anonymous"` so it can later read pixel data off the canvas — without the right `Access-Control-Allow-Origin` header on the image response, that throws a tainted-canvas security error. Cloudinary's CDN sends permissive CORS headers by default, so this came for free after the move away from local static file serving (which had needed its own explicit `cors()` middleware).

**A `.partial()` schema footgun.** The Tasks `PATCH` endpoint originally derived its validation schema from `taskDraftSchema.partial()`. Zod's `.partial()` doesn't clear a field's `.default()` — so a `PATCH` that only sent `{ status: "in_progress" }` (exactly what the frontend does on a drag-and-drop column change) would silently reset `tags` back to `[]` on every save, because the omitted field fell through to its default instead of being left untouched. Caught this by testing the actual partial-update flow end-to-end rather than trusting the schema definition, and fixed it by defining the patch schema's fields independently instead of composing it from the draft schema.

**Prisma major-version churn.** Prisma 7 (current at the time of writing) removed the classic `url = env("DATABASE_URL")` datasource pattern in favor of a `prisma.config.ts` + driver-adapter setup. To keep the setup simple and avoid an extra `@prisma/adapter-pg` dependency for a project this size, the project pins to the last stable Prisma 6.x release, which still supports the schema-file connection string directly. Separately, Vercel's serverless runtime needs a `rhel-openssl-3.0.x` Prisma engine binary alongside the locally-generated `native` one — without adding it to `binaryTargets`, the deployed function throws a "can't find query engine" error at runtime instead of build time.

**Auth/401 contract with the frontend.** The frontend's axios interceptor force-logs-out the user on *any* `401` and has no refresh-token retry logic. That meant the auth middleware had to be strict about only ever returning `401` (never `403`) for missing, malformed, or expired tokens — a `403` would have looked like a hang to the user instead of a clean logout.

**A silently-dropped field the frontend depended on.** The frontend added a draft/reviewed status per shape, sent as `status` on every `PUT .../shapes/`. The `shapeSchema` zod validator only defined `{ id, imageId, points, label }`, and zod strips unknown keys by default, so `status` was silently discarded on every save with no error - and the frontend's autosave (which trusts the server's response as the new source of truth) would overwrite the local "reviewed" state back to nothing within about a second of setting it. Not a crash, not a validation error, just quietly wrong. Found by testing the full round trip against the real database instead of only the request/response shape in isolation. Fixed by adding a `ShapeStatus` enum + `status` column (migration `20260710175901_add_shape_status`) and including it in both the validator and the serializer.

**A drag library eating every click.** Unrelated to this backend, but worth noting since it was found while verifying the fix above end-to-end: the frontend's `TaskCard` used dnd-kit's `useDraggable` with no activation constraint, which intercepted every plain click before it ever reached the card's `onClick` - the task-edit modal was unreachable by clicking a card, full stop. Never caught earlier because every prior test exercised drag-and-drop or the "add task" button, never a plain click on an existing card. Fixed on the frontend with an 8px pointer-movement activation constraint so a stationary click and a real drag are distinguishable.

## Project structure

```
api/               Vercel serverless entry point (exports the Express app)
prisma/            Schema, migrations, and the demo-user seed script
src/
  config/          Environment variable validation (zod)
  lib/             Prisma client singleton, Cloudinary client, JWT signing/verification
  middleware/      Auth guard, multer upload config, centralized error handler
  routes/          Express routers, mounted under /api
  controllers/     Request handlers per resource
  validators/      zod schemas per resource
```
