import { randomInt } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { passportPasses, schema, type NewPassportPass, type PassportPass } from '@pakar-talenta/db';

import type { DeliveryDecision, GeneratePassportDataInput, PassportValidityInput } from './types';

export type {
  DeliveryChannel,
  DeliveryDecision,
  DeliveryReason,
  GeneratePassportDataInput,
  PassportValidityInput,
  ReusableLinkType,
} from './types';

/** Prefix applied to every generated access code. */
export const CODE_PREFIX = 'PTP';

/**
 * Ambiguous characters (`0`, `O`, `1`, `I`, `L`) are omitted so codes survive
 * being read aloud or transcribed by hand.
 */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const CODE_SEGMENTS = 2;
const CODE_SEGMENT_LENGTH = 4;
const DEFAULT_VALIDITY_DAYS = 365;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A Drizzle client bound to the Pakar Talenta schema. Callers that already own
 * a connection (for example the web app) can inject theirs instead of using the
 * lazily created default below.
 */
export type CoreDatabase = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let database: CoreDatabase | undefined;

/**
 * Lazily creates a pooled Drizzle client from `POSTGRES_URL` (or
 * `DATABASE_URL`). The pool is reused for the lifetime of the process.
 */
export function getDatabase(): CoreDatabase {
  if (!database) {
    const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL (or DATABASE_URL) must be set to verify passports');
    }
    pool = new Pool({ connectionString });
    database = drizzle(pool, { schema });
  }
  return database;
}

/** Closes the shared pool, if one was opened. Useful for scripts and tests. */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    database = undefined;
  }
}

/**
 * Generates a cryptographically random access code such as `PTP-7K9F-QX2M`.
 *
 * Uses `crypto.randomInt`, which draws uniform values from the platform CSPRNG,
 * so codes are unpredictable without any ledger, hashing chain or other
 * heavyweight machinery. With the default 8 characters from a 31-symbol
 * alphabet there are roughly 1.1 in 10^12 collisions, which is why callers
 * should still rely on the unique constraint on `passport_passes.unique_code`.
 */
export function generateUniqueCode(
  options: { segments?: number; segmentLength?: number } = {},
): string {
  const segments = options.segments ?? CODE_SEGMENTS;
  const segmentLength = options.segmentLength ?? CODE_SEGMENT_LENGTH;
  if (!Number.isInteger(segments) || segments < 1) {
    throw new RangeError('segments must be a positive integer');
  }
  if (!Number.isInteger(segmentLength) || segmentLength < 1) {
    throw new RangeError('segmentLength must be a positive integer');
  }

  const parts: string[] = [];
  for (let s = 0; s < segments; s += 1) {
    let part = '';
    for (let i = 0; i < segmentLength; i += 1) {
      part += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    parts.push(part);
  }
  return `${CODE_PREFIX}-${parts.join('-')}`;
}

/**
 * Normalizes a phone number to digits in international form (no `+`).
 * Indonesian local numbers (`08xx`) and bare mobile prefixes (`8xx`) are
 * converted to the `62` country code.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

/** Normalizes an email address for storage and comparison. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Loose phone check: 8-15 digits after normalization. */
export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return /^\d{8,15}$/.test(digits);
}

/** Loose email check: one `@`, a dot in the domain, no whitespace. */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * Decides how a passport should reach its owner based on the contact details
 * available. When both email and phone are present, BOTH channels are returned
 * so the caller can send SMTP email **and** surface a WhatsApp link.
 * Never throws — an undeliverable result is returned instead.
 */
export function detectDeliveryMethod(
  email?: string | null,
  phone?: string | null,
): DeliveryDecision {
  const rawPhone = typeof phone === 'string' ? phone.trim() : '';
  const rawEmail = typeof email === 'string' ? email.trim() : '';

  const hasPhone = rawPhone !== '' && isValidPhone(rawPhone);
  const hasEmail = rawEmail !== '' && isValidEmail(rawEmail);

  if (hasPhone && hasEmail) {
    return {
      deliverable: true,
      channels: ['email', 'whatsapp'],
      recipients: {
        email: normalizeEmail(rawEmail),
        whatsapp: normalizePhone(rawPhone),
      },
      reason: 'both',
    };
  }

  if (hasPhone) {
    return {
      deliverable: true,
      channels: ['whatsapp'],
      recipients: { whatsapp: normalizePhone(rawPhone) },
      reason: 'phone',
    };
  }

  if (hasEmail) {
    return {
      deliverable: true,
      channels: ['email'],
      recipients: { email: normalizeEmail(rawEmail) },
      reason: 'email',
    };
  }

  return {
    deliverable: false,
    channels: [],
    recipients: {},
    reason: 'no_contact',
  };
}

