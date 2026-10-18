import { getDb } from '@/app/lib/db';
import { verifyPassport, isPassportValid } from '@pakar-talenta/core';
import { type NextRequest, NextResponse } from 'next/server';

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
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Direct verification using core function
    const passport = await verifyPassport(identifier, code, { db });

    if (!passport) {
      return NextResponse.json(
        { error: 'Invalid code or identifier' },
        { status: 404 }
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
