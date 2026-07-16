# TASKS

Persistent project memory across Claude Code sessions. Update this file at
the end of every phase.

## Overall Progress

Phase 2 of 14 complete (Repository Setup, Backend Foundation/Auth/Database).

## Current Phase

Phase 2 — Backend Foundation, Authentication, Database: **Complete**
Next: Phase 3 — Web Application

## Completed Tasks

### Phase 1 — Repository Setup

- Turborepo + pnpm monorepo root (`package.json`, `pnpm-workspace.yaml`,
  `turbo.json`, `.gitignore`, `.env.example`)
- `apps/web`: Next.js 15 App Router skeleton, TypeScript strict, Tailwind,
  dark-mode-ready globals
- `apps/mobile`: Expo Router skeleton, TypeScript, NativeWind
- `services/backend`: FastAPI skeleton with API -> Service -> Repository ->
  Database layering, centralized SSL/HTTP client, structured logging,
  async SQLAlchemy 2.x + Alembic scaffold, Redis client, AI layer
  (`BaseAgent`, `PromptBuilder`, `LLMGateway`) wired for Groq
- `packages/{ui,api,types,config,utils}`: shared TypeScript packages
  consumed by both web and mobile
- `infra/docker-compose.yml`: Postgres, Redis, MinIO, backend, web, mobile
  dev server — starts with one command
- `/prompts`: versioned prompt template directory (`lease_summary.v1.txt`)
- Documentation: README.md, ARCHITECTURE.md, API.md, DATABASE.md,
  DEPLOYMENT.md, TASKS.md

### Phase 2 — Backend Foundation, Authentication, Database

- Full SQLAlchemy 2.x model layer for all 13 MVP tables (`User`,
  `TenantProfile`, `Property`, `PropertyImage`, `PropertyDocument`,
  `VerificationReport`, `ChatThread`, `Message`, `Lease`, `LeaseVersion`,
  `KYCVerification`, `Notification`, `AuditLog`) with audit columns
  (`created_at`/`updated_at`/`created_by`/`updated_by`, or
  `ImmutableModel` for append-only `AuditLog`)
- Hand-authored initial Alembic migration (`0001_initial_schema`) — its
  upgrade and downgrade were both verified end-to-end against a real local
  PostgreSQL instance
- JWT access/refresh token issuance and verification
  (`app/core/security.py`)
- OTP service (`app/services/otp_service.py`): Redis-backed, hashed,
  single-use, rate-limited email/phone verification codes, with a
  swappable `NotificationSender` interface (console implementation for
  now — swap in SES/SNS/Twilio for production)
- Google OAuth login via ID token verification
  (`app/services/google_oauth.py`)
- Redis-backed fixed-window rate limiter (`app/core/rate_limit.py`)
  applied to the OTP request/verify endpoints
- `UserRepository` (repository pattern) and `AuthService` (business logic
  layer) implementing Google OAuth login, OTP login, and token refresh
- Auth API: `POST /api/v1/auth/google`, `POST /api/v1/auth/otp/request`,
  `POST /api/v1/auth/otp/verify`, `POST /api/v1/auth/refresh`,
  `GET /api/v1/auth/me`, all behind the standard `ApiResponse` envelope
- `get_current_user` dependency (`app/api/deps.py`) protecting
  authenticated routes
- 16 passing tests (JWT round-trips, OTP correctness/replay/rate-limiting,
  and full auth API integration tests run against a live Postgres +
  fakeredis), verified via `pytest`

## Pending Tasks

- Phase 3: Web application (property search, details, chat, KYC, lease
  flows)
- Phase 4: Mobile application (feature parity with web)
- Phase 5: AI services (SearchAgent, VerificationAgent,
  LeaseDraftingAgent, LeaseSummaryAgent implementations)
- Phase 6: KYC
- Phase 7: Lease generation and e-signature
- Phase 8: Testing hardening (target 90%+ coverage across the whole
  backend, not just auth)
- Phase 9: Documentation hardening

## Current Blockers

None.

## Known Bugs

None known.

## Technical Debt

- No dependencies have been installed or lockfile generated for the JS
  workspaces yet (`pnpm-lock.yaml` does not exist); run `pnpm install`
  before first use.
- No CI pipeline configured yet.
- Property, chat, lease, KYC, and notification endpoints/services are not
  yet implemented — only their database schema exists so far.
- `ConsoleNotificationSender` logs OTP codes instead of delivering real
  email/SMS; swap in a real provider before any real-user testing.
- Google OAuth client ID/secret and Groq API key are unset in `.env`;
  Google login and any AI agent calls will fail until configured.

## Future Enhancements

- Landlord Portal, Broker Portal, Admin Dashboard
- Payments, Escrow, Rent Collection
- Maintenance Ticketing
- AI Recommendations, AI Property Valuation
- CRM/ERP integrations, Public APIs
- Multi-Tenant SaaS, Multi-Country, Multi-Language support

## Last Updated

2026-07-16
