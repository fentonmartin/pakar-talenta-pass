import type { PassportPass, PassportStatus } from '@pakar-talenta/db';
import { formatDate } from '@/app/lib/format';

export interface PassportSummary {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  pendingDelivery: number;
}

interface PassportStatsProps {
  passport: PassportPass;
}

function statusColor(status: PassportStatus): string {
  switch (status) {
    case 'active': return 'text-green-600';
    case 'expired': return 'text-yellow-600';
    case 'revoked': return 'text-red-600';
    default: return 'text-slate-500';
  }
}

/**
 * Inline stats summary for a single passport — shows status badge,
 * expiry countdown, and quick action links.
 */
export function PassportStats({ passport }: PassportStatsProps) {
  const expiry = new Date(passport.expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const isExpired = diffMs <= 0;
  const isExpiringSoon = !isExpired && diffDays <= 7;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="glass rounded-[12px] p-4 border border-slate-200/70">
        <div className="mb-1 text-xs text-slate-400">Status</div>
        <div className={`font-medium ${statusColor(passport.status)}`}>{passport.status}</div>
      </div>

      <div className="glass rounded-[12px] p-4 border border-slate-200/70">
        <div className="mb-1 text-xs text-slate-400">Unique Code</div>
        <div className="font-mono text-sm text-[#7a2fff]">{passport.uniqueCode}</div>
      </div>

      <div className="glass rounded-[12px] p-4 border border-slate-200/70">
        <div className="mb-1 text-xs text-slate-400">Expiry</div>
        <div className={`font-medium ${
          isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-slate-900'
        }`}>
          {isExpired ? 'Expired' : `${diffDays}d left`}
        </div>
      </div>

      <div className="glass rounded-[12px] p-4 border border-slate-200/70">
        <div className="mb-1 text-xs text-slate-400">Created</div>
        <div className="text-sm text-slate-500">
          {formatDate(passport.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default PassportStats;