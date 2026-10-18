import Link from 'next/link';
import { getDb } from '@/app/lib/db';
import { passportPasses } from '@pakar-talenta/db';
import { and, desc, eq, ilike, type SQL } from 'drizzle-orm';

interface PassportRow {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  uniqueCode: string;
  expiryDate: Date | string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: Date | string;
}

interface PassesPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

async function fetchPasses(search?: string, status?: string): Promise<PassportRow[]> {
  const db = getDb();
  const conditions: SQL[] = [];

  if (search) {
    conditions.push(ilike(passportPasses.fullName, `%${search}%`));
  }
  if (status && ['active', 'expired', 'revoked'].includes(status)) {
    conditions.push(eq(passportPasses.status, status as 'active' | 'expired' | 'revoked'));
  }

  if (conditions.length > 0) {
    return db
      .select()
      .from(passportPasses)
      .where(and(...conditions))
      .orderBy(desc(passportPasses.createdAt)) as Promise<PassportRow[]>;
  }

  return db
    .select()
    .from(passportPasses)
    .orderBy(desc(passportPasses.createdAt)) as Promise<PassportRow[]>;
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'expired': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'revoked': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-surface-500/20 text-surface-400 border-surface-500/30';
  }
}

/**
 * Admin passes list — searchable, filterable table.
 */
export default async function PassesPage({ searchParams }: PassesPageProps) {
  const { q = '', status = '' } = await searchParams;
  const passes = await fetchPasses(q, status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Passes</h1>
        <Link
          href="/admin/passes/new"
          className="gold-bg text-surface-50 px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
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
          className="flex-1 px-4 py-2 bg-surface-100/10 border border-gold/20 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-gold/50"
        />
        <select
          name="status"
          defaultValue={status}
          className="px-4 py-2 bg-surface-100/10 border border-gold/20 rounded-xl text-white focus:outline-none focus:border-gold/50"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-surface-300 hover:text-white transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gold/10">
              <th className="pb-3 text-xs font-mono text-gold/60 uppercase tracking-wider">Name</th>
              <th className="pb-3 text-xs font-mono text-gold/60 uppercase tracking-wider">Code</th>
              <th className="pb-3 text-xs font-mono text-gold/60 uppercase tracking-wider">Contact</th>
              <th className="pb-3 text-xs font-mono text-gold/60 uppercase tracking-wider">Status</th>
              <th className="pb-3 text-xs font-mono text-gold/60 uppercase tracking-wider">Expires</th>
              <th className="pb-3 text-xs font-mono text-gold/60 uppercase tracking-wider">Created</th>
              <th className="pb-3 text-right text-xs font-mono text-gold/60 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {passes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-surface-400">
                  No passes found.
                </td>
              </tr>
            ) : (
              passes.map((pass) => (
                <tr key={pass.id} className="border-b border-gold/5 hover:bg-surface-100/5">
                  <td className="py-3 text-white">{pass.fullName}</td>
                  <td className="py-3 font-mono text-sm text-gold">{pass.uniqueCode}</td>
                  <td className="py-3 text-surface-300 text-sm">
                    {pass.email ?? pass.phone ?? '—'}
                  </td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs border ${statusColor(pass.status)}`}>
                      {pass.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-surface-300">
                    {new Date(pass.expiryDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 text-sm text-surface-400">
                    {new Date(pass.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/passes/${pass.id}`}
                      className="text-gold hover:text-gold-light text-sm"
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
