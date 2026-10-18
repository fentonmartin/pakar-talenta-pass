# Setup & Deployment Guide

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 22.0.0 |
| npm | 10.0.0 |
| Docker | 27.0 |
| PostgreSQL | 16 |
| Redis | 7.x |

## Local Development

### 1. Clone & Install

```bash
git clone <repo-url>
cd pakar-talenta-pass
npm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pakar_talenta
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this
ADMIN_PASSWORD_HASH=your-bcrypt-hash-here

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_FROM=Pakar Talenta Pass <noreply@pakartalenta.co.id>

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-next-auth-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# TOTP (for admin 2FA provisioning)
TOTP_SECRET=your-totp-secret-here
```

### 3. Start Services

Using docker-compose:

```bash
docker-compose up -d postgres redis
```

Or manually:
```bash
# PostgreSQL (via postgres.app or docker)
# Redis
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Run Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start the App

```bash
# Terminal 1 — Web app
npm run dev

# Terminal 2 — Worker (background email/SMTP delivery)
npm run worker
```

Visit `http://localhost:3000` — you'll see the landing page.
Admin: `http://localhost:3000/admin/login`

## Production Deployment

### Using Docker

```bash
# Build
docker build -t pakar-talenta-web -f apps/web/Dockerfile .

# Run
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --network host \
  pakar-talenta-web
```

### Docker Compose (Production)

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Cloudflare Tunnel (pass.pakartalenta.co.id)

```bash
# Tunnel config
cloudflared tunnel --hostname pass.pakartalenta.co.id --url http://localhost:3000 --cred-file ~/.cloudflared/cred.json
```

### Environment Variables (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Must be 32+ chars, random |
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_PASS` | Yes | SMTP password / app password |
| `NEXTAUTH_URL` | Yes | Public URL of the app |
| `TOTP_SECRET` | Yes | TOTP secret for first admin login |

### Security Checklist

- [ ] `JWT_SECRET` is a random 64-char string
- [ ] `NEXTAUTH_SECRET` is different from `JWT_SECRET`
- [ ] SMTP credentials use an app-specific password (not main account)
- [ ] PostgreSQL has a dedicated user with least privilege
- [ ] Redis is on a private network
- [ ] HTTPS is terminated (Cloudflare TLS)
- [ ] `NODE_ENV=production`

## CI/CD

GitHub Actions runs on every push to `main`:

1. **Typecheck**: `tsc --build` across all workspaces
2. **Lint**: `eslint . --max-warnings=0`
3. **Test**: `vitest run`
4. **Build**: `next build` (on success)

```yaml
# .github/workflows/ci.yml
# See CI/CD pipeline definition
```
