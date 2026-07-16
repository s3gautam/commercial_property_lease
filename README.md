# PropLease AI — Tenant MVP

AI-first commercial property leasing platform. This repository contains the
Tenant MVP: the architecture is designed so Landlord, Broker, Admin,
Payments, Maintenance, Escrow, AI Analytics, and Multi-Tenant SaaS modules
can be added later without significant refactoring.

## Repository Layout

```
apps/
  web/       Next.js 15 tenant web app
  mobile/    Expo (React Native) tenant mobile app
services/
  backend/   FastAPI backend (API -> Service -> Repository -> Database)
packages/
  ui/        Shared design tokens / components
  api/       Shared typed API client (used by web and mobile)
  types/     Shared TypeScript types
  config/    Shared tsconfig and constants
  utils/     Shared formatting/helper functions
infra/       Docker Compose for local development
prompts/     Versioned LLM prompt templates
docs/        Architecture, API, database and deployment docs
```

## Prerequisites

- Node.js >= 20, pnpm >= 9
- Python >= 3.12
- Docker and Docker Compose

## Getting Started

```bash
cp .env.example .env
pnpm install

# Start Postgres, Redis, MinIO, backend, web, and mobile dev server
docker compose -f infra/docker-compose.yml up
```

Or run apps individually:

```bash
pnpm dev                 # web + mobile via turbo
cd services/backend && pip install -e ".[dev]" && uvicorn app.main:app --reload
```

## Available Scripts

| Command        | Description                       |
| --------------- | ---------------------------------- |
| `pnpm install`  | Install all workspace dependencies |
| `pnpm dev`      | Run all apps in development mode   |
| `pnpm build`    | Build all apps                     |
| `pnpm lint`     | Lint all apps and packages         |
| `pnpm test`     | Run all test suites                |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [DATABASE.md](./DATABASE.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [TASKS.md](./TASKS.md) — persistent project memory across sessions

## Status

Phase 1 (Repository Setup) is complete. See [TASKS.md](./TASKS.md) for
current progress and the next recommended phase.
