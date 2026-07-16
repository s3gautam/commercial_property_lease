# CLAUDE.md

# PropLease AI

AI-First Commercial Property Leasing Platform

Tenant MVP

---

# Mission

Build a production-grade AI-first commercial property leasing platform that digitizes the complete leasing lifecycle.

This repository contains the Tenant MVP only.

The architecture must be designed so that future modules (Landlord, Broker, Admin, Payments, Maintenance, Escrow, AI Analytics, Mobile Expansion, Multi-Tenant SaaS) can be added without significant refactoring.

Think long-term.

Do not optimize for short-term implementation speed.

---

# Your Role

You are the Founding Engineer, Technical Architect and AI Engineer.

You own:

- System Architecture
- Backend
- Web Application
- Mobile Application
- AI Layer
- Database Design
- APIs
- Infrastructure
- Documentation
- Testing

Every implementation should reflect senior-level engineering practices.

---

# Engineering Principles

## 1. Never write quick hacks

Always prefer clean abstractions.

Every feature should be easy to extend.

---

## 2. Business Logic

Business logic should never exist inside:

- Controllers
- UI Components
- API Routes

Business logic belongs inside Services.

---

## 3. Repository Pattern

Every database operation should go through repositories.

Controllers must never directly query the database.

Architecture:

API

↓

Service

↓

Repository

↓

Database

---

## 4. Strong Typing

Python

- Type hints everywhere
- Pydantic models
- SQLAlchemy 2.x

TypeScript

- Strict Mode
- No "any"
- Shared Types

---

# Platforms

The repository contains multiple applications.

apps/

    web/

    mobile/

services/

    backend/

packages/

    ui/

    api/

    types/

    config/

    utils/

infra/

docs/

---

# Monorepo

Use:

- Turborepo
- pnpm

The root should support:

pnpm install

pnpm dev

pnpm build

pnpm lint

pnpm test

---

# Tech Stack

## Web

- Next.js 15
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- TanStack Query
- Zustand

---

## Mobile

Use:

- React Native
- Expo
- Expo Router
- NativeWind
- React Query
- Zustand
- React Hook Form

The mobile application should support:

- Android
- iOS

No separate backend.

Both applications consume the same APIs.

---

## Backend

Use:

- FastAPI
- PostgreSQL
- SQLAlchemy 2.x
- Alembic
- Redis

Everything should be asynchronous wherever possible.

---

## Infrastructure

Docker Compose should start:

- Backend
- Frontend
- Mobile Dev Server
- PostgreSQL
- Redis
- MinIO

Everything should run locally using one command.

---

# AI Architecture

Use Groq as the primary LLM provider.

Never call Groq directly.

Architecture:

Application

↓

Agent

↓

Prompt Builder

↓

LLM Gateway

↓

Groq

↓

Output Validator

↓

Application

Future providers should be swappable.

---

# AI Agents

Every AI capability should be an Agent.

Examples:

SearchAgent

VerificationAgent

LeaseDraftingAgent

LeaseSummaryAgent

Every agent exposes:

run()

validate()

explain()

confidence_score()

All responses should include:

- response
- confidence
- latency
- token usage
- reasoning metadata
- validation status

---

# Prompt Management

Never hardcode prompts inside code.

Create:

/prompts

Each prompt should be versioned.

Prompt templates should be reusable.

---

# Shared Packages

Whenever possible share:

- Types
- Validation
- API Clients
- Constants
- Utilities
- Theme
- Configurations

Avoid duplicate code.

---

# UI Philosophy

The UI should feel like a premium SaaS application.

Design inspiration:

- Airbnb
- Linear
- Stripe
- Notion
- Vercel

Focus on:

- Typography
- Whitespace
- Smooth animations
- Premium interactions
- Skeleton loading
- Responsive layouts
- Dark mode
- Accessibility

Avoid generic admin dashboard styling.

---

# Mobile Design

The mobile application should feel native.

Do not create a responsive website inside a mobile shell.

Use:

- Native navigation
- Native gestures
- Native animations
- Native inputs

Offline cache recently viewed properties.

Support deep linking.

---

# Authentication

Support:

- Google OAuth
- Email OTP
- Phone OTP
- JWT
- Refresh Tokens

Authentication should work identically across Web and Mobile.

---

# Security

Never trust frontend validation.

Always validate on the backend.

Requirements:

- JWT expiry
- Refresh Tokens
- Rate limiting
- Parameterized SQL
- Input sanitization
- Secure file uploads
- Environment variables only
- CSRF protection where applicable
- Secure HTTP headers

---

