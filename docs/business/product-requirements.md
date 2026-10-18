# Product Requirements Document (PRD)

## Product: Pakar Talenta Pass

## 1. Problem Statement

FEN's team manages access for vetted professionals (talent scouts, auditors, partners)
to exclusive events, projects, or content. Currently, this is done via email or manual
hand-delivery of access codes — leading to:

- Lost codes (no central place to view/redeliver)
- No expiration enforcement (codes stay valid indefinitely)
- No audit trail (cannot prove who accessed what and when)
- No revocation mechanism (cannot invalidate a leaked code)

## 2. Solution

**Pakar Talenta Pass** — a digital access pass system that generates unique,
single-use codes tied to a professional's profile. Each pass:

1. Is delivered via email and/or WhatsApp (wa.me deep-link, no WhatsApp API cost)
2. Has an expiration date (default 1 year from creation)
3. Can be revoked by an admin at any time
4. Is logged in an immutable audit trail

## 3. User Personas

### Primary Personas

| Persona | Role |
|---------|------|
| **Talent Scout (End User)** | Receives the pass via email/WhatsApp, views it at `pass.pakartalenta.co.id/[code]`, verifies access at `/verify` |
| **Admin (FEN's Team)** | Creates passes, views analytics, revokes access, audits activity |

### Secondary Personas

| Persona | Role |
|---------|------|
| **Security Auditor** | Reviews audit_log exports for compliance |
| **Talent Lead** | Requests batches of passes for new hires/partners |

## 4. Journeys

### 4.1 Admin Creates a Pass

1. Admin logs into `/admin/login` (password + TOTP)
2. Admin visits `/admin/passes/new`
3. Admin fills: Full Name, Email (optional), Phone (optional), Expiry Days (default 365)
4. Admin submits
5. System generates unique code (e.g., `PTP-7K9F-QX2M`)
6. System saves record with status=`active`
7. Worker picks up delivery job
8. If email present → SMTP send with pass details
9. If phone present → admin sees wa.me link to send manually
10. Admin is redirected to `/admin/passes/[id]` detail page

### 4.2 End User Verifies Access

1. User receives email or WhatsApp message with pass link
2. User opens `/verify`
3. User enters: email OR phone + unique code
4. System verifies code matches and passport is `active` and unexpired
5. If valid → user sees pass details (name, code, expiry, status)
6. If invalid → error message with reason

### 4.3 End User Views Pass Details

1. User opens the wa.me/mailto link
2. URL routes to `/[code]`
3. System looks up passport by code
4. If active + unexpired → renders PassCard with QR code, full name, expiry, status
5. If expired/revoked → shows "invalid pass" message
6. Every view is logged to `access_logs`

### 4.4 Admin Revokes a Pass

1. Admin visits `/admin/passes/[id]`
2. Admin clicks "Revoke"
3. System sets status=`revoked`
4. System logs to `audit_log`
5. User can no longer verify or view the pass

### 4.5 Admin Resends Delivery

1. Admin visits `/admin/passes/[id]`
2. Admin clicks "Resend"
3. System re-evaluates delivery channels
4. If email present → SMTP send again
5. If phone present → shows fresh wa.me link
6. System logs to `delivery_log` and `audit_log`

## 5. Non-Goals

1. **No blockchain** — explicitly excluded
2. **No end-user signup** — all access is via pass codes only
3. **No real-time collaboration** — static page per pass
4. **No mobile app** — progressive web app (PWA) only

## 6. Metrics (North Star)

| Metric | Target |
|--------|--------|
| Pass creation rate | >50/day within 3 months |
| Pass verification success rate | >95% |
| Delivery success rate | >98% (SMTP) |
| Admin login 2FA adoption | 100% |
| Audit log coverage | 100% of security-relevant events |

## 7. Constraints

| Constraint | Detail |
|-----------|--------|
| **Email** | SMTP only — transactional email from configured SMTP server |
| **WhatsApp** | wa.me deep-link only — no WhatsApp API, no cost |
| **Database** | PostgreSQL 15+ |
| **Auth** | JWT + bcrypt + TOTP 2FA (admin only) |
| **Frontend** | Next.js 15 App Router + Tailwind CSS v4 |
| **Deployment** | `pass.pakartalenta.co.id` domain, local dev first |
