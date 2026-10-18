import type { PassportPass, PassportStatus } from '@pakar-talenta/db';

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
    case 'active':
      return 'text-green-400';
    case 'expired':
      return 'text-yellow-400';
    case 'revoked':
      return 'text-red-400';
    default:
      return 'text-surface-400';
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
      <div className="glass rounded-[12px] p-4 border border-gold/20">
        <div className="text-xs text-surface-500 mb-1">Status</div>
        <div className={`font-medium ${statusColor(passport.status)}`}>
          {passport.status}
        </div>
      </div>

      <div className="glass rounded-[12px] p-4 border border-gold/20">
        <div className="text-xs text-surface-500 mb-1">Unique Code</div>
        <div className="font-mono text-sm text-white">{passport.uniqueCode}</div>
      </div>

      <div className="glass rounded-[12px] p-4 border border-gold/20">
        <div className="text-xs text-surface-500 mb-1">Expiry</div>
        <div className={`font-medium ${
          isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-white'
        }`}>
          {isExpired ? 'Expired' : `${diffDays}d left`}
        </div>
      </div>

      <div className="glass rounded-[12px] p-4 border border-gold/20">
        <div className="text-xs text-surface-500 mb-1">Created</div>
        <div className="text-sm text-surface-300">
          {new Date(passport.createdAt).toLocaleDateString('id-ID')}
        </div>
      </div>
    </div>
  );
}

export default PassportStats;
