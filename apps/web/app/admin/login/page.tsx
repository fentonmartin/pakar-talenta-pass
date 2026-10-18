import Link from 'next/link';

/**
 * Admin login page — password + TOTP 2FA form.
 * No session required — this is the entry point to the admin console.
 */
export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-xs font-mono text-gold/60 uppercase tracking-[0.3em] mb-2">
            Pakar Talenta Pass
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-surface-400 text-sm mt-2">
            Enter your credentials and TOTP code
          </p>
        </div>

        <form method="POST" action="/api/auth/login" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 bg-surface-100/10 border border-gold/20 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-gold/50 transition-colors"
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              TOTP Code (6-digit)
            </label>
            <input
              type="text"
              name="totpCode"
              required
              maxLength={6}
              pattern="\d{6}"
              className="w-full px-4 py-3 bg-surface-100/10 border border-gold/20 rounded-xl text-white font-mono placeholder-surface-500 focus:outline-none focus:border-gold/50 transition-colors"
              autoComplete="one-time-password"
            />
          </div>

          <button
            type="submit"
            className="w-full gold-bg text-surface-50 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-surface-400 hover:text-gold transition-colors"
          >
            ← Back to public site
          </Link>
        </div>
      </div>
    </div>
  );
}
