import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySession } from '@pakar-talenta/auth';

export const dynamic = 'force-dynamic';

/**
 * Admin layout — protects all /admin routes.
 * Checks for a valid JWT session cookie, redirects to login if missing/expired.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;

  if (!sessionToken) {
    redirect('/admin/login');
  }

  const session = verifySession(sessionToken);
  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-surface-100 relative">
      {/* Embossed texture background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.gold/3)_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* Admin header */}
      <header className="glass border-b border-gold/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gold/60 uppercase tracking-[0.3em]">
                Pakar Talenta Pass
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/admin/passes"
              className="text-sm text-surface-300 hover:text-white transition-colors"
            >
              Passes
            </Link>
            <Link
              href="/admin/stats"
              className="text-sm text-surface-300 hover:text-white transition-colors"
            >
              Stats
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-surface-400 hover:text-gold transition-colors"
              >
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
