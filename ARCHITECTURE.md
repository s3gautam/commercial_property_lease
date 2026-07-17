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
- `app/ai/prompt_builder.py` loads versioned templates from
  `services/backend/prompts` (inside the backend's own directory rather than
  the monorepo root, so the templates ship inside the backend's Docker build
  context — Railway and other per-service builds only see the service's own
  subtree). Prompts are never hardcoded inline.
- `app/ai/gateway.py` is the single module allowed to call an LLM provider
  (Groq today). Swapping providers means changing this file only.
  `LLMGateway.complete(json_mode=True)` requests Groq's structured JSON
  output mode for agents that need parseable results.
- `app/ai/output_validator.py` implements the Output Validator step:
  `parse_json_response()` tolerates markdown code fences some models wrap
  JSON in, and `require_keys()` checks the expected shape before an agent
  trusts the result.
- Every agent response carries `response`, `confidence`, `latency`, token
  usage, `reasoning_metadata`, and `validation_status`.

### Implemented Agents (`app/ai/agents/`)

| Agent | Input | Output | Used by |
| --- | --- | --- | --- |
| `SearchAgent` | free-text query | extracted filters + matching `Property` rows | `GET /api/v1/properties/search` |
| `VerificationAgent` | a `Property` | `{summary, risk_score}` | `POST/GET /api/v1/properties/{id}/verification` |
| `LeaseDraftingAgent` | a `Lease` + its `Property` | drafted lease document text | `POST /api/v1/leases/{id}/draft` |
| `LeaseSummaryAgent` | a lease document's full text | plain-language summary | `POST /api/v1/leases/{id}/summary` |
| `LandlordChatAgent` | a `Property` + tenant message + conversation history | in-character landlord reply | `POST /api/v1/properties/{id}/chat` |

Every agent's `run()` degrades gracefully on a malformed/unparseable LLM
response — it falls back to a safe default (e.g. `SearchAgent` falls back
to raw-keyword search; `VerificationAgent` returns a conservative
"couldn't verify" summary with a maximal risk score; `LandlordChatAgent`
falls back to a brief in-character "got pulled away, say that again?"
reply) and marks `validation_status="invalid"` rather than raising and
failing the request. Callers (API endpoints) never need their own
LLM-failure handling beyond what the agent already does.

