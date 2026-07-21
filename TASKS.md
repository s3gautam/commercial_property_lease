# TASKS

Persistent project memory across Claude Code sessions. Update this file at
the end of every phase.

## Overall Progress

Phase 5 of 14 complete (Repository Setup, Backend Foundation/Auth/Database,
Web Application foundation, Mobile Application foundation, AI Services).

## Current Phase

Phase 5 — AI Services: **Complete**
Next: Phase 6 — KYC

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

### Phase 5 — AI Services

All four agents named in CLAUDE.md's "AI Agents" examples are implemented,
following the Application -> Agent -> Prompt Builder -> LLM Gateway ->
Groq -> Output Validator architecture from Phase 1.

- Fixed a real, previously-undetected Phase 1 bug: `PromptBuilder`'s
  `PROMPTS_DIR` was computed with `parents[3]`, one level short of the
  repo root (`services/prompts` instead of `/prompts`) — nothing had
  actually called `PromptBuilder` until this phase exercised it
- `app/ai/output_validator.py`: shared JSON-parsing/validation step
  (tolerates markdown code fences some models wrap JSON in) used by
  every agent that expects structured output
- `LLMGateway.complete()` gained a `json_mode` parameter (Groq's
  `response_format: json_object`) for agents that need structured output
- **SearchAgent** (`app/ai/agents/search_agent.py`): extracts
  `{city, max_rent, min_area_sqft, keywords, explanation}` from a
  natural-language query, then queries `PropertyRepository.search_listed`
  (extended with rent/area/keyword filters). Falls back to a raw-keyword
  search if the LLM response isn't valid JSON, rather than failing the
  request. `GET /api/v1/properties/search?q=...` (public)
- **VerificationAgent** (`app/ai/agents/verification_agent.py`): produces
  a `{summary, risk_score}` for a listing, persisted as a
  `VerificationReport` row via the new `VerificationReportRepository`.
  `GET /api/v1/properties/{id}/verification` (public, latest report) and
  `POST .../verification` (auth required, generates a new one)
- **LeaseDraftingAgent** + **LeaseSummaryAgent**
  (`app/ai/agents/lease_drafting_agent.py`,
  `app/ai/agents/lease_summary_agent.py`): draft a plain-language lease
  document and summarize one, respectively. Required adding bare-minimum
  Lease CRUD (`LeaseRepository`, `LeaseVersionRepository`,
  `LeaseService`) just to have something to invoke them against —
  `POST/GET /api/v1/leases`, `GET /api/v1/leases/{id}`,
  `POST /api/v1/leases/{id}/draft`, `POST .../summary`, all auth-required
  with ownership checks. Full lease management (status transitions,
  e-signature, UI) stays Phase 7 scope — the `/lease` page is still a
  placeholder
- Schema fix + new migration (`0002_lease_version_document_text`):
  `LeaseVersion.document_url` was `NOT NULL`, but there's no file-storage
  pipeline yet to produce a real URL for an AI-drafted lease. Added a
  nullable `document_text` column for the generated text and made
  `document_url` nullable too (it'll hold a real URL once file storage
  exists). Verified upgrade and downgrade against a real Postgres
  instance, like the initial migration
- 14 new backend tests (7 agent unit tests with mocked `LLMGateway`, 7
  endpoint integration tests covering search, verification generate/
  fetch/404, and the full lease create -> draft -> summarize -> fetch
  flow plus an ownership-isolation check) — 41 passing total
- Web + mobile: `/search` now runs a real search against the backend
  (still fails against Groq in this sandbox — see below — but every
  other layer, including the graceful error state, is real); property
  detail's verification section now fetches/generates a real report,
  showing a login prompt when logged out and an error state on failure
  rather than crashing
