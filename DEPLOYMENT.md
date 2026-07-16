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

## Production (planned)

Production deployment topology (container orchestration, managed
PostgreSQL/Redis, object storage, secrets management, CI/CD pipeline) is
designed in a later hardening phase and will be documented here before
first production deploy.
