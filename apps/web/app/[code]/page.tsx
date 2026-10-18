import { notFound } from 'next/navigation';
import { QRCodeSvg } from '@/app/components/QRCodeSvg';
import { PassCard } from '@/app/components/PassCard';

interface PassportData {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  uniqueCode: string;
  expiryDate: string;
  status: string;
  createdAt: string;
}

async function fetchPassport(code: string): Promise<PassportData | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/passes/code/${code}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.passport ?? null;
  } catch {
    return null;
  }
}

/**
 * Public pass detail page — accessible to anyone with the unique code.
 * Shows the VIP pass with shimmer animation, QR code, and verification status.
 */
export default async function PassPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const passport = await fetchPassport(code.toUpperCase());

  if (!passport) {
    notFound();
  }

  const valid =
    passport.status === 'active' &&
    new Date(passport.expiryDate).getTime() > Date.now();

  return (
    <div className="min-h-screen bg-surface-50 relative overflow-hidden py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.gold/3)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-xs font-mono text-gold/60 uppercase tracking-[0.3em] mb-2">
              Pakar Talenta Pass
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              valid
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {valid ? '✓ Valid Access' : '✗ Inactive'}
            </div>
          </div>

          {/* Pass Card */}
          <div className="mb-8">
            <PassCard
              fullName={passport.fullName}
              uniqueCode={passport.uniqueCode}
              expiryDate={passport.expiryDate}
              qrValue={passport.uniqueCode}
              className="w-full max-w-md mx-auto"
            />
          </div>

          {/* QR Code + Details */}
          <div className="glass rounded-[20px] p-6 border border-gold/30 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-gold/60 uppercase tracking-[0.3em] mb-1">
                  Unique Code
                </div>
                <div className="font-mono text-2xl text-white">{passport.uniqueCode}</div>
              </div>
              <div className="flex-shrink-0">
                <QRCodeSvg value={passport.uniqueCode} size={12} />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="glass rounded-[20px] p-6 border border-gold/30">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gold/60 uppercase tracking-wider">Holder</span>
                <div className="text-white font-medium">{passport.fullName}</div>
              </div>
              {passport.email && (
                <div>
                  <span className="text-xs text-gold/60 uppercase tracking-wider">Email</span>
                  <div className="text-white">{passport.email}</div>
                </div>
              )}
              {passport.phone && (
                <div>
                  <span className="text-xs text-gold/60 uppercase tracking-wider">WhatsApp</span>
                  <div className="text-white">{passport.phone}</div>
                </div>
              )}
              <div>
                <span className="text-xs text-gold/60 uppercase tracking-wider">Expiry</span>
                <div className="text-gold font-mono">
                  {new Date(passport.expiryDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div>
                <span className="text-xs text-gold/60 uppercase tracking-wider">Status</span>
                <div className={`font-mono text-sm ${
                  passport.status === 'active' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {passport.status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
