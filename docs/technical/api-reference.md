# API Reference

All endpoints are relative to `http://localhost:3000`.

## Authentication

All `/admin/*` routes require a valid JWT session token (HttpOnly cookie `admin_session`).
Sessions are created via the login endpoint and require password + TOTP 2FA.

---

## Public API Routes

### `POST /api/verify`

Verify a passport by email OR phone + unique code.

**Request Body:**
```json
{
  "identifier": "user@example.com",     // or "+62812xxx"
  "code": "PTP-7K9F-QX2M"
}
```

**Response (200):**
```json
{
  "passport": {
    "id": "uuid-...",
    "fullName": "John Doe",
    "uniqueCode": "PTP-7K9F-QX2M",
    "email": "user@example.com",
    "phone": "+62812xxx",
    "expiryDate": "2025-12-31T23:59:59Z",
    "status": "active",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "valid": true
}
```

**Response (404):**
```json
{ "error": "Passport not found" }
```

### `GET /api/passes/code/[code]`

Fetch a passport by its unique code (used by the public pass detail page).

**Response (200):**
```json
{
  "passport": { ... }
}
```

**Response (404):**
```json
{ "error": "Passport not found" }
```

### `GET /`

Public landing page with pass preview and verify link.

---

## Admin API Routes

> All admin routes require authentication (JWT in `admin_session` cookie).

### `POST /api/auth/login`

Authenticate as admin with password + TOTP code.

**Request Body:**
```json
{
  "password": "your-password",
  "totpCode": "123456"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Sets an HttpOnly, Secure, SameSite=Lax cookie `admin_session`.

**Response (401):**
```json
{ "error": "Invalid credentials" }
```

### `POST /api/auth/logout`

Clears the admin session cookie.

**Response (200):**
```json
{ "success": true }
```

### `GET /api/passes`

List all passport passes.

**Response (200):**
```json
{
  "passes": [
    {
      "id": "uuid-...",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": null,
      "uniqueCode": "PTP-7K9F-QX2M",
      "expiryDate": "2025-12-31T23:59:59Z",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### `POST /api/passes`

Create a new passport pass.

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+6281234567890",
  "expiryDays": 365
}
```

**Response (201):**
```json
{
  "passport": { ... }
}
```

**Response (400):**
```json
{
  "error": "At least one valid contact method (email or phone) is required"
}
```

### `GET /api/passes/[id]`

Get a single passport by ID.

**Response (200):**
```json
{ "passport": { ... } }
```

### `PUT /api/passes/[id]`

Update a passport pass.

**Request Body:**
```json
{
  "status": "revoked",
  "expiryDate": "2026-06-30T00:00:00Z"
}
```

### `DELETE /api/passes/[id]`

Soft-delete a passport (sets status to `revoked`).

**Response (200):**
```json
{ "passport": { ... } }
```

### `POST /api/passes/[id]/revoke`

Revoke a passport (sets status to `revoked`).

**Response (200):**
```json
{ "passport": { ... } }
```

### `POST /api/delivery/resend`

Re-trigger delivery for a passport.

**Request Body:**
```json
{
  "passportId": "uuid-..."
}
```

**Response (200):**
```json
{
  "passport": { ... },
  "decision": {
    "deliverable": true,
    "channels": ["email", "whatsapp"],
    "recipients": {
      "email": "user@example.com",
      "whatsapp": "628123456789"
    },
    "reason": "both"
  },
  "links": {
    "waLink": "https://wa.me/628123456789?text=...",
    "mailtoLink": "mailto:...subject=...&body=...",
    "verifyUrl": "https://localhost:3000/verify?..."
  }
}
```

### `GET /api/stats`

Returns passport statistics (requires admin auth).

**Response (200):**
```json
{
  "total": 150,
  "active": 120,
  "expired": 25,
  "revoked": 5,
  "pendingDelivery": 2
}
```

---

## Frontend Routes

| Route | Auth Required | Description |
|---|---|---|
| `/` | No | Landing page with pass preview |
| `/verify` | No | Verification portal (email/phone + code) |
| `/[code]` | No | Public pass detail (accessed via wa.me/mailto link) |
| `/admin/login` | No | Admin login (password + TOTP) |
| `/admin/` | Yes | Admin dashboard (stats + quick actions) |
| `/admin/passes` | Yes | Pass list with search + filters |
| `/admin/passes/new` | Yes | Create new pass form |
| `/admin/passes/[id]` | Yes | Pass detail view |
