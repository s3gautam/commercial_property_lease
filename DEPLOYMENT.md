# Deployment

## Local Development

```bash
cp .env.example .env
pnpm install
docker compose -f infra/docker-compose.yml up
```

This starts PostgreSQL, Redis, MinIO, the FastAPI backend, the Next.js web
app, and the Expo dev server from one command.

## Environment Variables

See `.env.example` for the full list, including `DISABLE_SSL_VERIFY`,
`REQUESTS_CA_BUNDLE`, and `SSL_CERT_FILE` for corporate/Windows SSL
interception during development. `DISABLE_SSL_VERIFY` must default to
`false` and is rejected at startup if set alongside `environment=production`
(see `app/core/http_client.py`).

`NEXT_PUBLIC_API_URL` and `EXPO_PUBLIC_API_URL` both point at the backend
API (including the `/api/v1` prefix). On a physical device or simulator,
`EXPO_PUBLIC_API_URL` must use your machine's LAN IP instead of
`localhost` — the device can't resolve `localhost` back to your dev
machine.

## Running the mobile app

```bash
cd apps/mobile
pnpm dev            # Expo dev server — scan the QR code with Expo Go
pnpm ios            # iOS simulator (macOS only)
pnpm android        # Android emulator
```

Metro (the mobile bundler) is stricter than Node about transitive
dependencies under pnpm — see the note in ARCHITECTURE.md's Mobile App
Conventions section if you hit an "Unable to resolve module" error for a
package you never import directly.

## Production

This is a minimal real deployment (web on Vercel, backend + Postgres +
Redis on Railway) — enough to get a working, internet-reachable instance
for testing. It is **not** the full production hardening pass (no CI/CD,
no monitoring/alerting, no secrets manager, no CDN/object storage for
uploads) — see TASKS.md's Technical Debt section for what's still
missing before this should hold real user data.

### 1. Backend + database on Railway

1. Create a new Railway project from this GitHub repo.
2. Add a service with **Root Directory** set to `services/backend`.
   Railway auto-detects the `Dockerfile` there and builds it. The
   Dockerfile's entrypoint (`docker-entrypoint.sh`) runs
   `alembic upgrade head` before starting the server on every deploy, so
   migrations never need to be run manually.
3. Add a **PostgreSQL** plugin and a **Redis** plugin to the same
   project.
4. On the backend service, set these environment variables (Railway lets
   you reference other services' variables directly, e.g.
   `${{Postgres.DATABASE_URL}}`):
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` — the app normalizes
     the `postgresql://` scheme Railway provides to `postgresql+asyncpg://`
     automatically, no manual editing needed
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
   - `ENVIRONMENT` = `production`
   - `JWT_SECRET` = a real random secret (e.g.
     `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`) —
     never reuse a dev value
   - `GROQ_API_KEY` = your real key
   - `CORS_ALLOWED_ORIGINS` = the web app's URL once you have it from step
     2 below (comma-separated if there's more than one, e.g. a custom
     domain plus the Vercel-assigned one). **The app refuses to start in
     production without this set** — see `app/main.py`.
   - `DISABLE_SSL_VERIFY` = `false` (or just leave unset — this is the
     default, and setting it `true` in production is rejected at startup)
   - Leave `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` blank unless you've
     set up Google OAuth — neither app's UI wires up Google Sign-In yet
     regardless (see TASKS.md)
5. Railway assigns a public domain (Settings → Networking → Generate
   Domain). That's your backend URL.

### 2. Web on Vercel

1. Import this GitHub repo as a new Vercel project.
2. Set **Root Directory** to `apps/web`. Vercel auto-detects the
   pnpm workspace (via `pnpm-workspace.yaml` at the repo root) and the
   Next.js framework — no custom build/install command needed.
3. Set environment variable `NEXT_PUBLIC_API_URL` to
   `https://<your-railway-domain>/api/v1`.
   - For the "Continue with Google" button to appear, also set
     `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the same OAuth client ID you put in
     the backend's `GOOGLE_CLIENT_ID`, and add your Vercel domain (e.g.
     `https://your-app.vercel.app`) as an **Authorized JavaScript origin**
     on that OAuth client in the
     [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
     Leave it unset to hide the button (OTP login still works).
4. Deploy. Vercel assigns a domain (or attach a custom one).
5. **Go back to Railway** and set `CORS_ALLOWED_ORIGINS` to this Vercel
   domain (step 1.4 above) — the backend won't accept requests from the
   web app until this is set correctly, and the two deploys are
   necessarily ordered (you need the Vercel URL before you can set it).

### 3. Verify

- `https://<railway-domain>/api/v1/health` should return
  `{"success": true, "data": {"status": "ok"}}`.
- `https://<railway-domain>/docs` shows the OpenAPI docs.
- The Vercel URL should load the web app and successfully browse
  properties (which will be empty until you create some — there's no
  admin UI for listings yet, only the API).
- Sign up via OTP login: the code is currently only ever
  `structlog`-logged by `ConsoleNotificationSender`
  (`app/services/notification_sender.py`), not actually emailed — you'll
  need to check Railway's deploy logs to find the code until a real
  email/SMS provider is wired in.

### Seeding sample properties

There's no admin UI for listings yet, so the browse page is empty on a
fresh deploy. Two ways to insert 35 dummy `LISTED` properties:

**From a browser (no CLI/laptop needed)**: set `ADMIN_SEED_TOKEN` on the
Railway backend service to any random value, then visit
`https://<railway-domain>/api/v1/admin/seed-properties?token=<that value>`
once. It returns `{"success": true, "data": {"seeded": 35}}`. This hits
`GET /api/v1/admin/seed-properties` (`app/api/v1/admin.py`), which 404s
unconditionally if `ADMIN_SEED_TOKEN` is unset or the token doesn't
match — unset the variable again afterward so the endpoint goes back to
404ing for everyone, including you.

**From the CLI**, if you have the repo cloned locally:
`services/backend/scripts/seed_properties.py` does the same thing via the
[Railway CLI](https://docs.railway.com/guides/cli):

```bash
npm i -g @railway/cli
railway login
railway link          # select this project
cd services/backend
railway run python -m scripts.seed_properties
```

`railway run` injects the linked environment's variables (including
`DATABASE_URL`) into the local process, so the script writes directly to
the production database without needing direct network access to it.

### Mobile

Not covered above — mobile ships via Expo Go / EAS Build / app stores,
not a web host. Point `EXPO_PUBLIC_API_URL` at the Railway backend URL
and run `eas build` when you're ready for that; out of scope for this
guide.