- **Real Groq calls could not be tested end-to-end in this session** —
  no `GROQ_API_KEY` was available, and this sandbox's egress policy
  blocks `api.groq.com` outright (confirmed via a live 403 from the
  proxy). Every agent was verified with `LLMGateway.complete` mocked
  (both success and malformed-JSON-fallback paths), and the web/mobile
  UI was verified to wire correctly end-to-end and fail gracefully when
  the real call is blocked — but nobody has seen an actual Groq response
  flow through this code yet. Treat the LLM-facing path as
  integration-tested against a contract, not against the real provider,
  until someone runs it with a real key.

### Out-of-band: minimal production deployment prep

Not part of the phased plan, done ahead of it because the user wanted to
test with a real `GROQ_API_KEY` outside this sandbox's network block, and
that turned into "let's actually deploy it." Fixed two things that would
have broken a real deployment outright:

- `app/main.py`'s CORS config previously set `allow_origins=[]` in
  production — meaning the deployed web app could never successfully
  call the backend from a browser, silently. Now raises at startup if
  `CORS_ALLOWED_ORIGINS` isn't set, and reads the allowed origins from it.
- `Settings.database_url` now normalizes a bare `postgres://` or
  `postgresql://` URL (what Railway/Heroku-style managed Postgres hands
  out) to the `+asyncpg` driver scheme SQLAlchemy needs — avoids a
  manual-URL-editing footgun.
- `services/backend/Dockerfile` no longer runs uvicorn with `--reload`
  (dev-only) and now has an entrypoint (`docker-entrypoint.sh`) that runs
  `alembic upgrade head` before starting the server, so migrations never
  need a manual step on deploy. `infra/docker-compose.yml`'s local-dev
  backend service overrides the command back to `--reload` so local hot
  reload is unaffected.
- Documented a concrete Vercel (web) + Railway (backend/Postgres/Redis)
  deployment path in DEPLOYMENT.md's Production section.