/** Builds a `https://wa.me` link that opens WhatsApp with `message` pre-filled. */
export function generateWaLink(phone: string, message: string): string {
  if (!isValidPhone(phone)) {
    throw new TypeError(`generateWaLink: invalid phone number "${phone}"`);
  }
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

/** Builds a `mailto:` link with the given subject and body. */
export function generateMailtoLink(email: string, subject: string, body: string): string {
  if (!isValidEmail(email)) {
    throw new TypeError(`generateMailtoLink: invalid email address "${email}"`);
  }
  return `mailto:${normalizeEmail(email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

/**
 * Checks whether a passport is valid (status='active' and expiry in the future).
 * Returns an object with a `valid` boolean and a human-readable `reason`.
 */
export function isPassportValid(
  passport: PassportValidityInput | null | undefined,
): { valid: boolean; reason: string } {
  if (!passport) return { valid: false, reason: 'no passport provided' };
  if (passport.status !== 'active') return { valid: false, reason: `status is ${passport.status}` };
  const expiry =
    passport.expiryDate instanceof Date
      ? passport.expiryDate
      : new Date(passport.expiryDate);
  if (Number.isNaN(expiry.getTime())) return { valid: false, reason: 'invalid expiry date' };
  if (expiry.getTime() <= Date.now()) return { valid: false, reason: 'expired' };
  return { valid: true, reason: 'valid' };
}

/** Adds a whole number of days to a date, returning a new `Date`. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Prepares an insertable `passport_passes` record: normalizes the supplied
 * contact details, generates an access code when none was given and stamps an
 * expiry date. Validates what the database cannot (at least one usable contact
 * method, a name, a sane validity window).
 */
export function generatePassportData(input: GeneratePassportDataInput): NewPassportPass {
  const fullName = input.fullName?.trim();
  if (!fullName) {
    throw new Error('generatePassportData: fullName is required');
  }

  const email = input.email && isValidEmail(input.email) ? normalizeEmail(input.email) : null;
  const phone = input.phone && isValidPhone(input.phone) ? normalizePhone(input.phone) : null;

  if (!detectDeliveryMethod(email, phone).deliverable) {
    throw new Error(
      'generatePassportData: at least one valid contact method (email or phone) is required',
    );
  }

  const validityDays = input.validityDays ?? DEFAULT_VALIDITY_DAYS;
  if (!Number.isFinite(validityDays) || validityDays <= 0) {
    throw new RangeError('generatePassportData: validityDays must be a positive number');
  }

  const expiryDate = input.expiryDate
    ? new Date(input.expiryDate)
    : addDays(new Date(), validityDays);
  if (Number.isNaN(expiryDate.getTime())) {
    throw new TypeError('generatePassportData: expiryDate is not a valid date');
  }

  return {
    fullName,
    email,
    phone,
    uniqueCode: input.code?.trim() || generateUniqueCode(),
    expiryDate,
    status: input.status ?? 'active',
  };
}

/** Options for {@link verifyPassport}. */
export interface VerifyPassportOptions {
  /** Inject an existing client instead of the shared default. */
  db?: CoreDatabase;
}

/**
 * Looks up a passport by access code and confirms it belongs to the given
 * identifier. `phoneOrEmail` may be either an email address or a phone number
 * (any common format); matching is normalized and case-insensitive.
 *
 * Returns the matching passport row, or `null` when the code is unknown or the
 * identifier does not match.
 */
export async function verifyPassport(
  phoneOrEmail: string,
  code: string,
  options: VerifyPassportOptions = {},
): Promise<PassportPass | null> {
  const identifier = phoneOrEmail?.trim() ?? '';
  const uniqueCode = code?.trim().toUpperCase() ?? '';
  if (!identifier || !uniqueCode) return null;

  const db = options.db ?? getDatabase();
  const [passport] = await db
    .select()
    .from(passportPasses)
    .where(eq(passportPasses.uniqueCode, uniqueCode))
    .limit(1);

  if (!passport) return null;

  if (identifier.includes('@')) {
    if (!passport.email) return null;
    return normalizeEmail(passport.email) === normalizeEmail(identifier) ? passport : null;
  }

  if (!passport.phone) return null;
  return normalizePhone(passport.phone) === normalizePhone(identifier) ? passport : null;
}
