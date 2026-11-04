import { type NextRequest, NextResponse } from 'next/server';
import { createPassport } from '@/app/lib/demo-store';

/**
 * POST /api/passes/bulk — Bulk import multiple passes at once.
 * Body: { passes: Array<{ fullName, email?, phone?, expiryDate? }> }
 * Each row needs a valid fullName and at least one contact (email or phone).
 * Returns per-row results so partial failures don't block the rest.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const passes = Array.isArray(body?.passes) ? body.passes : [];

    if (passes.length === 0) {
      return NextResponse.json({ error: 'passes is required' }, { status: 400 });
    }

    const results: Array<Record<string, unknown>> = [];

    for (const p of passes) {
      try {
        const created = await createPassport({
          fullName: p.fullName,
          email: p.email || undefined,
          phone: p.phone || undefined,
          expiryDate: p.expiryDate || undefined,
        });
        results.push({
          ok: true,
          fullName: created.fullName,
          email: created.email,
          phone: created.phone,
          uniqueCode: created.uniqueCode,
          expiryDate: created.expiryDate,
        });
      } catch (err) {
        results.push({
          ok: false,
          fullName: p.fullName,
          error: err instanceof Error ? err.message : 'Failed to create',
        });
      }
    }

    const created = results.filter((r) => r.ok).length;
    const failed = results.length - created;

    return NextResponse.json({ created, failed, results });
  } catch (err) {
    console.error('Bulk import failed:', err);
    return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 });
  }
}