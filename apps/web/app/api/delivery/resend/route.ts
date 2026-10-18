import { getDb } from '@/app/lib/db';
import { passportPasses } from '@pakar-talenta/db';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { detectDeliveryMethod, generateWaLink, generateMailtoLink } from '@pakar-talenta/core';

/**
 * POST /api/delivery/resend — Re-trigger delivery for a passport.
 * Body: { passportId: string }
 * Returns the delivery decision (wa.me links, email status).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passportId } = body;

    if (!passportId) {
      return NextResponse.json({ error: 'passportId is required' }, { status: 400 });
    }

    const db = getDb();
    const [passport] = await db
      .select()
      .from(passportPasses)
      .where(eq(passportPasses.id, passportId))
      .limit(1);

    if (!passport) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    const decision = detectDeliveryMethod(passport.email, passport.phone);

    if (!decision.deliverable) {
      return NextResponse.json(
        { passport, decision, error: 'No valid contact method for delivery' },
        { status: 400 }
      );
    }

    const verifyUrl = `${process.env.BASE_URL}/verify?email=${encodeURIComponent(passport.email ?? '')}&code=${passport.uniqueCode}`;

    let waLink: string | null = null;
    let mailtoLink: string | null = null;

    if (decision.channels.includes('whatsapp')) {
      waLink = generateWaLink(
        decision.recipients.whatsapp!,
        `Hi ${passport.fullName}, your Pakar Talenta Pass ${passport.uniqueCode} is ready. Verify at: ${verifyUrl}`
      );
    }

    if (decision.channels.includes('email')) {
      mailtoLink = generateMailtoLink(
        decision.recipients.email!,
        `Your Pakar Talenta Pass — ${passport.uniqueCode}`,
        `Hi ${passport.fullName},\n\nYour Pakar Talenta Pass is ready.\nUnique Code: ${passport.uniqueCode}\nExpiry: ${new Date(passport.expiryDate).toDateString()}\n\nVerify at: ${verifyUrl}`
      );
    }

    return NextResponse.json({
      passport,
      decision,
      links: { waLink, mailtoLink, verifyUrl },
    });
  } catch (err) {
    console.error('Resend delivery failed:', err);
    return NextResponse.json({ error: 'Resend failed' }, { status: 500 });
  }
}
