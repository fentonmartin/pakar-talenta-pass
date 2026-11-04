import { type NextRequest, NextResponse } from 'next/server';
import { verifyPassport, isPassportValid } from '@/app/lib/demo-store';

/**
 * POST /api/verify — Verify a passport by email/phone + unique code.
 * Body: { identifier: string (email or phone), code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, code } = body;

    if (!identifier || !code) {
      return NextResponse.json(
        { error: 'identifier and code are required' },
        { status: 400 },
      );
    }

    const passport = await verifyPassport(identifier, code);

    if (!passport) {
      return NextResponse.json(
        { error: 'Invalid code or identifier' },
        { status: 404 },
      );
    }

    const valid = isPassportValid(passport);

    return NextResponse.json({
      passport: {
        id: passport.id,
        fullName: passport.fullName,
        email: passport.email,
        phone: passport.phone,
        uniqueCode: passport.uniqueCode,
        expiryDate: passport.expiryDate,
        status: passport.status,
        createdAt: passport.createdAt,
      },
      valid: valid.valid,
      reason: valid.reason,
    });
  } catch (err) {
    console.error('Verification failed:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}