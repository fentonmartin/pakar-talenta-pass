'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandonReport } from '../lib/brandon/types';

export default function BrandonPage() {
  const [chatText, setChatText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BrandonReport | null>(null);
  const router = useRouter();

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch('/api/brandon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rawText: chatText.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || 'Analysis failed');
      }

      const data = await response.json();
      setReport(data.report);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message || 'Analysis failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-[#002060] mb-4">
          What Brandon Thinks
        </h1>
        <p className="text-slate-500 mb-8">
          Paste a WhatsApp or iMessage chat export to get an AI-powered analysis
          of relationship dynamics.
        </p>

        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}

        {loading && (
          <div className="mb-4 text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 mx-auto border-b-2 border-[#7a2fff]"></div>
            <span>Analyzing...</span>
          </div>
        )}

        {!loading && !error && !report && (
          <textarea
            onChange={(e) => setChatText(e.target.value)}
            value={chatText}
            className="w-full bg-white border border-slate-300 text-slate-900 p-4 rounded-xl resize-none min-h-[200px] focus:outline-none focus:border-[#7a2fff] focus:ring-2 focus:ring-[#7a2fff]/20"
            placeholder="Paste your chat export here (WhatsApp: Export chat > Without media, or iMessage TXT)..."
            rows={8}
          />
        )}

        {report && (
          <div className="mt-6 glass rounded-[20px] p-6 border border-slate-200/70">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Next Question</h2>
            <p className="text-[#7a2fff] font-medium break-all">{report.nextQuestion.question}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 gold-bg py-2 px-4 text-white rounded-xl font-bold"
            >
              New Analysis
            </button>
          </div>
        )}

        <button
          onClick={analyze}
          className="w-full gold-bg py-3 text-white rounded-xl font-bold hover:opacity-90 transition-opacity mt-6"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Chat'}
        </button>
      </div>
    </div>
  );
}