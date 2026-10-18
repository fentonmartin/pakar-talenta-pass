# Technical Architecture

## Overview

Pakar Talenta Pass is a digital access pass system for vetted professionals.
It uses a monorepo architecture (npm workspaces) with a Next.js 15 web app
fronting a PostgreSQL database, with a background worker for delivery.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                         Browser                         │
│  ┌─────────────┐    ┌────────────────────────────────┐  │
│  │ Public Portal │   │ Admin Console                  │  │
│  │ /verify       │   │ /admin/*                       │  │
│  │ /[code]       │   │                                │  │
│  └─────────────┘    └────────────────────────────────┘  │
└─────────────────┬──────────────────┬─────────────────────┘
                  │                  │
                  ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
│   Next.js   │  │   API Routes │  │  Middleware        │
│   App Router│  │  /api/*      │  │  (auth, rate-limit)│
└─────────────┘  └──────────────┘  └──────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Packages (npm workspaces)             │
│  ┌─────────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ @-/core │ │ @-/db  │ │@-/auth│ │@-/mail│ │@-/audit│       │
│  └─────────┘ └────────┘ └──────┘ └──────┘ └──────┘       │
│                    │                                    │
│                    ▼                                    │
│              PostgreSQL 16                              │
│  (passport_passes, delivery_log,                      │
│   access_logs, reusable_links, audit_log)              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Worker Process                        │
│  BullMQ Queue → @-/mail → SMTP                          │
│                    → wa.me links                        │
│                    → audit logs                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
              Redis (queues)
              PostgreSQL (shared)
```

## Data Flow

### 1. Pass Creation
```
Admin UI → POST /api/passes → core.generatePassportData() → DB
                                    → detectDeliveryMethod()
                                    → worker.enqueueDelivery()
```

### 2. Delivery
```
Worker → detectDeliveryMethod() → { email: SMTP send, whatsapp: wa.me link }
                    → delivery_log written
                    → audit_log written
```

### 3. Verification
```
Public User → /verify → POST /api/verify → core.verifyPassport()
                                         → isPassportValid()
                                         → audit_log written
```

### 4. Pass Access
```
User clicks wa.me/mailto link → /[code] page → core.isPassportValid()
                                       → access_logs written
```

## Package Boundaries

| Package | Responsibility | Dependencies |
|-----------|---------------|--------------|
| `@-/db` | Drizzle schema, migrations, types | pg, drizzle-orm |
| `@-/core` | Business logic: codes, delivery, verification | @-/db |
| `@-/auth` | JWT sessions, TOTP 2FA, bcrypt | jsonwebtoken, bcryptjs |
| `@-/mail` | SMTP transport, email templates | nodemailer, @-/core, @-/db |
| `@-/audit` | Append-only audit writer | @-/db, @-/auth |
| `@-/config` | Env config, security floor | — |
| `@-/ui` | Design tokens, shared components | react |
| `@-/worker` | Delivery queue processor | bullmq, @-/core, @-/mail |
| `apps/web` | Next.js frontend | All packages above |

## Security Invariants

1. **Deliverability is opt-in, never opt-out** — if both email and phone are absent, delivery is disabled.
2. **Audit is append-only** — no UPDATE/DELETE on `audit_log` table.
3. **Admin access requires 2FA** — TOTP enforced at login.
4. **Unique codes are single-use** — unless explicitly refreshed by admin.
5. **No PII in logs** — audit entries store hashed identifiers, not plaintext PII.

## Deployment

```bash
# Development
docker-compose up -d
npm run db:migrate
npm run dev  # web
npm run worker  # background

# Production (Cloudflare Tunnel)
docker build -t pakar-talenta-web apps/web/
docker run -d -p 3000:3000 --env-file .env pakar-talenta-web
```

## Testing Strategy

- **Unit tests**: Vitest for business logic (core, auth, audit)
- **Integration tests**: Vitest + Testcontainers for DB operations
- **E2E tests**: Playwright for critical user flows
- **Quality gates**: tsc + eslint must pass before any commit
