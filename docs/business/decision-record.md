# Decision Record: Technical Stack

## Date: 2025-01-15
## Status: Accepted

## Context

We need to build Pakar Talenta Pass — a digital access pass system with
email/WhatsApp delivery, admin auth, audit logging, and QR code display.

The project must:
- Follow fayolex-private patterns (monorepo with `apps/` + `packages/`)
- Exclude blockchain entirely
- Use SMTP for email
- Use wa.me deep-links for WhatsApp (no API)
- Deploy under `pass.pakartalenta.co.id`
- Have full documentation for technical, business, and product stakeholders

## Decision

### Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Monorepo** | npm workspaces | Same as fayolex-private; native, no extra tooling |
| **Frontend** | Next.js 15 App Router | SSR + static generation, React Server Components |
| **Styling** | Tailwind CSS v4 | Utility-first, design tokens in CSS |
| **Database** | PostgreSQL 16 | ACID, JSONB, native UUID support |
| **ORM** | Drizzle | Type-safe, no runtime overhead, Drizzle Kit migrations |
| **Auth** | JWT + bcryptjs + TOTP | Self-contained, no external TOTP lib |
| **Email** | nodemailer | SMTP-only, zero dependency complexity |
| **Background Jobs** | BullMQ + Redis | Reliable queue, retries, progress tracking |
| **QR Engine** | nayuki QR-Code-generator | MIT, 1-file, zero deps, battle-tested |
| **Queue Serialization** | JSON `.json` | Human-readable, git-friendly |
| **Validation** | `@/utils/validators.ts` | Internal, no external dep (keeps bundle light) |
| **Testing** | Vitest | Vite-native, fast, works with Next.js |
| **CI/CD** | GitHub Actions | Native to GitHub, no extra service |

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Prisma | Slower cold starts; Drizzle is lighter |
| Firebase Auth | No TOTP control; adds vendor lock-in |
| SendGrid/Mailgun API | Must use SMTP per project constraints |
| WhatsApp Business API | Cost + complexity; wa.me deep-link suffices |
| Supabase | Adds another vendor; PostgreSQL + Drizzle is sufficient |
| Solidity/Blockchain | Explicitly excluded by project constraints |
| Express | Next.js API routes provide same capability with SSR |
| Socket.io | No real-time collaboration needed |

### Key Trade-offs

1. **Wa.me links vs WhatsApp API**: Wa.me is free and simple, but requires
   the admin to manually click and send on their phone. Acceptable — admin
   is internal staff with a phone, and this eliminates WhatsApp API costs.

2. **BullMQ vs Inngest/Cron**: BullMQ gives full control over retry logic
   and delivery status. Inngest would outsource but adds a vendor.

3. **Drizzle vs Prisma**: Drizzle produces smaller bundles and has no
   client generation step. Trade-off: slightly more verbose queries.

4. **No react-hook-form**: Chose minimal HTML validation to reduce bundle
   size. Admin forms are small — worth avoiding the dependency.

## Consequences

- **Positive**: Lightweight, fast bundle, no vendor lock-in for auth/email
- **Negative**: Admin must manually send WhatsApp links (wa.me)
- **Neutral**: Worker must be deployed alongside web app (or as separate service)
