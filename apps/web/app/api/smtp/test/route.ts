import { verifySession } from '@pakar-talenta/auth';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@pakar-talenta/mail';
import { getSmtpConfig, syncSmtpEnv } from '@/app/lib/settings';

/**
 * POST /api/smtp/test — Send a test email using the effective SMTP config.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = (await cookies()).get('admin_session')?.value;
    if (!sessionToken || !verifySession(sessionToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cfg = getSmtpConfig();
    if (!cfg.host || !cfg.user || !cfg.pass) {
      return NextResponse.json({ error: 'SMTP not configured (set the host, username and password)' }, { status: 400 });
    }

    // Mirror the effective config into env so the mail package uses it.
    syncSmtpEnv();

    const result = await sendEmail(
      cfg.user,
      'Pakar Talenta Pass — SMTP test',
      `<p>This is a test email from Pakar Talenta Pass.</p><p>Your SMTP configuration is working correctly.</p>`,
      'This is a test email from Pakar Talenta Pass. Your SMTP configuration is working correctly.',
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: result.error || 'SMTP test failed' }, { status: 500 });
  } catch (err) {
    console.error('SMTP test failed:', err);
    const message = err instanceof Error ? err.message : 'SMTP test failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}