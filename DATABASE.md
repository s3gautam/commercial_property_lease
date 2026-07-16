# Database

PostgreSQL via SQLAlchemy 2.x (async) and Alembic migrations. Schema is
never created automatically — every change is a migration under
`services/backend/alembic/versions`.

## Conventions

- Every table extends `TimestampedModel`
  (`services/backend/app/models/base.py`), providing:
  - `id` (UUID primary key)
  - `created_at`, `updated_at`
  - `created_by`, `updated_by`
- Indexes are added for every foreign key and frequently filtered column.

## Planned Tables (Tenant MVP)

| Table              | Purpose                                   |
| ------------------- | ------------------------------------------ |
| `users`              | Account records across roles              |
| `tenant_profiles`    | Tenant-specific profile data              |
| `properties`         | Commercial property listings              |
| `property_images`    | Property media                            |
| `property_documents` | Supporting documents for a property        |
| `verification_reports` | AI-generated property verification       |
| `chat_threads`       | Tenant/landlord conversations              |
| `messages`           | Chat messages                             |
| `leases`             | Lease agreements                          |
| `lease_versions`     | Lease revision history                    |
| `kyc_verifications`  | Tenant KYC records                        |
| `notifications`      | User notifications                        |
| `audit_logs`         | System-wide audit trail                   |

None of these tables exist yet — they are created via Alembic migrations
in Phase 2 (Backend Foundation / Database).

## Migrations

```bash
cd services/backend
alembic revision --autogenerate -m "add users table"
alembic upgrade head
```
