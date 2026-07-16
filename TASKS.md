# TASKS

Persistent project memory across Claude Code sessions. Update this file at
the end of every phase.

## Overall Progress

Phase 4 of 14 complete (Repository Setup, Backend Foundation/Auth/Database,
Web Application foundation, Mobile Application foundation).

## Current Phase

Phase 4 — Mobile Application: **Complete** (foundation slice, feature parity
with the Phase 3 web scope)
Next: Phase 5 — AI Services

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

### Phase 3 — Web Application (foundation slice)

Scope note: this phase covers the parts of the Tenant MVP journey whose
backend already exists (Auth, Browse, Profile). AI Search, Verification
Reports, Chat, KYC, and Lease Generation depend on Phases 5–7 and are
reachable in the UI as clearly labeled "coming soon" placeholders rather
than mocked functionality, per the "design for future expansion, don't
half-implement" principle.

- Backend: `GET /api/v1/properties` (paginated, `city` filter, listed-only)
  and `GET /api/v1/properties/{id}`, via `PropertyRepository` /
  `PropertyService`
- Backend: `GET/PUT /api/v1/tenant-profile/me` via
  `TenantProfileRepository` / `TenantProfileService`
- Fixed an async-ORM footgun: added `eager_defaults=True` to
  `TimestampedModel`/`ImmutableModel` so server-side `updated_at` is
  fetched via `RETURNING` on UPDATE, not lazily after the session context
  has closed (was causing a `MissingGreenlet` error on profile updates)
- 10 new backend tests (property browse/filter/pagination/404s, tenant
  profile create/update/auth-required) — 26 passing total
- Web: `@proplease/api` `ApiClient` gained a `put()` method; wired into
  `apps/web` via `lib/api/client.ts` + a persisted Zustand auth store
  (`lib/store/auth-store.ts`) + a TanStack Query provider
  (`app/providers.tsx`)
- Web pages, all wired to the real backend (no mock data): `/login`
  (email/phone OTP request+verify), `/onboarding` (create/edit tenant
  profile), `/properties` (paginated browse with city filter, skeleton
  loading, empty state), `/properties/[id]` (detail page)
- Web: nav shell (`components/nav.tsx`) with auth-aware state, and
  `/search`, `/kyc`, `/lease` placeholder routes
- Fixed monorepo TypeScript config gaps surfaced while building this:
  missing `DOM`/`DOM.Iterable` lib (broke all DOM event typing),
  `declaration: true` leaking into the Next.js app (caused TS2742 errors
  under the dual React-types monorepo setup), and a stale `@/*` path
  alias pointing only at `app/*`
- Verified for real, not just typechecked: ran `pnpm install`, `tsc
  --noEmit` across all 5 TS packages, a full `next build` (lint + build +
  static generation all clean), and drove the actual golden path in a
  headless Chromium browser against the live FastAPI + Postgres + Redis
  backend — home → browse → city filter → property detail → OTP login
  (code read from the real backend log, not stubbed) → onboarding →
  properties, confirming the authenticated nav state and all three
  placeholder routes render correctly

### Phase 4 — Mobile Application (foundation slice, parity with Phase 3 web)

- `apps/mobile`: NativeWind v4 wired up for real (tailwind.config.js,
  global.css, metro.config.js with `withNativeWind`,
  `nativewind-env.d.ts` type augmentation for `className` props on RN
  components) — Phase 1 had only installed the package
- Native navigation via Expo Router: a `(tabs)` group (Browse, AI Search,
  KYC, Lease, Profile) using `Tabs`, plus modal-presented `/login` and
  `/onboarding` and a pushed `/property/[id]` detail screen — no
  responsive-website-in-a-shell, per the mobile design principle
- `lib/api/client.ts` + `lib/api/types.ts` mirror the web app's (same
  `ApiClient` from `@proplease/api`, same snake_case response types);
  `lib/store/auth-store.ts` is the same Zustand shape as web but
  persisted via `@react-native-async-storage/async-storage` instead of
  localStorage
- Screens, all wired to the real backend (no mock data): `/login`
  (email/phone OTP, via `react-hook-form` per the mobile stack),
  `/onboarding` (create/edit tenant profile), Browse tab (`FlatList`,
  city filter, pagination), `/property/[id]` detail (verification/chat
  placeholder sections, matching web), Profile tab (login CTA when
  logged out; email, company, business type, edit, and log out when
  logged in), and `ComingSoon`-based Search/KYC/Lease tabs