`LandlordChatAgent` role-plays as the property's landlord, grounded
*only* in facts it's given — the listing's own fields plus its
amenities and nearby landmarks (`app/services/property_facts.py`,
deterministic per property id/city since there's no real data source
for either yet). The prompt explicitly forbids inventing anything not
in those facts (move-in dates, pet policy, negotiability, etc.); asked
about something uncovered, it says so honestly in character (e.g.
offers to check and get back to the tenant) instead of fabricating an
answer. It's intentionally stateless beyond that: `ChatService`
(`app/services/chat_service.py`) doesn't persist to `ChatThread`/`Message`
because those require a real `landlord_id`, and seeded/demo properties
don't have one (`Property.landlord_id` is nullable and typically unset).
The client round-trips the conversation history in each request instead.
`apps/web`'s `ChatWithLandlord` component (`components/chat-with-
landlord.tsx`) keeps that history in local component state.

The agent also outputs structured JSON (`gateway.complete(...,
json_mode=True)`) with a `booking` field alongside `reply`, so it can
propose and confirm visit slots in the same conversation: the prompt is
given the property's real "Available visit slots" (next 7 days, from
`app/services/visit_schedule.py` — deterministic per property id/date,
using the *exact same* hash algorithm as `apps/web/lib/property-
schedule.ts` so the chat's proposed times and the calendar modal's
availability always agree) and instructed to only ever mention slots
from that list, and only set `booking` once the tenant has explicitly
confirmed one. Critically, the agent's claimed booking is re-validated
in code (`_attach_validated_booking` calls `visit_schedule.
is_slot_available`) before being trusted — the model can still
hallucinate a confirmation even when told not to, so a fabricated or
already-taken slot is silently dropped rather than passed through.
When `POST /api/v1/properties/{id}/chat`'s response includes a
non-null `booking`, `ChatWithLandlord` calls the same
`useBookingsStore` (`lib/store/bookings-store.ts`, localStorage-backed
— see Scheduling below) that the manual "Schedule a visit" flow uses,
so a chat-confirmed visit shows up in Profile > My bookings exactly
like a manually scheduled one.

## Scheduling a visit

There's no real landlord/broker calendar system, so "Schedule a visit"
is filler with the same honesty as the amenities/nearby/photo data:
`getTimeSlots`/`getUpcomingDates` (`apps/web/lib/property-
schedule.ts`) deterministically generate ~70%-available hourly slots
Monday-Saturday (closed Sundays) per property+date. `ScheduleVisitCta`
is the property detail page's primary CTA (a full-width banner right
under the title, ahead of the stats grid) opening
`ScheduleVisitModal` — a date-strip + time-grid picker reused as-is by
the profile page's "Reschedule" action. Confirmed bookings live in
`useBookingsStore` (Zustand + `persist`, i.e. localStorage — there's no
backend Visit/Booking model), with `addBooking`/`cancelBooking`/
`rescheduleBooking` actions. `/profile` lists them (upcoming and
cancelled, separately) with Reschedule/Cancel per booking.

`useBookingsStore.checkConflict(propertyId, dateKey, time,
excludeBookingId?)` is the single place both booking rules are
enforced, called from every path that can create/move a booking
(`ScheduleVisitCta`, the profile page's reschedule flow, and
`ChatWithLandlord` when the chat agent confirms one — see the AI Layer
section above): a tenant can't have two upcoming visits for the same
property (reschedule/cancel the existing one instead), and can't have
two upcoming visits at the same date+time across different properties.
`excludeBookingId` lets a reschedule check against every *other*
booking without conflicting with itself. `ScheduleVisitCta` is also
booking-aware: if the tenant already has an upcoming visit for *this*
property, it replaces the "Schedule a visit" button with the
appointment's date/time plus Reschedule/Cancel, rather than only
catching the conflict after the fact.

## Watchlist

`useWatchlistStore` (`apps/web/lib/store/watchlist-store.ts`, Zustand +
`persist`/localStorage — same pattern and same "no backend model"
caveat as bookings) stores full `ApiProperty` objects, not just ids, so
`/profile`'s Watchlist section can render `PropertyCard`s directly
without refetching each one. The heart toggle
(`isWatchlisted`/`toggle`) lives on `PropertyCard` itself (used by
Browse, Recommended, and the Watchlist grid alike) and as a standalone
`WatchlistButton` overlaying the property detail page's hero photo —
both read/write the same store, so the heart state is consistent
everywhere a given listing appears.

`Property.amenities` and `Property.nearby_landmarks` are computed
`@property` accessors (not database columns) backed by the same
`property_facts.py` module, exposed on `PropertyRead` so the web app's
Amenities and "What's nearby" sections on the property detail page and
the chat agent are always looking at identical facts.

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
  client) and checks the audience matches `GOOGLE_CLIENT_ID`. The web
  login page (`apps/web/components/google-sign-in-button.tsx`) renders
  Google's own Sign In With Google button via the Google Identity
  Services script and posts the resulting ID token to `POST
  /api/v1/auth/google`, which returns the same JWT pair as OTP login.
  Controlled by `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — the button doesn't
  render if that's unset. Mobile doesn't have a native equivalent yet
  (would need `expo-auth-session`/Google's native SDKs, a separate
  effort from the web-only GIS flow).
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

## Production Guardrails

Two things fail loudly at startup rather than silently misbehaving in
production (`environment=production`):

- `DISABLE_SSL_VERIFY=true` raises in `app/core/http_client.py` — this
  flag is for corporate-SSL-interception dev environments only.
- Missing `CORS_ALLOWED_ORIGINS` raises in `app/main.py` — without it,
  the previous behavior was silently blocking every cross-origin request
  from the deployed frontend, which is a confusing failure mode to debug
  after the fact. `Settings.database_url` also normalizes a bare
  `postgres://`/`postgresql://` URL (what most managed Postgres
  providers hand out) to the `+asyncpg` driver scheme SQLAlchemy needs,
  so no manual URL editing is required when wiring up a provider.

See DEPLOYMENT.md's Production section for the concrete Railway/Vercel
setup these guardrails are designed around.

## Frontend Sharing

