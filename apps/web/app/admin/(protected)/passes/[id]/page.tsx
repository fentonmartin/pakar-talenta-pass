import Link from 'next/link';
import { getPassport } from '@/app/lib/demo-store';
import type { PassportPass } from '@pakar-talenta/db';
import { PassportStats } from '@/app/components/PassportStats';
import { formatDate } from '@/app/lib/format';

export const dynamic = 'force-dynamic';

type PassportRow = PassportPass;

/**
 * Admin — Detailed pass view. Shows passport data, delivery links,
 * access history, and action buttons (resend, revoke).
 */
export default async function PassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const passport = await getPassport(id);

  if (!passport) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Pass not found.</p>
        <Link href="/admin/passes" className="text-[#7a2fff] hover:text-[#5d16da]">
          ← Back to all passes
        </Link>
      </div>
    );
  }

  const expiry = new Date(passport.expiryDate);
  const createdAt = new Date(passport.createdAt);
  const isExpired = expiry.getTime() <= Date.now();
  const isValid = passport.status === 'active' && !isExpired;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/passes" className="text-xs font-mono text-slate-400 hover:text-[#7a2fff]">
            ← Back to Passes
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">{passport.fullName}</h1>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            passport.status === 'active'
              ? 'bg-green-50 text-green-600 border-green-500/30'
              : passport.status === 'revoked'
                ? 'bg-red-50 text-red-600 border-red-500/30'
                : 'bg-yellow-50 text-yellow-600 border-yellow-500/30'
          }`}
        >
          {passport.status.toUpperCase()}
        </span>
      </div>

      {/* Pass Info Card */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-[16px] p-6 border border-slate-200/70">
          <h2 className="text-sm font-mono text-[#7a2fff]/70 uppercase tracking-wider mb-4">
            Pass Details
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400">Unique Code</span>
              <div className="font-mono text-xl text-slate-900">{passport.uniqueCode}</div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Full Name</span>
              <div className="text-slate-900">{passport.fullName}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400">Email</span>
                <div className="text-slate-900">{passport.email ?? '—'}</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">WhatsApp</span>
                <div className="text-slate-900">{passport.phone ?? '—'}</div>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Expiry Date</span>
              <div className="text-slate-900">
                {formatDate(expiry)}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Created At</span>
              <div className="text-slate-900">
                {formatDate(createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="glass rounded-[16px] p-6 border border-slate-200/70">
          <h2 className="text-sm font-mono text-[#7a2fff]/70 uppercase tracking-wider mb-4">
            Actions
          </h2>
          <div className="space-y-3">
            <form
              action={`/api/delivery/resend`}
              method="POST"
              className="contents"
            >
              <input type="hidden" name="passportId" value={passport.id} />
              <button
                type="submit"
                className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-xl transition-colors"
              >
                <span className="text-[#7a2fff]">↻</span> Resend Delivery
              </button>
            </form>

            {passport.status === 'active' && (
              <form
                action={`/api/passes/${passport.id}/revoke`}
                method="POST"
                className="contents"
              >
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                >
                  ⛔ Revoke Pass
                </button>
              </form>
            )}

            <Link
              href={`/admin/passes/${passport.id}/access-log`}
              className="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <span>Access History</span>
              <span className="text-xs text-slate-400">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {!isValid && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm">
            This pass has been <strong>{passport.status}</strong>.
            {isExpired && ' The expiry date has passed.'}
          </p>
        </div>
      )}

      {/* Passport Stats Summary */}
      <div className="mb-8">
        <PassportStats passport={passport} />
      </div>
    </div>
  );
}
