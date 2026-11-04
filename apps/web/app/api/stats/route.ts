import { NextResponse } from 'next/server';
import { getStats, isDemoMode } from '@/app/lib/demo-store';

/**
 * GET /api/stats — Returns passport statistics for the admin dashboard.
 * Served from the demo store when DEMO_MODE is enabled (no database needed).
 */
export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('Stats query failed:', err);
    return NextResponse.json(
      { total: 0, active: 0, expired: 0, revoked: 0, pendingDelivery: 0 },
      { status: 500 },
    );
  }
}