- Fixed real monorepo issues surfaced while building this:
  - `apps/mobile/tsconfig.json`'s `@/*` alias pointed only at `./app/*`
    (same bug pattern as the web app in Phase 3)
  - Two transitive dependencies Metro couldn't resolve under pnpm's
    strict per-package isolation — `react-native-css-interop`
    (NativeWind's injected JSX runtime) and `@babel/runtime` (Babel's
    injected helpers) — needed to be added as **direct** dependencies
    of `apps/mobile`, since pnpm correctly refuses to let a package
    reach into a dependency's own transitive dependencies
  - Tried (and reverted) `node-linker=hoisted` globally to fix mobile-web
    bundling: it broke `apps/web`'s production build with a duplicate-
    React `useContext` crash. The targeted per-package dependency fix
    above solved the mobile issue without touching pnpm's linking
    strategy or affecting web at all
- Verified for real: `tsc --noEmit` clean, and since `expo start --web`
  hit an unrelated Metro dev-server bug (bundle URLs computed with a
  broken `../../` prefix under a monorepo — a known Expo/Metro web-only
  quirk, irrelevant to the real iOS/Android targets), used
  `expo export --platform web` (a full production bundle, 648 modules,
  zero errors) served statically and drove the actual golden path in a
  headless Chromium browser against the live FastAPI + Postgres + Redis
  backend: browse (all 3 seeded properties) → city filter → property
  detail → Search/KYC/Lease placeholder tabs → Profile (logged-out CTA)
  → OTP login (code read from the real backend log) → onboarding →
  Profile (logged-in, showing email, saved company name, log out)

## Pending Tasks

- Phase 5: AI services (SearchAgent, VerificationAgent,
  LeaseDraftingAgent, LeaseSummaryAgent implementations) — unblocks the
  Search and Verification Report steps in the web/mobile UI
- Phase 6: KYC — unblocks the `/kyc` flow
- Phase 7: Lease generation and e-signature — unblocks the `/lease` flow
- Phase 8: Testing hardening (target 90%+ coverage across the whole
  backend, not just auth/properties/profile; no frontend tests yet)
- Phase 9: Documentation hardening

## Current Blockers

None.

## Known Bugs

None known.

## Technical Debt

- No CI pipeline configured yet.
- Chat, KYC, and Lease endpoints/services are not yet implemented — only
  their database schema exists so far; the web UI shows "coming soon"
  placeholders for these.
- `ConsoleNotificationSender` logs OTP codes instead of delivering real
  email/SMS; swap in a real provider before any real-user testing.
- Google OAuth client ID/secret and Groq API key are unset in `.env`;
  Google login and any AI agent calls will fail until configured. The web
  login page only implements the OTP path for this reason.
- `packages/types`' camelCase `User` domain type doesn't match the
  backend's actual snake_case JSON responses; `apps/web/lib/api/types.ts`
  defines web-local types matching reality instead. Reconcile these once
  more of the backend is built out and the shared type's shape stabilizes.
- No frontend tests yet (the golden path was verified manually via a
  scripted Playwright run in-session, not committed as a test, for both
  web and mobile).
- Property images/documents aren't rendered on the detail page — schema
  and repository support them, but no upload flow or UI exists. This
  applies to both web and mobile.
- Mobile was never run on an actual iOS/Android simulator or device in
  this session (none available) — only typechecked and verified via
  `expo export --platform web`. The core logic (screens, data fetching,
  navigation) is platform-agnostic, so this should carry over, but native-
  only concerns (safe-area insets, keyboard avoidance, deep linking,
  gesture behavior) are unverified.
- Neither `apps/web` nor `apps/mobile` implements Google Sign-In in the UI
  yet (the backend endpoint exists) — both only offer OTP login, since
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are unset in `.env`.

## Future Enhancements

- Landlord Portal, Broker Portal, Admin Dashboard
- Payments, Escrow, Rent Collection
- Maintenance Ticketing
- AI Recommendations, AI Property Valuation
- CRM/ERP integrations, Public APIs
- Multi-Tenant SaaS, Multi-Country, Multi-Language support

## Last Updated

2026-07-16
