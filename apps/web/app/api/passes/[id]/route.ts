import { getDb } from '@/app/lib/db';
import { passportPasses } from '@pakar-talenta/db';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/passes/[id] — Get a single passport pass.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const [passport] = await db
      .select()
      .from(passportPasses)
      .where(eq(passportPasses.id, id))
      .limit(1);

    if (!passport) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    return NextResponse.json({ passport });
  } catch (err) {
    console.error('Failed to fetch passport:', err);
    return NextResponse.json({ error: 'Failed to fetch passport' }, { status: 500 });
  }
}

/**
 * PUT /api/passes/[id] — Update a passport pass.
 * Body: { status?: 'active' | 'expired' | 'revoked', expiryDate?: Date }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, expiryDate } = body;

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (expiryDate) updates.expiryDate = new Date(expiryDate);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(passportPasses)
      .set(updates)
      .where(eq(passportPasses.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    return NextResponse.json({ passport: updated });
  } catch (err) {
    console.error('Failed to update passport:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/**
 * DELETE /api/passes/[id] — Revoke (soft delete) a passport pass.
 */
export async function DELETE(
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
    console.error('Failed to revoke passport:', err);
    return NextResponse.json({ error: 'Failed to revoke' }, { status: 500 });
  }
}
