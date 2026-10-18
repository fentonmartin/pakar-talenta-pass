import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-50 relative overflow-hidden">
      {/* Embossed texture background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.gold/5)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 container mx-auto px-6 py-16">
        <header className="text-center mb-16">
          <div className="inline-block text-gold font-mono text-sm tracking-[0.3em] mb-4">
            PAKAR TALENTA PASS
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Exclusive
            <span className="block text-gold gold-text">Access</span>
            <span className="block">Credential</span>
          </h1>
          <p className="text-surface-300 max-w-2xl mx-auto text-lg">
            Every holder is immediately recognized as a vetted professional
            worthy of premium, invitation-only access to closed networks,
            high-value introductions, and members-only experiences.
          </p>
        </header>

        {/* Demo Pass Card Preview */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="glass rounded-[20px] p-8 border border-gold/30">
            <div className="text-center">
              <div className="text-xs font-mono text-gold/60 uppercase tracking-[0.3em] mb-2">
                Sample Pass
              </div>
              <div className="font-mono text-3xl text-white mb-4 tracking-[0.2em]">
                PTP-7K9F-QX2M
              </div>
              <div className="text-sm text-surface-400 mb-4">
                Expires: 28 OCT '25  23:59 WIB  WED
              </div>
              <Link
                href="/verify"
                className="inline-block gold-bg text-surface-100 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Verify Your Pass
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="w-12 h-12 gold-bg rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-surface-50 font-bold">🔐</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Verified Access</h3>
            <p className="text-surface-400 text-sm">
              Each pass carries a unique code tied to the holder's verified credentials.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 gold-bg rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-surface-50 font-bold">📱</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Channel Delivery</h3>
            <p className="text-surface-400 text-sm">
              Delivers via email (SMTP) and WhatsApp deep links simultaneously.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 gold-bg rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-surface-50 font-bold">📊</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Full Audit Trail</h3>
            <p className="text-surface-400 text-sm">
              Every access is logged — who, when, and how the pass was used.
            </p>
          </div>
        </div>

        <footer className="text-center mt-16 text-surface-500 text-sm">
          <p>© 2025 Pakar Talenta Pass. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