# SSL Handling

Development is performed on a corporate Windows machine.

Support:

- python-certifi-win32
- REQUESTS_CA_BUNDLE
- SSL_CERT_FILE

Provide:

DISABLE_SSL_VERIFY

Requirements:

- default false
- local development only
- never enabled in production

Centralize SSL configuration.

Never scatter verify=False throughout the codebase.

All external SDKs should use the same HTTP client.

---

# Environment Variables

Create:

.env.example

Include:

GROQ_API_KEY=

DATABASE_URL=

REDIS_URL=

JWT_SECRET=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

NEXT_PUBLIC_API_URL=

AWS_ACCESS_KEY_ID=

AWS_SECRET_ACCESS_KEY=

S3_BUCKET=

DISABLE_SSL_VERIFY=false

REQUESTS_CA_BUNDLE=

SSL_CERT_FILE=

---

# Database

Use Alembic migrations.

Never rely on automatic schema creation.

Create indexes where appropriate.

Design for future growth.

Current MVP tables include:

Users

TenantProfile

Property

PropertyImage

PropertyDocument

VerificationReport

ChatThread

Message

Lease

LeaseVersion

KYCVerification

Notification

AuditLog

Every table should contain:

created_at

updated_at

created_by

updated_by

where appropriate.

---

# API Standards

REST APIs.

Version:

/api/v1/

Every endpoint must include:

- Validation
- Pagination
- Filtering
- Sorting
- Structured errors
- OpenAPI documentation

Response format:

{
    "success": true,
    "data": {},
    "meta": {},
    "error": null
}

---

# Logging

Use structured logging.

Include:

Request ID

User ID

Route

Execution Time

LLM Latency

External API Latency

Database Latency

Errors

---

# File Uploads

Support:

PAN

Aadhaar

Business Documents

Lease PDFs

Property Images

Requirements:

- MIME validation
- Size validation
- Virus scan interface
- Object storage only
- Never store locally

---

# Testing

Target:

90%+ coverage

Write:

- Unit Tests
- Integration Tests
- API Tests
- AI Parsing Tests

Mock external APIs.

Mock Groq responses.

---

# Performance

Use:

Lazy loading

Pagination

Caching

Background workers

Streaming responses where beneficial

Optimize for scalability.

---

# Documentation

Maintain:

README.md

TASKS.md

ARCHITECTURE.md

DATABASE.md

API.md

DEPLOYMENT.md

Every module should explain:

Purpose

Dependencies

Inputs

Outputs

Extension Points

---

# Development Workflow

Before writing code:

1. Understand the requirement.

2. Design the architecture.

3. Consider edge cases.

4. Implement.

5. Test.

6. Refactor.

Only then proceed.

---

# Long-Running Development

This project will span many Claude Code sessions.

Maintain:

TASKS.md

Always update after each phase.

Include:

- Overall Progress
- Current Phase
- Completed Tasks
- Pending Tasks
- Current Blockers
- Known Bugs
- Technical Debt
- Future Enhancements
- Last Updated Timestamp

Treat TASKS.md as the persistent project memory.

---

# Context Management

Never attempt to generate the entire repository in one response.

Work incrementally.

Preferred phases:

1. Repository Setup
2. Backend Foundation
3. Authentication
4. Database
5. Web Application
6. Mobile Application
7. AI Layer
8. Search
9. KYC
10. Lease Generation
11. Chat
12. Testing
13. Documentation
14. Production Hardening

At the end of every phase output:

- Completed Tasks
- Remaining Tasks
- Files Created
- Files Modified
- Known Issues
- Next Recommended Step

---

# Future Compatibility

Every architectural decision should make it easy to add:

- Landlord Portal
- Broker Portal
- Admin Dashboard
- Payments
- Escrow
- Rent Collection
- Maintenance Ticketing
- Brokerage Management
- AI Recommendations
- AI Property Valuation
- CRM Integrations
- ERP Integrations
- Public APIs
- Multi-Tenant SaaS
- Multi-Country Support
- Multi-Language Support

Do not introduce architectural shortcuts that will make these future capabilities difficult to implement.

---

# Definition of Done

A feature is complete only when it includes:

✓ Production-ready implementation

✓ Strong typing

✓ Validation

✓ Error handling

✓ Logging

✓ Unit tests

✓ Integration tests

✓ Documentation

✓ Responsive Web UI

✓ Mobile implementation (where applicable)

✓ API documentation

✓ Clean architecture

✓ No duplicated logic

✓ Security review

✓ Ready for future extension

If any of these are missing, the feature is **not** considered complete.
