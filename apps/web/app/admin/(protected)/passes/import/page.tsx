'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/app/lib/format';

interface Row {
  fullName: string;
  email?: string;
  phone?: string;
  expiryDate?: string;
}

interface Result {
  ok: boolean;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  uniqueCode?: string;
  expiryDate?: string;
  error?: string;
}

const PLACEHOLDER = `Nama Lengkap | Email | Telepon | YYYY-MM-DD
Rizky Aditya Pratama | rizky@contoh.id | +6281234567890 | 2027-12-31
Sari Kartika Dewi | sari@contoh.id | +6281298765432 | 2028-06-30`;

function parseLines(text: string): Row[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      return {
        fullName: parts[0] ?? '',
        email: parts[1] || undefined,
        phone: parts[2] || undefined,
        expiryDate: parts[3] || undefined,
      };
    });
}

/**
 * Admin — bulk import passes (name, email, phone, expiry date).
 */
export default function BulkImportPage() {
  const [text, setText] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = () => {
    setError(null);
    setRows(parseLines(text));
    setResults(null);
  };

  const handleImport = async () => {
    if (!rows || rows.length === 0) return;
    setSubmitting(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/passes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passes: rows }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Bulk import failed');
      } else {
        setResults(json.results);
      }
    } catch {
      setError('Network error — try again');
    } finally {
      setSubmitting(false);
    }
  };

  const created = results?.filter((r) => r.ok).length ?? 0;
  const failed = results ? results.length - created : 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin/passes" className="text-xs font-mono text-slate-400 hover:text-[#7a2fff]">
            ← Back to Passes
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[#002060]">Bulk Import</h1>
          <p className="mt-1 text-slate-500">
            Add many passes at once — one row per line: <code className="text-[#7a2fff]">Name | email | phone | YYYY-MM-DD</code>
          </p>
        </div>
        <Link
          href="/admin/passes/new"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#7a2fff] hover:text-[#7a2fff]"
        >
          Single create
        </Link>
      </div>

      <div className="glass rounded-[16px] border border-slate-200/70 p-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">Data rows</label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setRows(null);
            setResults(null);
          }}
          rows={8}
          placeholder={PLACEHOLDER}
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-[#7a2fff] focus:outline-none focus:ring-2 focus:ring-[#7a2fff]/20"
        />
        <p className="mt-2 text-xs text-slate-400">
          Email or phone is required per row. Expiry is optional (defaults to 1 year). Use <code>|</code> as separator.
        </p>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handlePreview}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#7a2fff] hover:text-[#7a2fff]"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!rows || rows.length === 0 || submitting}
            className="rounded-xl bg-gradient-to-r from-[#7722ff] to-[#5d16da] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-700/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Importing...' : `Import${rows?.length ? ` ${rows.length}` : ''}`}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      {/* Preview */}
      {rows && rows.length > 0 && (
        <div className="glass mt-6 overflow-hidden rounded-[16px] border border-slate-200/70">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Name</th>
                  <th className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Email</th>
                  <th className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Phone</th>
                  <th className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-slate-900">{r.fullName}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{r.email ?? '—'}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{r.phone ?? '—'}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{formatDate(r.expiryDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-[16px] border border-slate-200">
          <div className={`border-b px-4 py-3 text-sm font-semibold ${
            failed === 0 ? 'border-green-500/30 bg-green-50 text-green-700' : 'border-amber-500/30 bg-amber-50 text-amber-700'
          }`}>
            Created {created}, failed {failed}
          </div>
          <div className="max-h-80 overflow-auto bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="sticky top-0 border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Name</th>
                  <th className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Code</th>
                  <th className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-slate-900">{r.fullName}</td>
                    <td className="px-4 py-2 font-mono text-sm text-[#7a2fff]">{r.uniqueCode ?? '—'}</td>
                    <td className="px-4 py-2">
                      {r.ok ? (
                        <span className="inline-block rounded-full border border-green-500/30 bg-green-50 px-2 py-0.5 text-xs text-green-600">Created</span>
                      ) : (
                        <span className="inline-block rounded-full border border-red-500/30 bg-red-50 px-2 py-0.5 text-xs text-red-600">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}