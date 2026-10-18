import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@pakar-talenta/auth';

/**
 * Next.js middleware — protects admin routes.
 * 
 * Public routes: /, /verify, /[code]
 * Protected routes: /admin/* (except /admin/login)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow /admin/login without session
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Don't protect public routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Check session for all other /admin routes
  const sessionToken = request.cookies.get('admin_session')?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const session = verifySession(sessionToken);
  if (!session) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('admin_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
