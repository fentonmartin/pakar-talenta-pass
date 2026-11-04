import Link from 'next/link';
import { BrandLogo } from '@/app/components/BrandLogo';

/**
 * Admin login page — password + TOTP 2FA form.
 * No session required — this is the entry point to the admin console.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === 'invalid';

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <BrandLogo height={46} />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-[#002060]">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your credentials and TOTP code</p>
        </div>

        {hasError && (
          <p className="mb-4 text-center text-sm text-red-500">
            Invalid credentials. Check your password and TOTP code.
          </p>
        )}

        <form method="POST" action="/api/auth/login" className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-[#7a2fff] focus:outline-none focus:ring-2 focus:ring-[#7a2fff]/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">TOTP Code (6-digit)</label>
            <input
              type="text"
              name="totpCode"
              required
              maxLength={6}
              pattern="\d{6}"
              autoComplete="one-time-password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-slate-900 placeholder-slate-400 focus:border-[#7a2fff] focus:outline-none focus:ring-2 focus:ring-[#7a2fff]/20"
            />
          </div>

          <button
            type="submit"
            className="gold-bg w-full rounded-xl py-3 font-bold text-white shadow-lg shadow-red-950/30 transition hover:opacity-90"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 transition hover:text-[#7a2fff]">
            ← Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
}