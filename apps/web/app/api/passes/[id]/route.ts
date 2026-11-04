import { type NextRequest, NextResponse } from 'next/server';
import {
  getPassport,
  updatePassportStatus,
  updatePassportExpiryDate,
} from '@/app/lib/demo-store';

/**
 * GET /api/passes/[id] — Get a single passport pass.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const passport = await getPassport(id);
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, expiryDate } = body;

    const existing = await getPassport(id);
    if (!existing) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    let updated = existing;
    if (status && ['active', 'expired', 'revoked'].includes(status)) {
      updated = (await updatePassportStatus(id, status))!;
    }
    if (expiryDate) {
      updated = (await updatePassportExpiryDate(id, new Date(expiryDate)))!;
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
    console.error('Failed to revoke passport:', err);
    return NextResponse.json({ error: 'Failed to revoke' }, { status: 500 });
  }
}