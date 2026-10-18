import { getDb } from '@/app/lib/db';
import { passportPasses } from '@pakar-talenta/db';
import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/passes/code/[code] — Fetch a passport by its unique_code.
 * Used by the public pass detail page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const db = getDb();

    const [passport] = await db
      .select()
      .from(passportPasses)
      .where(eq(passportPasses.uniqueCode, sql`${code}`))
      .limit(1);

    if (!passport) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    return NextResponse.json({ passport });
  } catch (err) {
    console.error('Code lookup failed:', err);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}
