import Link from 'next/link';
import { BrandLogo } from '@/app/components/BrandLogo';
import { VerifyForm } from '@/app/components/VerifyForm';
import { Footer } from '@/app/components/Footer';

/**
 * Public verification portal.
 * Fill in the holder's email/phone + unique code → shows the pass detail
 * with the verified status.
 */
export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex justify-center">
              <BrandLogo height={44} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-[#002060]">Verify Your Pass</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your email or phone number and unique code
            </p>
          </div>

          <VerifyForm />

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-slate-500 transition hover:text-[#7a2fff]">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}