import Link from 'next/link';
import { BrandLogo } from '@/app/components/BrandLogo';
import { PassCard } from '@/app/components/PassCard';
import { Footer } from '@/app/components/Footer';
import { listPassports } from '@/app/lib/demo-store';

export default async function HomePage() {
  // Show a real pass so the sample actually resolves. Uses the data layer
  // (PostgreSQL in production, in-memory dataset in demo mode).
  const all = await listPassports();
  const demoPass = all.find((p) => p.status === 'active');

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-5xl flex-col items-center px-6 py-16 text-center">
        {/* Brand */}
        <BrandLogo height={56} />

        {/* Headline */}
        <h1 className="mt-10 text-4xl font-extrabold tracking-tight text-[#002060] md:text-6xl">
          Pakar Talenta Pass
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
          Every holder is immediately recognized as a vetted professional worthy of
          premium, invitation-only access to closed networks, high-value introductions,
          and members-only experiences.
        </p>

        {/* Demo pass card (premium navy) — links to a real, resolvable pass page */}
        {demoPass && (
          <div className="mt-12 w-full max-w-md">
            <Link
              href={`/${demoPass.uniqueCode}`}
              className="block cursor-pointer transition-transform hover:-translate-y-1"
            >
              <PassCard
                fullName={demoPass.fullName}
                uniqueCode={demoPass.uniqueCode}
                expiryDate={demoPass.expiryDate}
                className="w-full"
              />
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/verify"
            className="gold-bg inline-flex items-center justify-center rounded-xl px-8 py-3 font-semibold text-white shadow-lg shadow-red-950/30 transition hover:opacity-90"
          >
            Verify Your Pass
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-8 py-3 font-semibold text-slate-700 transition hover:border-[#7a2fff] hover:text-[#7a2fff]"
          >
            Admin Console
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}