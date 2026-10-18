# User Guide — Pakar Talenta Pass

## For End Users (Talent Scouts, Professionals)

You've received a Pakar Talenta Pass. Here's how it works.

### 1. You Receive Your Pass

You'll get an email and/or a WhatsApp message from our admin team with:

- Your **full name**
- Your **unique pass code** (e.g., `PTP-7K9F-QX2M`)
- A link to view your pass

### 2. Verify Your Access

If you need to verify your identity or check your pass status:

1. Go to `https://pass.pakartalenta.co.id/verify`
2. Enter the email or phone number on file
3. Enter your unique code
4. Click "Verify"

✅ If valid, you'll see your pass details.
❌ If invalid, you'll see an error explaining why.

### 3. View Your Pass

Click the link in your email or WhatsApp message to open your pass at:

`https://pass.pakartalenta.co.id/[your-unique-code]`

On this page you'll see:

- Your name (embossed on a pass card)
- Your unique code
- A QR code (scanable by event staff)
- Your expiry date
- Your pass status (active/expired/revoked)

### 4. What Your Pass Gives You

- Access to exclusive events and content
- Single-use verification (each code is unique)
- Automatic expiration (valid for 1 year by default)

### Questions?

Contact the admin who sent you your pass — they can re-verify your
code or regenerate a new one if needed.

---

# Admin Guide — Pakar Talenta Pass

## For Admin Staff (FEN's Team)

### 1. Logging In

Go to `https://pass.pakartalenta.co.id/admin/login`

You'll need:
- Your admin password
- A TOTP code from your authenticator app (Google Authenticator, Authy, etc.)

If you don't have TOTP set up, ask the system owner to provision you.

### 2. Creating a Pass

1. After login, go to `/admin/passes/new`
2. Fill in:
   - **Full Name** (required)
   - **Email** (optional — if provided, pass is delivered via SMTP)
   - **Phone** (optional — if provided, you'll get a wa.me link to send)
   - **Expiry Days** (default: 365)
3. Click "Create Pass"
4. After creation, you'll see delivery options:
   - If email was provided → an email was sent automatically
   - If phone was provided → a wa.me link is shown — click it, then click
     "Send" on your phone to deliver the pass via WhatsApp

### 3. Managing Passes

- Go to `/admin/passes` to see all passes
- Use the search bar to find by name or code
- Click any pass to view details
- From the detail page you can:
  - **Revoke** — invalidate the pass immediately
  - **Resend** — re-send email or get a new wa.me link
  - **Refresh Code** — generate a new unique code (old one becomes invalid)

### 4. Dashboard

Visit `/admin` for a quick overview:

- Total passes created
- Active / Expired / Revoked counts
- Pending delivery count

### 5. Audit Logs

All security-relevant events are logged:

- Pass creation, update, revocation
- Delivery success/failure
- Verification attempts (success + failure)
- Admin logins

To export audit logs, contact the system owner.

### Emergency

If a pass is compromised:

1. Go to `/admin/passes/[id]`
2. Click "Revoke"
3. Notify the intended recipient to re-verify their identity
4. Create a new pass if needed
