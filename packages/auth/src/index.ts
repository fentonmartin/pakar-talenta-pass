/**
 * Authentication and session management for Pakar Talenta Pass admin console.
 * Provides JWT-based sessions, bcrypt password hashing, and TOTP 2FA.
 */
import { compare, hash } from 'bcryptjs';
import { createHmac } from 'node:crypto';

/** Role assigned to every admin session. */
export const ADMIN_ROLE = 'admin' as const;

/** Payload embedded in the signed session JWT. */
export interface SessionPayload {
  id: string;
  role: typeof ADMIN_ROLE;
  createdAt: number;
  /** 2FA was verified at session creation. */
  mfaVerified: boolean;
}

/** Configuration resolved from environment variables. */
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  /** bcrypt hash of the admin password (set at deploy time). */
  adminPasswordHash: string;
  /** Base32 secret for TOTP 2FA. */
  totpSecret: string;
  /** Human-readable issuer shown in authenticator apps. */
  totpIssuer: string;
}

/** Reads auth configuration from the environment. */
export function getAuthConfig(): AuthConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }

  return {
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
    totpSecret: process.env.TOTP_SECRET ?? '',
    totpIssuer: process.env.TOTP_ISSUER ?? 'Pakar Talenta Pass',
  };
}

const CACHE_TTL_MS = 30_000;

let cachedConfig: { config: AuthConfig; ts: number } | undefined;

/** Returns cached config, refetching when the cache TTL expires. */
export function authConfig(): AuthConfig {
  const now = Date.now();
  if (!cachedConfig || now - cachedConfig.ts > CACHE_TTL_MS) {
    cachedConfig = { config: getAuthConfig(), ts: now };
  }
  return cachedConfig.config;
}

// ─── Password hashing ─────────────────────────────────────────────────────

/**
 * Hashes a password with bcrypt using a work factor of 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return compare(password, hash);
}

// ─── TOTP (RFC 6238) ──────────────────────────────────────────────────────

/**
 * Generates a random base32 secret suitable for TOTP enrollment.
 * Uses the standard alphabet C/DISABLED-F for compatibility.
 */
export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes).slice(0, 32);
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let accum = 0;
  let result = '';
  for (const byte of bytes) {
    accum = (accum << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[(accum >> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    result += BASE32_ALPHABET[(accum << (5 - bits)) & 0x1f];
  }
  return result;
}

const BASE32_LOOKUP = new Map<string, number>();
for (let i = 0; i < BASE32_ALPHABET.length; i++) {
  BASE32_LOOKUP.set(BASE32_ALPHABET[i], i);
  BASE32_LOOKUP.set(BASE32_ALPHABET[i].toLowerCase(), i);
}

function base32Decode(encoded: string): Uint8Array {
  const clean = encoded.replace(/[^A-Z2-7]/gi, '').toUpperCase();
  const bytes: number[] = [];
  let accum = 0;
  let bitsLeft = 0;

  for (const char of clean) {
    const val = BASE32_LOOKUP.get(char);
    if (val === undefined) continue;
    accum = (accum << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((accum >> bitsLeft) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

/**
 * Computes a TOTP code for the given secret and time window.
 * Accepts the standard base32 secret format.
 */
export function totpGenerate(
  secret: string,
  timeWindow?: number,
): string {
  const epoch = timeWindow ?? Math.floor(Date.now() / 1000 / 30);
  return totpCodeAt(secret, epoch);
}

/**
 * Generates a TOTP code from a decoded counter value.
 */
function totpCodeAt(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  let temp = counter;
  for (let i = msg.length - 1; i >= 0; i--) {
    msg[i] = temp & 0xff;
    temp >>>= 8;
  }

  const hmac = createHmac('sha1', Buffer.from(key));
  hmac.update(msg);
  const digest = new Uint8Array(hmac.digest());

  const offset = digest[19] & 0x0f;
  const binary =
    ((digest[offset] & 0x3f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (binary % 1_000_000).toString().padStart(6, '0');
  return otp;
}

/**
 * Verifies a TOTP code against the secret, allowing a ±1 time-window tolerance.
 */
export function totpVerify(token: string, secret: string): boolean {
  const current = totpGenerate(secret);
  const prev = totpGenerate(secret, Math.floor(Date.now() / 1000 / 30) - 1);
  const next = totpGenerate(secret, Math.floor(Date.now() / 1000 / 30) + 1);
  return token === current || token === prev || token === next;
}

/**
 * Returns a standard otpauth:// URI for QR-code enrollment in authenticator apps.
 */
export function createTotpUri(secret: string, _account: string): string {
  const config = authConfig();
  const encoded = encodeURIComponent(secret);
  const params = `issuer=${encodeURIComponent(config.totpIssuer)}`;
  return `otpauth://totp/${encoded}&issuer=${config.totpIssuer}&secret=${secret}&${params}`;
}

// ┌─── JWT Sessions ────────────────────────────────────────────────────────┐

import { sign, verify } from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

/**
 * Creates a signed JWT session token for an admin.
 * Requires that MFA was already verified.
 */
export function createSession(): string {
  const config = authConfig();
  const payload: SessionPayload = {
    id: ADMIN_ROLE,
    role: ADMIN_ROLE,
    createdAt: Date.now(),
    mfaVerified: true,
  };
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}` };
  return sign(payload, config.jwtSecret, options);
}

/**
 * Verifies a JWT session token. Returns the decoded payload or null.
 */
export function verifySession(token: string): SessionPayload | null {
  try {
    const config = authConfig();
    return verify(token, config.jwtSecret) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Full admin authentication flow: verify password + TOTP, return session token.
 * Returns null if either step fails.
 *
 * If no TOTP secret is configured in the environment, only the password
 * is checked (TOTP becomes mandatory once a secret is set).
 */
export async function authenticateAdmin(
  password: string,
  totpCode?: string,
): Promise<string | null> {
  const config = authConfig();

  // Step 1: Verify password
  if (!config.adminPasswordHash) {
    return null;
  }
  if (!(await comparePassword(password, config.adminPasswordHash))) {
    return null;
  }

  // Step 2: Verify TOTP (if configured — mandatory when secret exists)
  if (config.totpSecret) {
    if (!totpCode || !totpVerify(totpCode, config.totpSecret)) {
      return null;
    }
  }

  // Step 3: Issue session token
  return createSession();
}

// ┌─── Express/Next.js middleware helpers ──────────────────────────────────┐

/**
 * Extracts a Bearer token from an Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(
  authHeader: string | undefined,
): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Verifies a request is authenticated as an admin.
 * Pass the result to your framework's redirect logic.
 */
export function checkSession(
  authHeader: string | undefined,
): { valid: true; session: SessionPayload } | { valid: false } {
  const token = extractBearerToken(authHeader);
  if (!token) return { valid: false };

  const session = verifySession(token);
  if (!session) return { valid: false };

  if (session.role !== ADMIN_ROLE) return { valid: false };

  return { valid: true, session };
}
