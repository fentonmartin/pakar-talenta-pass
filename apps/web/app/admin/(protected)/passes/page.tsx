import Link from 'next/link';
import { listPassports } from '@/app/lib/demo-store';
import type { PassportPass } from '@pakar-talenta/db';
import { formatDate } from '@/app/lib/format';

export const dynamic = 'force-dynamic';

type PassportRow = PassportPass;

interface PassesPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-600 border-green-500/30';
    case 'expired': return 'bg-yellow-50 text-yellow-600 border-yellow-500/30';
    case 'revoked': return 'bg-red-50 text-red-600 border-red-500/30';
    default: return 'bg-slate-100 text-slate-500 border-slate-300/40';
  }
}

/**
 * Admin passes list — searchable, filterable table.
 */
export default async function PassesPage({ searchParams }: PassesPageProps) {
  const { q = '', status = '' } = await searchParams;
  const passes = await listPassports(q, status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#002060]">Passes</h1>
        <Link
          href="/admin/passes/new"
          className="gold-bg px-4 py-2 rounded-xl font-medium text-white hover:opacity-90 transition-opacity"
        >
          + New Pass
        </Link>
      </div>

      {/* Search + filters */}
      <form method="GET" className="mb-6 flex gap-4">
        <input
          type="text"
          name="q"
          placeholder="Search by name..."
          defaultValue={q}
          className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7a2fff] focus:ring-2 focus:ring-[#7a2fff]/20"
        />
        <select
          name="status"
          defaultValue={status}
          className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#7a2fff]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#7a2fff] transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 text-xs font-mono text-[#7a2fff]/70 uppercase tracking-wider">Code</th>
              <th className="pb-3 text-xs font-mono text-[#7a2fff]/70 uppercase tracking-wider">Name</th>
              <th className="pb-3 text-xs font-mono text-[#7a2fff]/70 uppercase tracking-wider">Contact</th>
              <th className="pb-3 text-xs font-mono text-[#7a2fff]/70 uppercase tracking-wider">Created</th>
              <th className="pb-3 text-xs font-mono text-[#7a2fff]/70 uppercase tracking-wider">Expires</th>
              <th className="pb-3 text-xs font-mono text-[#7a2fff]/70 uppercase tracking-wider">Status</th>
              <th className="pb-3 text-right text-xs font-mono text-[#7a2fff]/70 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {passes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No passes found.
                </td>
              </tr>
            ) : (
              passes.map((pass) => (
                <tr key={pass.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 font-mono text-sm text-[#7a2fff]">{pass.uniqueCode}</td>
                  <td className="py-3 text-slate-900">{pass.fullName}</td>
                  <td className="py-3 text-slate-500 text-sm">
                    {pass.email ?? pass.phone ?? '—'}
                  </td>
                  <td className="py-3 text-sm text-slate-700">
                    {formatDate(pass.createdAt)}
                  </td>
                  <td className="py-3 text-sm text-slate-700">
                    {formatDate(pass.expiryDate)}
                  </td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs border ${statusColor(pass.status)}`}>
                      {pass.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/passes/${pass.id}`}
                      className="text-[#7a2fff] hover:text-[#5d16da] text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
