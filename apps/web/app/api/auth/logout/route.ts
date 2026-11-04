import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout — Clear the admin session cookie.
 * Used by the logout form in the admin header.
 */
export async function POST(_request: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/login', _request.url));
  response.cookies.delete('admin_session');
  return response;
}

/**
 * DELETE /api/auth/logout — Clear admin session (API callers).
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}
