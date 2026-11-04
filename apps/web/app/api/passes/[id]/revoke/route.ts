import { type NextRequest, NextResponse } from 'next/server';
import { updatePassportStatus } from '@/app/lib/demo-store';

/**
 * POST /api/passes/[id]/revoke — Revoke a passport pass.
 * Sets status to 'revoked' (soft delete).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const revoked = await updatePassportStatus(id, 'revoked');
    if (!revoked) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }
    return NextResponse.json({ passport: revoked });
  } catch (err) {
    console.error('Revocation failed:', err);
    return NextResponse.json({ error: 'Revocation failed' }, { status: 500 });
  }
}