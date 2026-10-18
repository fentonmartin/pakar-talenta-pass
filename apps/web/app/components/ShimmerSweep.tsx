import React from 'react';

export interface ShimmerEffectProps {
  /** Direction of the shimmer sweep. */
  direction?: 'left-to-right' | 'top-to-bottom';
  /** Animation duration in seconds. */
  duration?: number;
  /** Opacity of the shimmer effect. */
  intensity?: number;
  /** Children to apply the shimmer to. */
  children: React.ReactNode;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Wraps children with a shimmer sweep animation — the signature VIP
 * "light sweep" effect across embossed surfaces.
 */
export function ShimmerSweep({
  direction = 'left-to-right',
  duration = 3,
  intensity = 0.15,
  children,
  className = '',
}: ShimmerEffectProps) {
  const gradient =
    direction === 'left-to-right'
      ? 'linear-gradient(90deg,hsla(0,0%,100%,0) 0,rgba(255,255,255,0.4) 50%,hsla(0,0%,100%,0) 100%)'
      : 'linear-gradient(180deg,hsla(0,0%,100%,0) 0,rgba(255,255,255,0.3) 50%,hsla(0,0%,100%,0) 100%)';

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        '--shimmer-gradient': gradient,
        animation: `shimmer-${duration}s-infinite`,
      } as React.CSSProperties}
    >
      {children}
      <style jsx>{`
        @keyframes shimmer-${duration}s {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: gradient,
          animation: `shimmer-${duration}s ${duration}s infinite`,
          opacity: intensity,
        }}
      />
    </div>
  );
}

export default ShimmerSweep;
