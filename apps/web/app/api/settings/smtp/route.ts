import { verifySession } from '@pakar-talenta/auth';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSettings, type SmtpSettings } from '@/app/lib/settings';

/**
 * POST /api/settings/smtp — Save SMTP configuration (admin).
 * Body: { host, port, user, pass, fromEmail, fromName, secure }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = (await cookies()).get('admin_session')?.value;
    if (!sessionToken || !verifySession(sessionToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Build the override, only touching fields the form actually provided.
    // (A blank password field must not wipe a previously stored one.)
    const smtp: SmtpSettings = {};
    if (body.host) smtp.host = String(body.host);
    if (body.port !== undefined && body.port !== '') smtp.port = Number(body.port);
    if (body.user) smtp.user = String(body.user);
    if (body.pass) smtp.pass = String(body.pass);
    if (body.fromEmail) smtp.fromEmail = String(body.fromEmail);
    if (body.fromName) smtp.fromName = String(body.fromName);
    if (body.secure !== undefined && body.secure !== '') smtp.secure = body.secure === true || body.secure === 'true';

    updateSettings({ smtp });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Save SMTP settings failed:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}