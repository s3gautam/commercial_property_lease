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

## Planned Endpoints (later phases)

- `/api/v1/properties` — search, filter, paginate commercial properties
- `/api/v1/properties/{id}/verification` — AI verification report
- `/api/v1/chat/*` — tenant/landlord chat threads and messages
- `/api/v1/kyc/*` — tenant KYC verification
- `/api/v1/leases/*` — lease generation, AI summary, e-signature

Every new endpoint must include validation, pagination/filtering/sorting
where applicable, structured errors, and OpenAPI documentation.
