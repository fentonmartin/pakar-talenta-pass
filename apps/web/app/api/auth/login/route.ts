import { authenticateAdmin } from '@pakar-talenta/auth';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login — Admin login with password + optional TOTP.
 * Body: { password: string, totpCode?: string }
 * Returns: { token: string } on success
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, totpCode } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // The auth package checks both password and TOTP (if configured)
    const token = await authenticateAdmin(password, totpCode);

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set HttpOnly cookie for the admin session
    const response = NextResponse.json({ token });
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
 * POST /api/auth/logout — Clear admin session.
 */
export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}
