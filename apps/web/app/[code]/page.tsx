import { notFound } from 'next/navigation';
import { BrandLogo } from '@/app/components/BrandLogo';
import { PassCard } from '@/app/components/PassCard';
import { PassDetailsGate } from '@/app/components/PassDetailsGate';
import { Footer } from '@/app/components/Footer';

export const dynamic = 'force-dynamic';

interface PublicPassport {
  id: string;
  fullName: string;
  uniqueCode: string;
  expiryDate: string;
  status: string;
}

async function fetchPublicPassport(code: string): Promise<PublicPassport | null> {
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

/** Masks a full name publicly, e.g. "Rizky Aditya" → "R**** A*****". */
function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0) + '*'.repeat(w.length - 1))
    .join(' ');
}

/**
 * Public pass detail page.
 *
 * The card + validity status are public, but the holder's private details are
 * locked until the visitor confirms the holder's email/phone. (To see the full
 * details, use the /verify flow.)
 */
export default async function PassPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const passport = await fetchPublicPassport(code.toUpperCase());

  if (!passport) {
    notFound();
  }

  const valid =
    passport.status === 'active' &&
    new Date(passport.expiryDate).getTime() > Date.now();

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <BrandLogo height={44} />
          </div>
          <div
            className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
              valid
                ? 'border-green-500/30 bg-green-50 text-green-600'
                : 'border-red-500/30 bg-red-50 text-red-600'
            }`}
          >
            {valid ? '✓ Valid Access' : '✗ Inactive'}
          </div>
        </div>

        {/* Premium pass card — name masked until unlocked */}
        <div className="mb-10">
          <PassCard
            fullName={maskName(passport.fullName)}
            uniqueCode={passport.uniqueCode}
            expiryDate={passport.expiryDate}
            className="w-full max-w-md mx-auto"
          />
        </div>

        {/* Gated details — unlocked with holder's email/phone */}
        <PassDetailsGate code={passport.uniqueCode} />
      </main>

      <Footer />
    </div>
  );
}