import { getDb } from '@/app/lib/db';
import { passportPasses, deliveryLog } from '@pakar-talenta/db';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

/**
 * GET /api/stats — Returns passport statistics for the admin dashboard.
 */
export async function GET() {
  try {
    const db = getDb();

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(passportPasses);
    const activeResult = await db.select({ count: sql<number>`count(*)` }).from(passportPasses).where(eq(passportPasses.status, 'active'));
    const expiredResult = await db.select({ count: sql<number>`count(*)` }).from(passportPasses).where(eq(passportPasses.status, 'expired'));
    const revokedResult = await db.select({ count: sql<number>`count(*)` }).from(passportPasses).where(eq(passportPasses.status, 'revoked'));
    const pendingDeliveryResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveryLog)
      .where(eq(deliveryLog.status, 'pending'));

    return NextResponse.json({
      total: Number(totalResult[0]?.count ?? 0),
      active: Number(activeResult[0]?.count ?? 0),
      expired: Number(expiredResult[0]?.count ?? 0),
      revoked: Number(revokedResult[0]?.count ?? 0),
      pendingDelivery: Number(pendingDeliveryResult[0]?.count ?? 0),
    });
  } catch (err) {
    console.error('Stats query failed:', err);
    return NextResponse.json(
      { total: 0, active: 0, expired: 0, revoked: 0, pendingDelivery: 0 },
      { status: 500 }
    );
  }
}
