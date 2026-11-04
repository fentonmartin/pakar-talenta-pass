import { NextResponse } from 'next/server';
import { listPassports } from '@/app/lib/demo-store';
import { formatDate } from '@/app/lib/format';

function esc(v: unknown): string {
  const s = v == null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * GET /api/passes/export — Download all passes as CSV.
 */
export async function GET() {
  try {
    const passes = await listPassports();
    const header = ['Code', 'Name', 'Email', 'Phone', 'Created', 'Expires', 'Status'];
    const lines = [
      header.map(esc).join(','),
      ...passes.map((p) =>
        [
          p.uniqueCode,
          p.fullName,
          p.email ?? '',
          p.phone ?? '',
          formatDate(p.createdAt),
          formatDate(p.expiryDate),
          p.status,
        ]
          .map(esc)
          .join(','),
      ),
    ];
    const csv = '\uFEFF' + lines.join('\n'); // BOM so Excel reads UTF-8 correctly

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="pakar-talenta-passes.csv"',
      },
    });
  } catch (err) {
    console.error('Export failed:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}