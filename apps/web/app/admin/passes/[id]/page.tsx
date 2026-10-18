import Link from 'next/link';
import { getDb } from '@/app/lib/db';
import { passportPasses } from '@pakar-talenta/db';
import { eq } from 'drizzle-orm';
import { PassportStats } from '@/app/components/PassportStats';

export const dynamic = 'force-dynamic';

interface PassportRow {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  uniqueCode: string;
  expiryDate: Date;
  status: 'active' | 'expired' | 'revoked';
  createdAt: Date;
}

async function fetchPassport(id: string): Promise<PassportRow | null> {
  const db = getDb();
  const [passport] = await db
    .select()
    .from(passportPasses)
    .where(eq(passportPasses.id, id))
    .limit(1);
  return passport ?? null;
}

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
  const passport = await fetchPassport(id);

  if (!passport) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-400">Pass not found.</p>
        <Link href="/admin/passes" className="text-gold hover:text-gold-light">
          ← Back to all passes
        </Link>
      </div>
    );
  }

  const expiry = new Date(passport.expiryDate);
  const isExpired = expiry.getTime() <= Date.now();
  const isValid = passport.status === 'active' && !isExpired;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/passes" className="text-xs text-gold/60 font-mono">
            ← Back to Passes
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">{passport.fullName}</h1>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            passport.status === 'active'
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : passport.status === 'revoked'
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}
        >
          {passport.status.toUpperCase()}
        </span>
      </div>

      {/* Pass Info Card */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-[16px] p-6 border border-gold/30">
          <h2 className="text-sm font-mono text-gold/60 uppercase tracking-wider mb-4">
            Pass Details
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-surface-500">Unique Code</span>
              <div className="font-mono text-xl text-white">{passport.uniqueCode}</div>
            </div>
            <div>
              <span className="text-xs text-surface-500">Full Name</span>
              <div className="text-white">{passport.fullName}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-surface-500">Email</span>
                <div className="text-white">{passport.email ?? '—'}</div>
              </div>
              <div>
                <span className="text-xs text-surface-500">WhatsApp</span>
                <div className="text-white">{passport.phone ?? '—'}</div>
              </div>
            </div>
            <div>
              <span className="text-xs text-surface-500">Expiry Date</span>
              <div className="text-white">
                {expiry.toLocaleString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div>
              <span className="text-xs text-surface-500">Created At</span>
              <div className="text-white">
                {new Date(passport.createdAt).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="glass rounded-[16px] p-6 border border-gold/30">
          <h2 className="text-sm font-mono text-gold/60 uppercase tracking-wider mb-4">
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
                className="w-full px-4 py-2 text-left hover:bg-surface-100/5 rounded-xl transition-colors"
              >
                <span className="text-gold">↻</span> Resend Delivery
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
                  className="w-full px-4 py-2 text-left hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                >
                  ⛔ Revoke Pass
                </button>
              </form>
            )}

            <Link
              href={`/admin/passes/${passport.id}/access-log`}
              className="flex items-center justify-between w-full px-4 py-2 hover:bg-surface-100/5 rounded-xl transition-colors"
            >
              <span>Access History</span>
              <span className="text-xs text-surface-500">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {!isValid && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">
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
