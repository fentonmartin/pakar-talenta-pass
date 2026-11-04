import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPassport } from '@/app/lib/demo-store';
import { formatDate } from '@/app/lib/format';

export const dynamic = 'force-dynamic';

const METHODS = ['direct_link', 'code_lookup', 'magic_link'] as const;

/**
 * Admin — access history for a single pass. Renders a lightweight log derived
 * from the demo store (demo mode has no real access ledger, so entries are
 * generated deterministically per pass with plausible recent timestamps).
 */
export default async function AccessLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const passport = await getPassport(id);
  if (!passport) notFound();

  const now = Date.now();
  const METHODS: Record<string, string> = {
    direct_link: 'bg-sky-50 text-sky-600 border-sky-500/30',
    code_lookup: 'bg-violet-50 text-violet-600 border-violet-500/30',
    magic_link: 'bg-amber-50 text-amber-600 border-amber-500/30',
  };
  const order = ['code_lookup', 'direct_link', 'magic_link'];

  const entries = Array.from({ length: 7 }, (_, i) => {
    const method = order[i % order.length];
    const at = new Date(now - (i + 1) * 11 * 60 * 60 * 1000 - 7 * 60_000 * i);
    return { method, at };
  }).sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div>
      <div className="mb-8">
        <Link href={`/admin/passes/${id}`} className="text-xs font-mono text-slate-400 hover:text-[#7a2fff]">
          ← Back to Pass
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#002060]">Access History</h1>
        <p className="mt-1 text-slate-500">
          {passport.fullName} · <span className="font-mono text-[#7a2fff]">{passport.uniqueCode}</span>
        </p>
      </div>

      <div className="glass overflow-hidden rounded-[16px] border border-slate-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Handled</th>
                <th className="pb-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Method</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-3 text-sm text-slate-700">
                    {formatDate(e.at)}
                  </td>
                  <td className="py-3">
                    <span className={`inline-block rounded-full border px-2 py-1 text-xs ${METHODS[e.method]}`}>
                      {e.method.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-400">
          Demo mode — access events are illustrative. Connect a database for a real append-only audit trail.
        </p>
      </div>
    </div>
  );
}