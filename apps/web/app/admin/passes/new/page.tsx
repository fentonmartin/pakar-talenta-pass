'use client';

import { useState } from 'react';

/**
 * Admin — Create new pass form.
 * Collects full name, optional email, optional phone, and expiry duration.
 */
export default function CreatePassPage() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; code?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      fullName: formData.get('fullName')?.toString().trim(),
      email: formData.get('email')?.toString().trim() || undefined,
      phone: formData.get('phone')?.toString().trim() || undefined,
      expiryDays: parseInt(formData.get('expiryDays')?.toString() ?? '365', 10),
    };

    try {
      const res = await fetch('/api/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          message: 'Pass created successfully',
          code: json.passport?.uniqueCode,
        });
        form.reset();
      } else {
        setResult({ success: false, message: json.error || 'Failed to create pass' });
      }
    } catch (_err) {
      setResult({ success: false, message: 'Network error — try again' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Create New Pass</h1>
        <p className="text-surface-400 mt-1">Issue a new access pass to a vetted professional.</p>
      </div>

      {result && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            result.success
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {result.message}
          {result.code && <div className="mt-2 font-mono text-gold">{result.code}</div>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            required
            placeholder="John Doe"
            className="w-full px-4 py-3 bg-surface-100/10 border border-gold/20 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            placeholder="john@example.com"
            className="w-full px-4 py-3 bg-surface-100/10 border border-gold/20 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-gold/50 transition-colors"
          />
          <p className="text-xs text-surface-500 mt-1">
            Used for SMTP delivery. At least one contact method (email or WhatsApp) is required.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            WhatsApp Number
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="+62 812-3456-7890"
            className="w-full px-4 py-3 bg-surface-100/10 border border-gold/20 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:border-gold/50 transition-colors"
          />
          <p className="text-xs text-surface-500 mt-1">
            Indonesian number in +62 format. Will generate a wa.me link for delivery.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            Expiry (days)
          </label>
          <select
            name="expiryDays"
            defaultValue="365"
            className="w-full px-4 py-3 bg-surface-100/10 border border-gold/20 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors"
          >
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">365 days (default)</option>
            <option value="730">730 days (2 years)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full gold-bg text-surface-50 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating...' : 'Create Pass'}
        </button>
      </form>
    </div>
  );
}
