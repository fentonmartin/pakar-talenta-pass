import Link from 'next/link';
import { DashboardStats } from '@/app/components/DashboardStats';
import type { PassportSummary } from '@/app/components/PassportStats';

export const dynamic = 'force-dynamic';

async function fetchStats(): Promise<PassportSummary> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stats`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  } catch {
    return { total: 0, active: 0, expired: 0, revoked: 0, pendingDelivery: 0 };
  }
}

/**
 * Admin dashboard — overview of passport stats and quick actions.
 */
export default async function AdminDashboard() {
  const stats = await fetchStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#002060]">Pakar Talenta Pass Dashboard</h1>
        <p className="mt-1 text-slate-500">Overview of all issued access passes</p>
      </div>

      <DashboardStats stats={stats} />

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <Link
          href="/admin/passes/new"
          className="glass rounded-[16px] border border-slate-200/70 p-6 transition-colors hover:border-[#7a2fff]/50 group"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-2 transition-colors group-hover:text-[#7a2fff]">
            Create New Pass
          </h3>
          <p className="text-slate-500">Issue a new access pass to a vetted professional.</p>
        </Link>

        <Link
          href="/admin/passes"
          className="glass rounded-[16px] border border-slate-200/70 p-6 transition-colors hover:border-[#7a2fff]/50 group"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-2 transition-colors group-hover:text-[#7a2fff]">
            Manage Passes
          </h3>
          <p className="text-slate-500">View, search, and update all existing passes.</p>
        </Link>
      </div>
    </div>
  );
}