This is **not** the full Phase-14-style production hardening pass — no
CI/CD, no monitoring, no secrets manager, and no object storage for
uploads. OTP codes and booking confirmation/reschedule emails now go
through the same `NotificationSender` seam (`get_notification_sender()`
in `api/deps.py`): they reach a real inbox once `SMTP_HOST` is set,
otherwise they fall back to `structlog` (Railway's deploy logs) so
local dev never needs real SMTP credentials. See Technical Debt below.

## Pending Tasks

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
- "Schedule a visit" (property detail page primary CTA) is now backed
  by a real `Visit` table (`app/models/visit.py`,
  `POST/GET /api/v1/visits`, `PATCH .../reschedule`,
  `POST .../cancel`), not client-only localStorage — bookings survive
  clearing browser storage, and the confirmation email is sent
  server-side in the same request as part of `VisitService.book_visit`/
  `reschedule_visit`, not a separate best-effort client call. Remaining
  gaps: `apps/mobile` doesn't have this UI at all; there's still no
  landlord-side portal to see/manage these visits from the other side;
  and availability itself (`visit_schedule.py`/`property-schedule.ts`)
  is still a deterministic function rather than a real shared calendar
  with locking, so two tenants could still both see (though not both
  successfully book, since `VisitService` re-checks availability and
  conflicts at write time) the same slot as open.
- Currency is now ₹ (Indian digit grouping — lakh/crore) everywhere via
  `packages/utils::formatInr`, replacing the earlier `$`/USD
  formatting. `prompts/property_search.v1.txt` was updated to ask the
  SearchAgent for INR amounts, but there's no unit test asserting the
  model actually returns INR-scale numbers rather than a stray
  USD-scale guess - only that the field parses as a number.
- KYC endpoints/services are not yet implemented on the backend — only
  the database schema exists. `apps/web`'s `/kyc` page is a client-only
  mock (document "upload" is just a file picker, "verification" is a
  fixed timeout that always approves) requested as a demo stand-in; it
  doesn't call an API or persist anything, and `apps/mobile`'s KYC tab
  is still the plain `ComingSoon` placeholder. Lease now has minimal
  create/draft/summarize CRUD (Phase 5) but no status transitions,
  e-signature, or UI — `/lease` is still a placeholder pending Phase 7.
- Chat now has a real backend endpoint (`POST
  /api/v1/properties/{id}/chat`, `LandlordChatAgent`) and a working
  `apps/web` UI (`ChatWithLandlord`), but it's intentionally
  request/response only — no `ChatThread`/`Message` persistence (see
  ARCHITECTURE.md's AI Layer section for why), so a conversation
  doesn't survive a page refresh, and there's no real landlord on the
  other end reading these — every reply is AI-generated in character,
  grounded only in the listing's fields, amenities, and nearby
  landmarks (explicitly instructed not to invent anything else).
  `apps/mobile` doesn't have this UI yet.
- `Property.amenities`/`Property.nearby_landmarks`
  (`app/services/property_facts.py`) are deterministic, not real data —
  there's no admin UI to enter amenities and no geocoding/places
  integration for real distances, so both are derived from the
  property's id/city. Same caveat as the dummy photos: consistent
  per-listing, not actually true.
- Listing photos (`lib/property-image.ts`) come from LoremFlickr,
  keyword-filtered by property type parsed from the title (warehouse ->
  warehouse/industrial photos, retail/storefront/showroom -> retail
  photos, office/corporate/co-working -> office photos, anything else
  -> a generic commercial-building fallback) rather than fully random
  images. They're still real photos of *some* building of that general
  type, not an actual photo of that actual listing - there's no photo
  upload flow.
- Booking conflict prevention (`useBookingsStore.checkConflict` — no
  two upcoming visits for the same property, no two upcoming visits at
  the same date+time across properties) only runs against what's in
  *this browser's* localStorage. It can't catch a conflict against a
  booking made from a different browser/device, since there's no
  shared backend store for bookings at all (see the Chat/Scheduling
  entries above).
- Watchlist (`useWatchlistStore`) is the same localStorage-only pattern
  as bookings — no backend model, doesn't sync across devices/browsers,
  and stores a snapshot of the property at the time it was saved
  (title/rent/etc. won't update if the listing changes later). No
  `apps/mobile` equivalent yet.
- `ConsoleNotificationSender` logs OTP codes instead of delivering real
  email/SMS; swap in a real provider before any real-user testing.
- Google OAuth client ID/secret and Groq API key are unset in `.env`;
  Google login and every AI agent call will fail until configured (this
  session confirmed the Groq call path is wired correctly up to the
  point of the actual network request, which this sandbox's egress
  policy blocks — see the Phase 5 section above). The web login page
  only implements the OTP path for this reason.
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
- `apps/web` now renders a real "Continue with Google" button
  (`components/google-sign-in-button.tsx`, Google Identity Services)
  behind `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — hidden if that's unset. Untested
  against a real Google OAuth client end-to-end (needs `GOOGLE_CLIENT_ID`
  configured on both frontend and backend to verify). `apps/mobile` still
  has no Google Sign-In UI — would need `expo-auth-session` or a native
  SDK, not the browser-based GIS flow used on web.
- No agent output has ever been validated against a real Groq response —
  see the Phase 5 note above. Prompt wording, JSON-mode reliability, and
  the fallback paths are only as good as their unit tests until someone
  runs this against a real key.
- `SearchAgent`'s keyword matching is `ILIKE` substring search over
  title/description, not real semantic search — fine for MVP data
  volumes, but won't scale past a small catalog.
- Lease drafts are stored as plain text in the database
  (`lease_versions.document_text`) rather than rendered to a real
  document and uploaded to object storage — MinIO is already in
  `docker-compose.yml` but no S3 client exists yet in the backend.

## Future Enhancements

- Landlord Portal, Broker Portal, Admin Dashboard
- Payments, Escrow, Rent Collection
- Maintenance Ticketing
- AI Recommendations, AI Property Valuation
- CRM/ERP integrations, Public APIs
- Multi-Tenant SaaS, Multi-Country, Multi-Language support

## Last Updated

2026-07-21
