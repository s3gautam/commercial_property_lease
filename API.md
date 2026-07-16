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

## Implemented Endpoints (Phase 1)

| Method | Path             | Description        |
| ------ | ---------------- | ------------------- |
| GET    | `/api/v1/health`  | Liveness check       |

## Planned Endpoints (later phases)

- `/api/v1/auth/*` — Google OAuth, email/phone OTP, JWT refresh
- `/api/v1/properties` — search, filter, paginate commercial properties
- `/api/v1/properties/{id}/verification` — AI verification report
- `/api/v1/chat/*` — tenant/landlord chat threads and messages
- `/api/v1/kyc/*` — tenant KYC verification
- `/api/v1/leases/*` — lease generation, AI summary, e-signature

Every new endpoint must include validation, pagination/filtering/sorting
where applicable, structured errors, and OpenAPI documentation.
