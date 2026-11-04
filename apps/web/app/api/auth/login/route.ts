import { comparePassword, totpVerify, createSession } from '@pakar-talenta/auth';
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminPasswordHash } from '@/app/lib/settings';

/**
 * POST /api/auth/login — Admin login with password + optional TOTP.
 * Accepts JSON or form-encoded bodies.
 *
 * Uses the effective admin password hash (runtime override in
 * `data/settings.json` if set, otherwise `ADMIN_PASSWORD_HASH` from env), so a
 * password changed from the admin console takes effect immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let password: string | undefined;
    let totpCode: string | undefined;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      password = body.password;
      totpCode = body.totpCode;
    } else {
      const form = await request.formData();
      password = form.get('password')?.toString();
      totpCode = form.get('totpCode')?.toString();
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const hash = getAdminPasswordHash();
    const passwordOk = hash ? await comparePassword(password, hash) : false;

    let totpOk = true;
    const totpSecret = process.env.TOTP_SECRET;
    if (totpSecret) {
      totpOk = !!totpCode && totpVerify(totpCode, totpSecret);
    }

    const token = passwordOk && totpOk ? createSession() : null;

    // Plain HTML form posts (the login page) expect redirects, not JSON.
    const isFormPost =
      contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

    if (!token) {
      if (isFormPost) {
        const response = NextResponse.redirect(new URL('/admin/login?error=invalid', request.url), 303);
        return response;
      }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Set HttpOnly cookie for the admin session
    const response = isFormPost
      ? NextResponse.redirect(new URL('/admin', request.url), 303)
      : NextResponse.json({ token });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login failed:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/logout — Clear admin session.
 */
export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}