'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VerificationResult {
  passport: {
    fullName: string;
    uniqueCode: string;
    email?: string;
    phone?: string;
    expiryDate: string;
    status: string;
  };
  valid: boolean;
}

/**
 * Public verification portal.
 * Users enter their email OR phone + unique code to check pass validity.
 */
export default function VerifyPage() {
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-focus code input when identifier is filled
  const [identifierValid, setIdentifierValid] = useState(false);

  useEffect(() => {
    const looksLikeEmail = identifier.includes('@');
    const digitsOnly = identifier.replace(/\D/g, '');
    setIdentifierValid(
      (looksLikeEmail && identifier.includes('.')) ||
      (digitsOnly.length >= 8 && digitsOnly.length <= 15)
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
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-xs font-mono text-gold/60 uppercase tracking-[0.3em] mb-2">
            Pakar Talenta Pass
          </div>
          <h1 className="text-2xl font-bold text-white">Verify Your Pass</h1>
          <p className="text-surface-400 text-sm mt-2">
            Enter your email or phone number and unique code
          </p>
        </div>

        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Email or Phone Number
              </label>
              <input
                type="text"
                placeholder="you@example.com or +62812xxxxxxx"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className={`w-full px-4 py-3 bg-surface-100/10 border rounded-xl text-white placeholder-surface-500 focus:outline-none transition-colors ${
                  identifier
                    ? identifierValid
                      ? 'border-green-500/50 focus:border-green-500/70'
                      : 'border-red-500/50 focus:border-red-500/70'
                    : 'border-gold/20 focus:border-gold/50'
                }`}
              />
              {identifier && !identifierValid && (
                <p className="text-red-400 text-xs mt-1">
                  Enter a valid email or phone number
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Unique Code
              </label>
              <input
                type="text"
                placeholder="PTP-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                maxLength={14}
                className="w-full px-4 py-3 bg-surface-100/10 border border-gold/20 rounded-xl text-white font-mono placeholder-surface-500 focus:outline-none focus:border-gold/50 transition-colors uppercase"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !code || !identifierValid}
              className="w-full gold-bg text-surface-50 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Pass'}
            </button>
          </form>
        )}

        {result && (
          <div className="glass rounded-[20px] p-6 border border-gold/30 mt-6">
            <div className="text-center">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  result.valid
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {result.valid ? '✓ Valid Pass' : '✗ Invalid Pass'}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {result.passport.fullName}
              </h2>
              <div className="font-mono text-2xl text-gold my-4">
                {result.passport.uniqueCode}
              </div>
              <div className="text-sm text-surface-400 space-y-1">
                {result.passport.email && <div>📧 {result.passport.email}</div>}
                {result.passport.phone && <div>📱 {result.passport.phone}</div>}
                <div>
                  📅 Expires:{' '}
                  {new Date(result.passport.expiryDate).toLocaleDateString('id-ID')}
                </div>
                <div>📊 Status: {result.passport.status}</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-surface-400 hover:text-gold transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
