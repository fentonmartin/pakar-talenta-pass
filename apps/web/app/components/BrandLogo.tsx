import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  /** Link destination; omit to render a plain mark (no anchor). */
  href?: string;
  /** Height of the logo image in px. */
  height?: number;
  /** Optional dark surface variant (prefers a light chip behind the logo). */
  className?: string;
}

/**
 * Pakar Talenta brand lockup.
 *
 * The real site mark is dark-red on transparent, so it sits on a white "chip"
 * to stay legible against the app's deep navy surfaces. A red "PASS" badge
 * signals this is the credential product.
 */
export function BrandLogo({ href, height = 28, className = '' }: BrandLogoProps) {
  const lockup = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex items-center justify-center rounded-l-xl bg-white px-2 py-1">
        <Image
          src="/pakar-talenta-logo.png"
          alt="Pakar Talenta"
          width={666}
          height={302}
          style={{ height: height, width: 'auto' }}
          draggable={false}
          priority
        />
      </span>
      <span className="rounded-lg bg-gradient-to-br from-[#820303] to-[#fc2828] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white shadow-lg shadow-red-950/40">
        Pass
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {lockup}
      </Link>
    );
  }
  return lockup;
}

export default BrandLogo;