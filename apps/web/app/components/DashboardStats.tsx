import type { PassportSummary } from '@/app/components/PassportStats';

interface DashboardStatsProps {
  stats: PassportSummary;
}

/**
 * Renders the dashboard stat cards (total, active, expired, revoked, pending).
 */
export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards: { label: string; value: number; color: string }[] = [
    { label: 'Total Passes', value: stats.total, color: 'text-slate-900' },
    { label: 'Active', value: stats.active, color: 'text-green-600' },
    { label: 'Expired', value: stats.expired, color: 'text-yellow-600' },
    { label: 'Revoked', value: stats.revoked, color: 'text-red-600' },
    { label: 'Pending Delivery', value: stats.pendingDelivery, color: 'text-blue-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass border border-slate-200/70 rounded-[16px] p-5 text-center"
        >
          <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          <div className="text-sm text-slate-500 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}