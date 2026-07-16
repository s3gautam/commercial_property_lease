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

## Planned Endpoints (later phases)

- `/api/v1/properties/{id}/verification` — AI verification report
- `/api/v1/chat/*` — tenant/landlord chat threads and messages
- `/api/v1/kyc/*` — tenant KYC verification
- `/api/v1/leases/*` — lease generation, AI summary, e-signature

Every new endpoint must include validation, pagination/filtering/sorting
where applicable, structured errors, and OpenAPI documentation.
