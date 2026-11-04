import Image from 'next/image';
import React from 'react';
import { formatDate } from '@/app/lib/format';

export interface PassCardProps {
  /** Full name displayed on the pass. */
  fullName: string;
  /** Unique access code (e.g. PTP-7K9F-QX2M). */
  uniqueCode: string;
  /** Expiry date displayed on the pass. */
  expiryDate: Date | string;
  /** Optional QR code value (usually the unique code). */
  qrValue?: string;
  /** Optional CSS class for sizing. */
  className?: string;
  /** Whether to show the shimmer animation. */
  shimmer?: boolean;
}

function formatExpiry(date: Date | string): string {
  // Consistent DD/MM/YYYY — no time, no weekday.
  return formatDate(date);
}

function generateMicrotext(): string {
  return 'CONFIDENTIAL • PREMIUM ACCESS • VERIFIED PROFESSIONAL • DO NOT DUPLICATE';
}

const microtextLines: string[] = Array.from({ length: 12 }, () => generateMicrotext());

/**
 * The signature premium pass card — deep navy, gold foil accents, white text,
 * the Pakar Talenta logo, shimmer sweep and angle-dependent microtext.
 */
export function PassCard({
  fullName,
  uniqueCode,
  expiryDate,
  qrValue: _qrValue,
  className = '',
  shimmer = true,
}: PassCardProps) {
  const expiry = formatExpiry(expiryDate);

  return (
    <div
      className={`
        relative isolate overflow-hidden rounded-[20px] p-8
        bg-gradient-to-b from-[#1b2550] via-[#121a3c] to-[#0a0e24]
        border-2 border-[#ffd700]/30
        shadow-gold-xl
        before:absolute before:inset-0 before:rounded-[20px]
        before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
        before:from-[#ffd700]/10 before:via-transparent before:to-transparent
        ${shimmer ? 'shimmer' : ''}
        ${className}
      `}
      style={{ perspective: '1200px' }}
    >
      {/* Embossed texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 30% 30%, rgba(0,0,0,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Metallic foil border glow */}
      <div className="absolute inset-0 rounded-[20px] shadow-inner-gold pointer-events-none" />

      {/* Gold micro-perforated edges */}
      <div className="absolute top-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent" />

      {/* Microtext layer */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-5"
        style={{ transform: 'rotateX(30deg)', transformStyle: 'preserve-3d' }}
      >
        {microtextLines.map((line, i) => (
          <div
            key={i}
            className="absolute text-[5px] font-mono text-white/30 whitespace-nowrap"
            style={{
              left: `${(i % 3) * 33}%`,
              top: `${(i * 8.3) % 100}%`,
              transform: 'rotate(-15deg)',
              opacity: 0.2,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Brand header */}
        <div className="mb-6 flex items-center justify-between">
          <Image
            src="/pakar-talenta-logo.png"
            alt="Pakar Talenta"
            width={666}
            height={302}
            priority
            draggable={false}
            style={{
              height: 26,
              width: 'auto',
              filter: 'brightness(0) invert(1)',
            }}
            className="opacity-90"
          />
          <span className="text-base font-semibold uppercase tracking-[0.18em] text-[#ffd700]">
            Premium Pass
          </span>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">{fullName}</h3>
          <div className="mx-auto mb-6 h-px w-12 bg-[#ffd700]/40" />

          <div className="mb-1 font-mono text-4xl font-bold tracking-[0.2em] text-white code-display">
            {uniqueCode}
          </div>
          <div className="font-mono text-xs text-white/50">
            Serial: {uniqueCode.replace(/-/g, '').slice(3, 11)}
          </div>
        </div>

        <div className="mt-8 border-t border-[#ffd700]/20 pt-6 text-center">
          <div className="mb-1 text-xs uppercase tracking-widest text-white/50">
            Valid Until
          </div>
          <div className="font-mono text-sm font-medium text-[#ffd700]">{expiry}</div>
        </div>
      </div>
    </div>
  );
}

export default PassCard;