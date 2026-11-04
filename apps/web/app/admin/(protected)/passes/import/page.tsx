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

const PLACEHOLDER = `Rizky Aditya Pratama | rizky@contoh.id | +6281234567890 | 2027-12-31
Sari Kartika Dewi | sari@contoh.id | +6281298765432 | 2028-06-30`;

function emptyRow(): Row {
  return { fullName: '', email: '', phone: '', expiryDate: '' };
}

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

function downloadTemplate() {
  const csv =
    'name,email,phone,expiryDate\n' +
    'Rizky Aditya Pratama,rizky@contoh.id,+6281234567890,2027-12-31\n' +
    'Sari Kartika Dewi,sari@contoh.id,+6281298765432,2028-06-30';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pakar-talenta-import-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#7a2fff] focus:outline-none focus:ring-2 focus:ring-[#7a2fff]/20';

/**
 * Admin — bulk import passes (name, email, phone, expiry date).
 */
export default function BulkImportPage() {
  const [mode, setMode] = useState<'table' | 'paste'>('table');
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);
  const [text, setText] = useState('');
  const [pasteRows, setPasteRows] = useState<Row[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handlePastePreview = () => {
    setError(null);
    setPasteRows(parseLines(text));
    setResults(null);
  };

  // Rows that are actually ready to import (has a name + at least one contact).
  const importable = (mode === 'table' ? rows : pasteRows ?? []).filter(
    (r) => r.fullName.trim() && (r.email?.trim() || r.phone?.trim()),
  );

  const handleImport = async () => {
    if (importable.length === 0) return;
    setSubmitting(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch('/api/passes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passes: importable.map((r) => ({
            fullName: r.fullName.trim(),
            email: r.email?.trim() || undefined,
            phone: r.phone?.trim() || undefined,
            expiryDate: r.expiryDate || undefined,
          })),
        }),
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
            Susun data pass (nama, email, telepon, tanggal kadaluarsa) lalu import sekaligus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#7a2fff] hover:text-[#7a2fff]"
          >
            ⬇ Download template
          </button>
          <Link
            href="/admin/passes/new"
            className="rounded-lg bg-gradient-to-r from-[#7722ff] to-[#5d16da] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Single create
          </Link>
        </div>
      </div>

      {/* Mode switch */}
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {(['table', 'paste'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setResults(null);
              setError(null);
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              mode === m ? 'bg-[#7722ff] text-white' : 'text-slate-500 hover:text-[#7a2fff]'
            }`}
          >
            {m === 'table' ? 'Isi di tabel' : 'Tempel teks'}
          </button>
        ))}
      </div>

      <div className="glass rounded-[16px] border border-slate-200/70 p-6">
        {mode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Nama *</th>
                  <th className="py-2 pr-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Email</th>
                  <th className="py-2 pr-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Telepon</th>
                  <th className="py-2 pr-3 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">Expiry (YYYY-MM-DD)</th>
                  <th className="py-2 text-xs font-mono uppercase tracking-wider text-[#7a2fff]/70">✕</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3">
                      <input value={r.fullName} onChange={(e) => updateRow(i, { fullName: e.target.value })} placeholder="Nama Lengkap" className={inputCls} />
                    </td>
                    <td className="py-2 pr-3">
                      <input value={r.email ?? ''} onChange={(e) => updateRow(i, { email: e.target.value })} placeholder="name@email.com" type="email" className={inputCls} />
                    </td>
                    <td className="py-2 pr-3">
                      <input value={r.phone ?? ''} onChange={(e) => updateRow(i, { phone: e.target.value })} placeholder="+62812xxxxxxx" className={inputCls} />
                    </td>
                    <td className="py-2 pr-3">
                      <input value={r.expiryDate ?? ''} onChange={(e) => updateRow(i, { expiryDate: e.target.value })} type="date" className={inputCls} />
                    </td>
                    <td className="py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={rows.length === 1}
                        className="text-slate-400 transition hover:text-red-500 disabled:opacity-30"
                        title="Hapus baris"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addRow}
              className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-[#7a2fff] hover:text-[#7a2fff]"
            >
              + Tambah baris
            </button>
            <p className="mt-3 text-xs text-slate-400">*) Nama wajib dan minimal salah satu email/telepon. Baris kosong diabaikan saat import.</p>
          </div>
        ) : (
          <div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPasteRows(null);
                setResults(null);
              }}
              rows={8}
              placeholder={PLACEHOLDER}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-[#7a2fff] focus:outline-none focus:ring-2 focus:ring-[#7a2fff]/20"
            />
            <p className="mt-2 text-xs text-slate-400">
              Satu baris per pass, pisah dengan <code>|</code>: <code>Nama | email | telepon | YYYY-MM-DD</code>
            </p>
            <button
              type="button"
              onClick={handlePastePreview}
              className="mt-4 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#7a2fff] hover:text-[#7a2fff]"
            >
              Preview
            </button>
          </div>
        )}

        {mode === 'table' && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">
              {importable.length} baris siap di-import
              {importable.length > 0 && importable.length < (mode === 'table' ? rows.length : pasteRows?.length ?? 0)
                ? ' (beberapa baris kosong diabaikan)'
                : ''}
            </span>
            <button
              type="button"
              onClick={handleImport}
              disabled={importable.length === 0 || submitting}
              className="rounded-xl bg-gradient-to-r from-[#7722ff] to-[#5d16da] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-700/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Importing...' : `Import ${importable.length}`}
            </button>
          </div>
        )}
        {mode === 'paste' && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">{importable.length} baris siap di-import</span>
            <button
              type="button"
              onClick={handleImport}
              disabled={importable.length === 0 || submitting}
              className="rounded-xl bg-gradient-to-r from-[#7722ff] to-[#5d16da] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-700/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Importing...' : `Import ${importable.length}`}
            </button>
          </div>
        )}

        {(mode === 'paste' ? pasteRows?.length ?? 0 > 0 : false) && (
          <p className="mt-4 text-sm text-slate-500">Ditemukan {(pasteRows ?? []).length} baris dari teks.</p>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

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