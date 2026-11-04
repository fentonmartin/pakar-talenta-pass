'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/app/lib/format';

interface VerificationResult {
  passport: {
    fullName: string;
    uniqueCode: string;
    email?: string;
    phone?: string;
    expiryDate: string;
    createdAt?: string;
    status: string;
  };
  valid: boolean;
}

/**
 * Manual verification form — email/phone + unique code.
 */
export function VerifyForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [identifierValid, setIdentifierValid] = useState(false);

  useEffect(() => {
    const looksLikeEmail = identifier.includes('@');
    const digitsOnly = identifier.replace(/\D/g, '');
    setIdentifierValid(
      (looksLikeEmail && identifier.includes('.')) ||
        (digitsOnly.length >= 8 && digitsOnly.length <= 15),
    );
  }, [identifier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code: code.toUpperCase() }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Verification failed');
      } else {
        const json = await res.json();
        setResult(json);
        // Mark as verified, then open the pass detail page (renders like /code).
        try {
          sessionStorage.setItem('ptp_verified_' + json.passport.uniqueCode, JSON.stringify(json.passport));
        } catch {
          /* ignore */
        }
        router.push('/' + json.passport.uniqueCode);
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors';

  if (result) {
    return (
      <div className="glass rounded-[20px] border border-slate-200/60 p-6">
        <div className="text-center">
          <div
            className={`mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
              result.valid
                ? 'border-green-500/30 bg-green-500/10 text-green-600'
                : 'border-red-500/30 bg-red-500/10 text-red-600'
            }`}
          >
            {result.valid ? '✓ Valid Pass' : '✗ Invalid Pass'}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{result.passport.fullName}</h2>
          <div className="my-4 space-y-1 font-mono text-2xl text-[#7a2fff]">{result.passport.uniqueCode}</div>
          <div className="space-y-1 text-sm text-slate-500">
            {result.passport.email && <div>📧 {result.passport.email}</div>}
            {result.passport.phone && <div>📱 {result.passport.phone}</div>}
            <div className="pt-2 text-slate-400">Created At</div>
            <div>{formatDate(result.passport.createdAt)}</div>
            <div className="pt-2 text-slate-400">Expiry Date</div>
            <div>{formatDate(result.passport.expiryDate)}</div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-[#7a2fff] hover:text-[#7a2fff]"
          >
            Check another pass
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Email or Phone Number
        </label>
        <input
          type="text"
          placeholder="you@example.com or +62812xxxxxxx"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className={`${inputBase} focus:border-[#7a2fff] focus:ring-[#7a2fff]/20 ${
            identifier && !identifierValid ? 'border-red-300' : ''
          }`}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Unique Code</label>
        <input
          type="text"
          placeholder="PTP-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          maxLength={14}
          className={`${inputBase} border-slate-300 font-mono uppercase focus:border-[#7a2fff] focus:ring-[#7a2fff]/20`}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !identifier || !code || !identifierValid}
        className="w-full rounded-xl bg-gradient-to-r from-[#7722ff] to-[#5d16da] py-3 font-bold text-white shadow-lg shadow-purple-700/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify Pass'}
      </button>
    </form>
  );
}

export default VerifyForm;