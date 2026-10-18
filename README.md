n# Pakar Talenta Pass

Exclusive digital access pass for vetted professionals.

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL, SMTP, and JWT settings

# 3. Start PostgreSQL + Redis (via Docker)
docker-compose up -d

# 4. Run database migrations
npm run db:migrate

# 5. Start the web app
npm run dev

# 6. Start the worker (in another terminal)
npm run worker
```

Open http://localhost:3000 to view the portal, or http://localhost:3000/admin/login for the admin console.

## Environment Variables

Copy `.env.example` and configure:

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (32+ chars) |
| `ADMIN_PASSWORD_HASH` | ✅ | bcrypt hash of admin password |
| `SMTP_HOST` | ✅ | SMTP server hostname |
| `SMTP_USER` | ✅ | SMTP auth username |
| `SMTP_PASS` | ✅ | SMTP auth password |

## Project Structure

```
apps/web     — Next.js 15 web app (portal + admin)
apps/worker  — Background job processor
packages/db  — Drizzle ORM schema + migrations
packages/core — Business logic (codes, delivery, verification)
packages/auth — Admin auth (JWT + TOTP 2FA)
packages/mail — SMTP transport + email templates
packages/ui   — Design system (tokens + components)
packages/audit — Append-only audit logging
packages/config — Environment config + security floor
```

## License

UNLICENSED — proprietary
