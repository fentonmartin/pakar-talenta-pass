import { type NextRequest, NextResponse } from 'next/server';
import { getPassportByCode } from '@/app/lib/demo-store';

/**
 * GET /api/passes/code/[code] — Fetch a passport by its unique_code.
 *
 * Used by the public pass detail page. Returns only the PUBLIC fields
 * (name, code, expiry, status); the private details are only returned by
 * /api/verify after the holder's email/phone is confirmed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const passport = await getPassportByCode(code);
    if (!passport) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }
    return NextResponse.json({
      passport: {
        id: passport.id,
        fullName: passport.fullName,
        uniqueCode: passport.uniqueCode,
        expiryDate: passport.expiryDate,
        status: passport.status,
      },
    });
  } catch (err) {
    console.error('Code lookup failed:', err);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}