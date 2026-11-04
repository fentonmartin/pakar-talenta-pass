import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — kept as a light pass-through.
 *
 * Admin route protection is handled by the authenticated layout under
 * `app/admin/(protected)/`, which runs on the Node.js runtime where the
 * `@pakar-talenta/auth` JWT helpers can execute. Middleware runs on the Edge
 * runtime, which cannot run the Node-only `jsonwebtoken`/`crypto` used to
 * verify sessions — attempting to verify here always fails.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};