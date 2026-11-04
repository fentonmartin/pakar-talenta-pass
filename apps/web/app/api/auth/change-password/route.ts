import { comparePassword, hashPassword, verifySession } from '@pakar-talenta/auth';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminPasswordHash, updateSettings } from '@/app/lib/settings';

/**
 * POST /api/auth/change-password — Change the admin password.
 * Requires a valid admin session. Body: { currentPassword, newPassword }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = (await cookies()).get('admin_session')?.value;
    if (!sessionToken || !verifySession(sessionToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'New password must be different' }, { status: 400 });
    }

    const hash = getAdminPasswordHash();
    const currentOk = hash ? await comparePassword(currentPassword, hash) : false;
    if (!currentOk) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    updateSettings({ adminPasswordHash: newHash });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Change password failed:', err);
    return NextResponse.json({ error: 'Change password failed' }, { status: 500 });
  }
}