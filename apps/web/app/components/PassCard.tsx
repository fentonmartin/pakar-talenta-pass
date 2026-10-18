import React from 'react';

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

const WEEKS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function formatExpiry(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()];
  const year = d.getFullYear().toString().slice(-2);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dow = WEEKS[d.getDay()];
  return `${day} ${month} '${year}  ${hh}:${mm} WIB  ${dow}`;
}

function generateMicrotext(): string {
  // Deterministic microtext visible at certain angles
  return 'CONFIDENTIAL • PREMIUM ACCESS • VERIFIED PROFESSIONAL • DO NOT DUPLICATE';
}

const microtextLines: string[] = Array.from({ length: 12 }, () => generateMicrotext());

/**
 * The signature VIP pass card with embossed textures, metallic foil,
 * shimmer sweep animation, and angle-dependent microtext.
 *
 * Uses layered CSS gradients + blend modes to simulate the physical
 * metallic foil effect. The shimmer runs via CSS animation.
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
        bg-gradient-to-b from-surface-100/5 to-surface-50/10
        border-2 border-gold/30
        shadow-gold-xl
        before:absolute before:inset-0 before:rounded-[20px]
        before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
        before:from-gold/5 before:via-transparent before:to-transparent
        ${shimmer ? 'shimmer' : ''}
        ${className}
      `}
      style={{
        perspective: '1200px',
      }}
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

      {/* Micro-perforated edges (top + bottom strips) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      {/* Microtext layer — only visible at certain angles */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-5"
        style={{
          transform: 'rotateX(30deg)',
          transformStyle: 'preserve-3d',
        }}
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
        <div className="mb-6">
          <div className="text-xs font-mono text-gold/60 uppercase tracking-widest">
            Pakar Talenta
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{fullName}</h3>
          <div className="w-12 h-px bg-gold/30" />
        </div>

        <div className="my-8">
          <div className="text-xs text-surface-400 uppercase tracking-[0.3em] mb-2">
            PASS
          </div>
          <div className="text-4xl font-mono text-white font-bold tracking-[0.2em] mb-1 code-display">
            {uniqueCode}
          </div>
          <div className="text-xs font-mono text-surface-400/60">
            Serial: {uniqueCode.replace(/-/g, '').slice(3, 11)}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gold/20">
          <div className="text-xs text-surface-400/70 uppercase tracking-widest mb-1">
            Valid Until
          </div>
          <div className="font-mono text-gold text-sm">
            {expiry}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PassCard;
