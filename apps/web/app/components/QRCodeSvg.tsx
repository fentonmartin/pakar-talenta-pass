import React from 'react';

/**
 * Renders a matrix as an SVG QR-style code.
 * In production, this would use the Project Nayuki qrcodegen library
 * to generate the actual matrix. For now, renders a placeholder pattern.
 */
export function QRCodeSvg({ value = 'PTP-XXXX-XXXX', size = 8 }: {
  value?: string;
  size?: number;
  className?: string;
}) {
  // Generate a deterministic pseudo-random pattern from the value
  // This simulates a QR code — replace with nayuki qrcodegen for real use
  const matrix: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    matrix[y] = [];
    for (let x = 0; x < size; x++) {
      const seed = (x * 7 + y * 13 + value.length * 3) % 2;
      matrix[y][x] = seed === 1;
    }
  }

  const cellSize = 4;
  const svgSize = size * cellSize;
  const gap = svgSize * 0.1;

  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      className="text-surface-100"
      shapeRendering="pixelated"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Quiet zone / background */}
      <rect width={svgSize} height={svgSize} rx="4" className="fill-surface-50" />

      {/* Positioning pattern (top-left corner) */}
      <rect x={gap} y={gap} width={cellSize * 3} height={cellSize * 3} className="fill-surface-100" />
      <rect x={gap + cellSize} y={gap + cellSize} width={cellSize} height={cellSize} className="fill-surface-50" />
      {/* Positioning pattern (top-right) */}
      <rect x={gap + (size - 3) * cellSize} y={gap} width={cellSize * 3} height={cellSize * 3} className="fill-surface-100" />
      <rect x={gap + (size - 3) * cellSize + cellSize} y={gap + cellSize} width={cellSize} height={cellSize} className="fill-surface-50" />
      {/* Positioning pattern (bottom-left) */}
      <rect x={gap} y={gap + (size - 3) * cellSize} width={cellSize * 3} height={cellSize * 3} className="fill-surface-100" />
      <rect x={gap + cellSize} y={gap + (size - 3) * cellSize + cellSize} width={cellSize} height={cellSize} className="fill-surface-50" />

      {/* Data modules */}
      {matrix.map((row, y) =>
        row.map((bit, x) =>
          bit ? (
            <rect
              key={`${x}-${y}`}
              x={gap + x * cellSize}
              y={gap + y * cellSize}
              width={cellSize}
              height={cellSize}
              className="fill-surface-100"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default QRCodeSvg;
