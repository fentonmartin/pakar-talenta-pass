import {
  detectDeliveryMethod,
  normalizeEmail,
  normalizePhone,
  generateWaLink,
} from '@pakar-talenta/core';
import { sendInvitationEmail } from '@pakar-talenta/mail';
import { type NextRequest, NextResponse } from 'next/server';
import { createPassport, listPassports, isDemoMode } from '@/app/lib/demo-store';

/**
 * POST /api/passes — Create a new passport pass.
 * Body: { fullName: string, email?: string, phone?: string, expiryDays?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, validityDays = 365 } = body;

    if (!fullName || typeof fullName !== 'string') {
      return NextResponse.json({ error: 'fullName is required' }, { status: 400 });
    }

    const validEmail = email && isValidEmail(email) ? normalizeEmail(email) : undefined;
    const validPhone = phone && isValidPhone(phone) ? normalizePhone(phone) : undefined;

    if (!validEmail && !validPhone) {
      return NextResponse.json(
        { error: 'At least one valid contact method (email or phone) is required' },
        { status: 400 },
      );
    }

    const passport = await createPassport({
      fullName,
      email: validEmail,
      phone: validPhone,
      validityDays,
    });

    // Detect delivery method and simulate delivery in real mode only.
    const decision = detectDeliveryMethod(passport.email, passport.phone);

    if (!isDemoMode() && decision.deliverable && decision.channels.includes('email')) {
      const verifyUrl = `${process.env.BASE_URL}/verify?email=${encodeURIComponent(passport.email!)}&code=${passport.uniqueCode}`;
      let waLink: string | null = null;
      if (decision.channels.includes('whatsapp')) {
        waLink = generateWaLink(
          decision.recipients.whatsapp!,
          `Hi ${passport.fullName}, your Pakar Talenta Pass ${passport.uniqueCode} is ready. Verify at: ${verifyUrl}`,
        );
      }
      await sendInvitationEmail(passport, decision, verifyUrl, waLink);
    }

    return NextResponse.json({ passport }, { status: 201 });
  } catch (err) {
    console.error('Failed to create passport:', err);
    const message = err instanceof Error ? err.message : 'Failed to create passport';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/passes — List all passport passes.
 */
export async function GET() {
  try {
    const passes = await listPassports();
    return NextResponse.json({ passes });
  } catch (err) {
    console.error('Failed to list passes:', err);
    return NextResponse.json({ error: 'Failed to list passes' }, { status: 500 });
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^\d{8,15}$/.test(digits);
}