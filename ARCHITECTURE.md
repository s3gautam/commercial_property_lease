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

## Authentication

Authentication is the first vertical slice through the full stack and is
the reference example for how future features should be structured:

```
app/api/v1/auth.py        (routers: parse request, call AuthService, shape response)
  -> app/services/auth_service.py   (business logic: login, OTP verify, refresh)
    -> app/repositories/user_repository.py   (data access)
      -> app/models/user.py::User               (SQLAlchemy model)
```

Supported login methods, all issuing the same JWT access/refresh pair
(`app/core/security.py`):

- **Google OAuth** (`app/services/google_oauth.py`): verifies a Google ID
  token against Google's tokeninfo endpoint (via the centralized HTTP
  client) and checks the audience matches `GOOGLE_CLIENT_ID`.
- **Email/Phone OTP** (`app/services/otp_service.py`): a hashed,
  single-use, rate-limited one-time code stored in Redis with a 5-minute
  TTL and a 5-attempt cap. Delivery goes through the swappable
  `NotificationSender` interface (`ConsoleNotificationSender` for now).

`app/api/deps.py::get_current_user` decodes the bearer access token and
loads the `User` via `UserRepository`, for use as a FastAPI dependency on
any protected route. `app/core/rate_limit.py::RateLimiter` is a reusable
Redis-backed dependency applied to the OTP endpoints and available to any
future route that needs request throttling.

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
