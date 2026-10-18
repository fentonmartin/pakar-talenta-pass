import { getDb } from '@/app/lib/db';
import { passportPasses } from '@pakar-talenta/db';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/passes/[id]/revoke — Revoke a passport pass.
 * Sets status to 'revoked' (soft delete).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [revoked] = await db
      .update(passportPasses)
      .set({ status: 'revoked' })
      .where(eq(passportPasses.id, id))
      .returning();

    if (!revoked) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    return NextResponse.json({ passport: revoked });
  } catch (err) {
    console.error('Revocation failed:', err);
    return NextResponse.json({ error: 'Revocation failed' }, { status: 500 });
  }
}
