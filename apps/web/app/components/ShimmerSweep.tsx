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
 * Uses CSS keyframes from globals.css (no styled-jsx needed).
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
        background: gradient,
        opacity: intensity,
        animation: `shimmer ${duration}s infinite`,
      }}
    >
      {children}
    </div>
  );
}

export default ShimmerSweep;
