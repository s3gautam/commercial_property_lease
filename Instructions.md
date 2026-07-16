# Project Name

# PropLease AI

PropLease AI is an AI-first commercial property leasing platform that digitizes the complete leasing lifecycle—from property discovery to signed lease agreements.

This repository will contain the Tenant-side MVP.

The product should be built as a production-grade SaaS platform that can later expand to support Landlords, Brokers and Admins without major architectural changes.

---

# Your Role

You are the Founding Engineer and System Architect for PropLease AI.

You own the product end-to-end.

You are expected to:

- Design the system architecture.
- Build the backend.
- Build the web application.
- Build the mobile application.
- Build the AI layer.
- Design the database.
- Design APIs.
- Write tests.
- Produce production-quality code.
- Produce documentation.

Think like a Staff Software Engineer.

Never optimize for generating code quickly.

Optimize for:

- Maintainability
- Scalability
- Extensibility
- Clean Architecture
- Developer Experience
- Production Readiness

---

# MVP Scope

This repository only contains the Tenant MVP.

The tenant should be able to complete the following journey:

Signup

↓

Create Profile

↓

Browse Commercial Properties

↓

Search using AI

↓

View Property Details

↓

Read AI Property Verification Report

↓

Chat with Landlord

↓

Complete Tenant Verification (KYC)

↓

Generate Lease Agreement

↓

Read AI Lease Summary

↓

Digitally Sign Lease

Everything else should be designed for future expansion but not implemented.

---

# Platforms

Build **both** a Web Application and a Mobile Application.

The backend must serve both.

There should be one source of truth.

## Web

- Next.js 15
- React
- TypeScript
- TailwindCSS
- shadcn/ui

## Mobile

- React Native
- Expo
- Expo Router
- NativeWind
- React Query
- Zustand

The mobile application should support both Android and iOS.

Both platforms should have feature parity for the Tenant MVP.

---

# Monorepo

Use Turborepo with pnpm.

Repository structure:

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

Both applications must consume shared packages.

Never duplicate logic.

---

# Backend

Use:

- FastAPI
- SQLAlchemy 2.x
- PostgreSQL
- Redis
- Alembic

Architecture:

API

↓

Service Layer

↓

Repository Layer

↓

Database

Business logic must never exist inside controllers.

---

# AI

Use **Groq** as the primary LLM provider.

Read the key from:

GROQ_API_KEY

Never hardcode API keys.

Create a centralized LLM Gateway.

No service should call Groq directly.

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

The gateway should make future migration to OpenAI, Anthropic or Azure OpenAI possible with minimal code changes.

---

# SSL Handling

Development is being done on a corporate Windows laptop where SSL interception may occur.

Support the following:

1. python-certifi-win32

2. REQUESTS_CA_BUNDLE

3. SSL_CERT_FILE

If SSL verification still fails during development, support:

DISABLE_SSL_VERIFY=true

This flag must:

- default to false
- never be enabled in production
- only affect local development
- be implemented in one centralized HTTP client

Never scatter verify=False throughout the codebase.

---

# UI Philosophy

The UI should feel like a premium SaaS product.

Use inspiration from:

- Airbnb
- Linear
- Stripe
- Notion
- Vercel

Avoid generic admin-dashboard styling.

Focus on:

- Excellent typography
- Whitespace
- Smooth animations
- Skeleton loading
- Empty states
- Micro-interactions
- Responsive layouts
- Dark mode

The mobile application should feel like a true native app, not a wrapped website.

---

# Development Workflow

Do **not** attempt to build the entire application in one response.

Work in phases.

Phase 1
- Repository setup
- Monorepo
- Project scaffolding
- Docker
- Shared packages

Phase 2
- Backend foundation
- Authentication
- Database

Phase 3
- Web application

Phase 4
- Mobile application

Phase 5
- AI services

Phase 6
- KYC

Phase 7
- Lease generation

Phase 8
- Testing

Phase 9
- Documentation

At the end of every phase, stop and output:

- Completed Tasks
- Remaining Tasks
- Files Created
- Files Modified
- Known Issues
- Next Recommended Step
- Estimated Remaining Work

This prevents context window exhaustion.

---

# Documentation

Automatically generate and maintain:

- README.md
- CLAUDE.md
- TASKS.md
- ARCHITECTURE.md
- API.md
- DATABASE.md
- DEPLOYMENT.md

Update TASKS.md after every completed phase.

TASKS.md should always contain:

- Overall Progress
- Current Phase
- Completed Work
- Pending Work
- Technical Debt
- Known Bugs
- Future Enhancements
- Last Updated Timestamp

Treat TASKS.md as the project's persistent memory across Claude Code sessions.

---

# Code Quality Requirements

Every feature must include:

- Strong typing
- Input validation
- Error handling
- Logging
- Unit tests
- Integration tests
- API documentation

Never leave TODOs for core functionality.

Prefer clean abstractions over quick implementations.

The repository should be production-ready and capable of supporting future modules such as Landlord Portal, Broker Portal, Admin Dashboard, Payments, Maintenance, Escrow, and AI-powered recommendations without significant architectural changes.
