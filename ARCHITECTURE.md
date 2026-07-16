# Architecture

## Overview

PropLease AI is a monorepo (Turborepo + pnpm) serving one backend to both a
Next.js web app and an Expo mobile app, with a distinct AI layer that
mediates all LLM access.

## Backend Layering

```
API (FastAPI routers)
  -> Service (business logic)
    -> Repository (data access)
      -> Database (PostgreSQL via SQLAlchemy 2.x async)
```

- Routers (`app/api/v1/*`) only parse requests, call a service, and shape
  the response. No business logic and no direct DB access.
- Services (`app/services/*`) hold business logic and orchestrate one or
  more repositories.
- Repositories (`app/repositories/*`) are the only modules that query the
  database, via SQLAlchemy's async session.
- Models (`app/models/*`) are SQLAlchemy declarative models. Every table
  extends `TimestampedModel` for `id`, `created_at`, `updated_at`,
  `created_by`, `updated_by`.

## AI Layer

```
Application -> Agent -> Prompt Builder -> LLM Gateway -> Groq -> Output Validator -> Application
```

- `app/ai/base_agent.py` defines `BaseAgent`, the contract every AI
  capability implements: `run()`, `validate()`, `explain()`,
  `confidence_score()`.
- `app/ai/prompt_builder.py` loads versioned templates from `/prompts`.
  Prompts are never hardcoded inline.
- `app/ai/gateway.py` is the single module allowed to call an LLM provider
  (Groq today). Swapping providers means changing this file only.
- Every agent response carries `response`, `confidence`, `latency`, token
  usage, `reasoning_metadata`, and `validation_status`.

## SSL / HTTP

All outbound HTTP (Groq, OAuth providers, object storage) goes through
`app/core/http_client.py`, which centralizes `DISABLE_SSL_VERIFY`,
`REQUESTS_CA_BUNDLE`, and `SSL_CERT_FILE` handling. No other module sets
`verify=False`.

## Frontend Sharing

`packages/api`, `packages/types`, `packages/ui`, and `packages/utils` are
consumed by both `apps/web` and `apps/mobile` so business rules, API
contracts, and design tokens have one source of truth.

## Extension Points

- New portals (Landlord, Broker, Admin) add new routers/services/repos
  under the same layering without touching Tenant code paths.
- New AI agents subclass `BaseAgent` and register their own prompt
  template under `/prompts`.
- New LLM providers are added inside `LLMGateway` behind the same
  interface; callers are unaffected.
