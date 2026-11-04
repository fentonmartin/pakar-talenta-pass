import Link from 'next/link';
import { DashboardStats } from '@/app/components/DashboardStats';
import type { PassportSummary } from '@/app/components/PassportStats';
import { listAuditLog, type AuditEvent } from '@/app/lib/demo-store';
import { formatDate } from '@/app/lib/format';

export const dynamic = 'force-dynamic';

async function fetchStats(): Promise<PassportSummary> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stats`, {
      next: { revalidate: 15 },
    });
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch {
    return { total: 0, active: 0, expired: 0, revoked: 0, pendingDelivery: 0 };
  }
}

const EVENT_META: Record<AuditEvent['eventType'], { label: string; dot: string }> = {
  passport_created: { label: 'Pass created', dot: 'bg-[#7a2fff]' },
  delivery_sent: { label: 'Delivery sent', dot: 'bg-sky-500' },
  verification_success: { label: 'Verification success', dot: 'bg-green-500' },
  passport_revoked: { label: 'Pass revoked', dot: 'bg-red-500' },
  admin_login: { label: 'Admin login', dot: 'bg-slate-400' },
};

/**
 * Admin — statistics overview with a recent-activity audit log.
 */
export default async function StatsPage() {
  const [stats, audit] = await Promise.all([fetchStats(), listAuditLog()]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#002060]">Stats</h1>
          <p className="mt-1 text-slate-500">Overview of all issued access passes</p>
        </div>
        <Link
          href="/admin/passes"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#7a2fff] hover:text-[#7a2fff]"
        >
          ← Back to Passes
        </Link>
      </div>

      <DashboardStats stats={stats} />

      {/* Recent activity / audit log */}
      <div className="glass mt-8 rounded-[16px] border border-slate-200/70 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[#7a2fff]/70">
            Recent Activity
          </h2>
          <span className="text-xs text-slate-400">
            {audit.length} events · append-only audit trail
          </span>
        </div>

        <ol className="relative space-y-1 border-l border-slate-200 pl-5">
          {audit.map((e) => {
            const meta = EVENT_META[e.eventType];
            return (
              <li key={e.id} className="relative py-2">
                <span
                  className={`absolute -left-[26px] top-3 h-2.5 w-2.5 rounded-full ring-4 ring-white ${meta.dot}`}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="text-sm font-medium text-slate-800">{meta.label}</span>
                  <span className="text-xs text-slate-400">
                    {formatDate(e.timestamp)}
                  </span>
                </div>
                <div className="mt-0.5 text-sm text-slate-500">
                  <span className="font-mono text-[#7a2fff]">{e.resourceLabel}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span className="text-slate-400">{e.actor}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}