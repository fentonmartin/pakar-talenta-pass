'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/app/lib/format';

interface PassportDetails {
  fullName: string;
  email?: string;
  phone?: string;
  uniqueCode: string;
  expiryDate: string;
  status: string;
  createdAt: string;
}

const KEY_PREFIX = 'ptp_verified_';

/**
 * Gated "Pass Details" block on the public pass page.
 *
 * The pass card + validity status are public; the full details stay hidden
 * until the holder is confirmed (email/phone) OR the visitor just verified via
 * the /verify flow (in which case a one-time marker unlocks it automatically).
 */
export function PassDetailsGate({ code }: { code: string }) {
  const [identifier, setIdentifier] = useState('');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [details, setDetails] = useState<PassportDetails | null>(null);
  const [error, setError] = useState('');

  const dateOnly = (d?: string) => formatDate(d);

  // Auto-unlock if the visitor just verified this pass via /verify.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY_PREFIX + code);
      if (raw) {
        const parsed = JSON.parse(raw) as PassportDetails;
        if (parsed && parsed.uniqueCode === code) {
          setDetails(parsed);
          setPhase('success');
        }
      }
    } catch {
      /* ignore invalid/missing marker */
    }
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) return;
    setPhase('loading');
    setError('');

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Invalid code or identifier');
        setPhase('error');
        return;
      }
      const json = await res.json();
      setDetails(json.passport);
      setPhase('success');
      try {
        sessionStorage.setItem(KEY_PREFIX + code, JSON.stringify(json.passport));
      } catch {
        /* storage unavailable — still unlock for this visit */
      }
    } catch {
      setError('Network error — please try again');
      setPhase('error');
    }
  }

  return (
    <div className="glass rounded-[16px] border border-slate-200/70 p-6">
      <h2 className="mb-5 text-sm font-mono uppercase tracking-wider text-[#7a2fff]/70">
        Pass Details
      </h2>

      {phase !== 'success' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="rounded-xl bg-[#7a2fff]/5 px-4 py-3 text-sm text-slate-600">
            The pass is active, but the details are private. Enter the holder&apos;s email or
            phone number to unlock them.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email or Phone Number
            </label>
            <input
              type="text"
              placeholder="you@example.com or +62812xxxxxxx"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-[#7a2fff] focus:outline-none focus:ring-2 focus:ring-[#7a2fff]/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={phase === 'loading'}
            className="w-full rounded-xl bg-gradient-to-r from-[#7722ff] to-[#5d16da] py-3 font-semibold text-white shadow-lg shadow-purple-700/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === 'loading' ? 'Checking...' : 'Unlock Details'}
          </button>
        </form>
      ) : details ? (
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
            ✓ Verified — details unlocked
          </p>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#7a2fff]/15 bg-[#7a2fff]/5 p-4">
              <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Unique Code</span>
              <div className="font-mono text-xl text-[#7a2fff]">{details.uniqueCode}</div>
            </div>

            <div>
              <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Full Name</span>
              <div className="text-slate-900">{details.fullName}</div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Email</span>
                <div className="text-slate-900">{details.email ?? '—'}</div>
              </div>
              <div>
                <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">WhatsApp</span>
                <div className="text-slate-900">{details.phone ?? '—'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Created At</span>
                <div className="text-slate-900">{dateOnly(details.createdAt)}</div>
              </div>
              <div>
                <span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Expiry Date</span>
                <div className="text-slate-900">{dateOnly(details.expiryDate)}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PassDetailsGate;