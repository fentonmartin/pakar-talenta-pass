import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySession } from '@pakar-talenta/auth';
import { BrandLogo } from '@/app/components/BrandLogo';

export const dynamic = 'force-dynamic';

/**
 * Protected admin layout — guards the admin console.
 * Checks for a valid JWT session cookie, redirects to login if missing/expired.
 */
export default async function ProtectedAdminLayout({
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
    <div className="min-h-screen bg-white">
      {/* Admin header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/admin">
            <BrandLogo height={24} />
          </Link>

          <nav className="flex items-center gap-5">
            <Link
              href="/admin/passes"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#7a2fff]"
            >
              Passes
            </Link>
            <Link
              href="/admin/stats"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#7a2fff]"
            >
              Stats
            </Link>
            <Link
              href="/admin/settings"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#7a2fff]"
            >
              Settings
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm font-medium text-slate-400 transition-colors hover:text-red-500"
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
