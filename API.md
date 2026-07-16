# API

All endpoints are versioned under `/api/v1`. OpenAPI docs are auto-generated
by FastAPI at `/docs` (Swagger UI) and `/redoc`.

## Response Envelope

Every response follows the same shape:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "error": null
}
```

On failure:

```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": { "code": "NOT_FOUND", "message": "Property not found" }
}
```

## Implemented Endpoints

| Method | Path                     | Description                                          | Auth required |
| ------ | ------------------------- | ------------------------------------------------------ | -------------- |
| GET    | `/api/v1/health`           | Liveness check                                          | No             |
| POST   | `/api/v1/auth/google`      | Log in / sign up with a verified Google ID token       | No             |
| POST   | `/api/v1/auth/otp/request` | Send a one-time code to an email or phone (rate-limited)| No             |
| POST   | `/api/v1/auth/otp/verify`  | Verify a code and log in / sign up (rate-limited)      | No             |
| POST   | `/api/v1/auth/refresh`     | Exchange a refresh token for a new access/refresh pair | No             |
| GET    | `/api/v1/auth/me`          | Get the authenticated user's profile                    | Yes (Bearer)   |

`/api/v1/auth/otp/request` and `/api/v1/auth/otp/verify` are rate-limited
per client IP (5 requests / 5 min and 10 requests / 5 min respectively) on
top of the OTP service's own 5-attempt cap per issued code.

### Auth request/response shapes

```
POST /api/v1/auth/google
{ "id_token": "<google-id-token>" }

POST /api/v1/auth/otp/request
{ "email": "tenant@example.com" }   // or { "phone": "+1..." }

POST /api/v1/auth/otp/verify
{ "email": "tenant@example.com", "code": "123456" }

POST /api/v1/auth/refresh
{ "refresh_token": "<refresh-jwt>" }
```

`/auth/google` and `/auth/otp/verify` return `data: { user, tokens }`
where `tokens` is `{ access_token, refresh_token, token_type }`.
`GET /auth/me` requires `Authorization: Bearer <access_token>`.

| Method | Path                       | Description                                     | Auth required |
| ------ | --------------------------- | -------------------------------------------------- | -------------- |
| GET    | `/api/v1/properties`         | Browse listed properties (paginated, city filter)  | No             |
| GET    | `/api/v1/properties/{id}`    | Get a single listed property                        | No             |
| GET    | `/api/v1/tenant-profile/me`  | Get the authenticated user's tenant profile         | Yes (Bearer)   |
| PUT    | `/api/v1/tenant-profile/me`  | Create or update the authenticated user's profile   | Yes (Bearer)   |

### Property browse/detail shapes

```
GET /api/v1/properties?page=1&page_size=20&city=Austin

-> data: PropertyRead[]
-> meta: { page, page_size, total }

GET /api/v1/properties/{id}
-> data: PropertyRead
```

Only properties with `status == "listed"` are visible through these
endpoints — `draft`/`archived`/`leased` properties 404 for unauthenticated
browse (there is no Landlord Portal yet to manage visibility per-owner).

### Tenant profile shape

```
PUT /api/v1/tenant-profile/me
{ "company_name": "Acme Corp", "business_type": "Retail" }

-> data: { id, user_id, company_name, business_type, created_at, updated_at }
```

`PUT` upserts — safe to call again to edit an existing profile.
`GET` 404s if the authenticated user hasn't created a profile yet.

| Method | Path                              | Description                                    | Auth required |
| ------ | ---------------------------------- | -------------------------------------------------- | -------------- |
| GET    | `/api/v1/properties/search`         | AI-powered natural-language property search        | No             |
| GET    | `/api/v1/properties/{id}/verification` | Get the latest AI verification report for a property | No          |
| POST   | `/api/v1/properties/{id}/verification` | Generate a new AI verification report          | Yes (Bearer)   |
| POST   | `/api/v1/leases`                    | Create a draft lease for a listed property         | Yes (Bearer)   |
| GET    | `/api/v1/leases`                    | List the authenticated user's leases               | Yes (Bearer)   |
| GET    | `/api/v1/leases/{id}`                | Get a lease and its drafted versions               | Yes (Bearer, owner only) |
| POST   | `/api/v1/leases/{id}/draft`          | AI-draft a new lease document version              | Yes (Bearer, owner only) |
| POST   | `/api/v1/leases/{id}/summary`        | AI-summarize the latest drafted version            | Yes (Bearer, owner only) |

### Search shape

```
GET /api/v1/properties/search?q=office+space+in+austin+under+5000&limit=20

-> data: {
     criteria: { city, max_rent, min_area_sqft, keywords, explanation },
     properties: PropertyRead[],
     confidence: number
   }
-> meta: { latency_ms, total_tokens, validation_status }
```

`criteria` reflects what the SearchAgent extracted from the query; if the
LLM response wasn't valid JSON, `validation_status` is `"invalid"` and the
search falls back to matching the raw query as a keyword.

### Verification report shape

```
GET/POST /api/v1/properties/{id}/verification
-> data: { id, property_id, summary, risk_score, status, created_at }
```

`status` is `"completed"` on a successful AI response or `"failed"` if the
agent's output couldn't be validated (a conservative fallback summary and
maximal risk score are still stored, so tenants see something rather than
an error).

### Lease shapes

```
POST /api/v1/leases
{ "property_id": "<uuid>", "start_date": "2026-01-01", "end_date": "2026-12-31" }
-> data: LeaseRead   // status starts "draft", monthly_rent copied from the property

GET /api/v1/leases/{id}
-> data: { lease: LeaseRead, versions: LeaseVersionRead[] }

POST /api/v1/leases/{id}/draft
-> data: LeaseVersionRead   // document_text populated, ai_summary null

POST /api/v1/leases/{id}/summary
-> data: LeaseVersionRead   // ai_summary now populated from the latest draft
```

`/leases/{id}/summary` 409s if no draft has been generated yet. All lease
endpoints 404 (not 403) if the lease belongs to a different tenant, to
avoid confirming another user's lease exists.

This is intentionally minimal — just enough CRUD to invoke the lease
agents. Status transitions (pending signature, signed, terminated) and
e-signature are Phase 7 scope; there is no web/mobile UI for leases yet
(`/lease` is still a placeholder page).

## Planned Endpoints (later phases)

- `/api/v1/chat/*` — tenant/landlord chat threads and messages
- `/api/v1/kyc/*` — tenant KYC verification

Every new endpoint must include validation, pagination/filtering/sorting
where applicable, structured errors, and OpenAPI documentation.