`packages/api`, `packages/types`, `packages/ui`, and `packages/utils` are
consumed by both `apps/web` and `apps/mobile` so business rules, API
contracts, and design tokens have one source of truth.

## Web App Conventions

- `packages/api::ApiClient` is the only thing that calls `fetch`. It's
  instantiated once per app (`apps/web/lib/api/client.ts`), configured
  with the API base URL and an access-token getter, and reused everywhere
  via `apiClient.get/post/put/patch/delete`.
- Session state (`user`, `tokens`) lives in a single persisted Zustand
  store (`apps/web/lib/store/auth-store.ts`); the `ApiClient`'s
  `getAccessToken` reads from it directly rather than components passing
  tokens around.
- `ApiClient` takes an `onUnauthorized` callback, called once on a 401
  response: `apps/web`/`apps/mobile`'s wiring of it calls `POST
  /api/v1/auth/refresh` with the stored refresh token, updates the auth
  store, and the original request is retried once with the new access
  token. Without this, every logged-in user would start seeing
  generic "couldn't send/load" errors the moment their 15-minute access
  token expired, with no way to recover short of logging out and back
  in. Concurrent 401s dedupe behind a single in-flight refresh call.
- All server data fetching goes through TanStack Query
  (`app/providers.tsx` wraps the app in a `QueryClientProvider`) — no
  ad-hoc `useEffect` + `fetch`.
- All rent/price display goes through `formatInr` (`packages/utils`),
  which renders `₹` with Indian digit grouping (lakh/crore — `₹2,16,474`
  not `₹216,474`). Implemented by hand rather than
  `Intl.NumberFormat("en-IN", ...)` since React Native's Hermes engine
  doesn't reliably ship `en-IN` locale data even where basic `Intl`
  support exists, so the same hand-rolled function is shared by both
  `apps/web` and `apps/mobile` rather than trusting the platform's
  locale-aware formatter to behave identically everywhere.
- Backend response types are defined locally per app
  (`apps/web/lib/api/types.ts`) matching the actual JSON shape (currently
  snake_case, per the backend's Pydantic schemas) rather than force-fit
  into `packages/types`' camelCase domain types, which are aspirational
  for future cross-service use. Reconcile these once the shape stabilizes.
- Routes for steps that depend on a later phase (AI Search, KYC, Lease)
  render a shared `<ComingSoon />` placeholder rather than mock data or a
  half-built flow.

## Mobile App Conventions

`apps/mobile` mirrors every convention above (same `ApiClient` pattern,
same Zustand session shape, same local response types, same
`<ComingSoon />` pattern for unimplemented steps) with native-appropriate
substitutions:

- Session persistence uses `@react-native-async-storage/async-storage`
  instead of localStorage (`apps/mobile/lib/store/auth-store.ts`).
- Navigation is native via Expo Router — a `(tabs)` group (`Tabs`
  navigator: Browse, AI Search, KYC, Lease, Profile) plus modal-presented
  `/login` and `/onboarding` screens and a pushed `/property/[id]` detail
  screen. There is no responsive-website-in-a-shell; screens use RN
  primitives (`View`, `FlatList`, `Pressable`) throughout, not web
  components.
- Forms use `react-hook-form` with `Controller` (per the mobile tech
  stack), whereas the web app uses plain `useState` — this is an
  intentional difference, not an inconsistency to fix.
- Styling is NativeWind v4 (Tailwind classes via `className` on RN
  components), configured in `tailwind.config.js` + `global.css` +
  `metro.config.js`'s `withNativeWind` wrapper.
- Monorepo/pnpm note: Metro's dependency resolution is stricter than
  Node's about transitive dependencies. Packages that are only pulled in
  indirectly (e.g. `react-native-css-interop` via NativeWind's babel
  preset, `@babel/runtime` via Babel's injected helpers) may need to be
  added as **direct** dependencies of `apps/mobile` even though the app
  code never imports them explicitly — pnpm's isolation correctly refuses
  to let Metro reach into a dependency's own dependencies otherwise.

## Extension Points

- New portals (Landlord, Broker, Admin) add new routers/services/repos
  under the same layering without touching Tenant code paths.
- New AI agents subclass `BaseAgent` and register their own prompt
  template under `services/backend/prompts`.
- New LLM providers are added inside `LLMGateway` behind the same
  interface; callers are unaffected.
