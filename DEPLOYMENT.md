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

## Production (planned)

Production deployment topology (container orchestration, managed
PostgreSQL/Redis, object storage, secrets management, CI/CD pipeline) is
designed in a later hardening phase and will be documented here before
first production deploy.
