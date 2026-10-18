import type { PassportSummary } from '@/app/components/PassportStats';

interface DashboardStatsProps {
  stats: PassportSummary;
}

/**
 * Renders the dashboard stat cards (total, active, expired, revoked, pending).
 */
export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards: { label: string; value: number; color: string }[] = [
    { label: 'Total Passes', value: stats.total, color: 'text-white' },
    { label: 'Active', value: stats.active, color: 'text-green-400' },
    { label: 'Expired', value: stats.expired, color: 'text-yellow-400' },
    { label: 'Revoked', value: stats.revoked, color: 'text-red-400' },
    { label: 'Pending Delivery', value: stats.pendingDelivery, color: 'text-blue-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass border border-gold/20 rounded-[16px] p-5 text-center"
        >
          <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          <div className="text-sm text-surface-400 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
