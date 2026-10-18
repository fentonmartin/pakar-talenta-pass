import { describe, it, expect, vi } from 'vitest';
import {
  hashPassword,
  comparePassword,
  createSession,
  verifySession,
  totpGenerate,
  totpVerify,
  generateTotpSecret,
  extractBearerToken,
  checkSession,
} from './index';

// Set env vars before any auth config is read
vi.stubEnv('JWT_SECRET', 'test-secret-key-for-testing-only-1234567890');
vi.stubEnv('TOTP_SECRET', 'JBSWY3DPEHPK3PXP');
vi.stubEnv('ADMIN_PASSWORD_HASH', '');
vi.stubEnv('TOTP_ISSUER', 'Pakar Talenta Pass');

describe('Password hashing', () => {
  it('hashes a password correctly', async () => {
    const hash = await hashPassword('mySecretPassword123');
    expect(hash).not.toBe('mySecretPassword123');
    expect(hash).toContain('$2b$');
  });

  it('compares correct password', async () => {
    const hash = await hashPassword('mySecretPassword123');
    expect(await comparePassword('mySecretPassword123', hash)).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('mySecretPassword123');
    expect(await comparePassword('wrongPassword', hash)).toBe(false);
  });
});

describe('JWT sessions', () => {
  it('generates a valid JWT token', () => {
    const token = createSession();
    expect(token).toContain('.');
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifies a valid token', () => {
    const token = createSession();
    const payload = verifySession(token);
    expect(payload).toBeTruthy();
    expect(payload!.role).toBe('admin');
    expect(payload!.mfaVerified).toBe(true);
  });

  it('rejects an invalid token', () => {
    const result = verifySession('invalid.token.here');
    expect(result).toBeNull();
  });
});

describe('TOTP', () => {
  it('generates a 6-digit code', () => {
    const code = totpGenerate('JBSWY3DPEHPK3PXP');
    expect(code).toMatch(/^[0-9]{6}$/);
  });

  it('verifies a correct TOTP code', () => {
    const code = totpGenerate('JBSWY3DPEHPK3PXP');
    expect(totpVerify(code, 'JBSWY3DPEHPK3PXP')).toBe(true);
  });

  it('rejects an incorrect TOTP code', () => {
    expect(totpVerify('000000', 'JBSWY3DPEHPK3PXP')).toBe(false);
  });

  it('generates a random secret', () => {
    const secret = generateTotpSecret();
    expect(secret.length).toBe(32);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });
});

describe('Bearer token extraction', () => {
  it('extracts token from valid header', () => {
    const token = extractBearerToken('Bearer eyJhbGciOiJIUzI1NiIs...');
    expect(token).toBe('eyJhbGciOiJIUzI1NiIs...');
  });

  it('returns null for missing header', () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('returns null for malformed header', () => {
    expect(extractBearerToken('Bearer')).toBeNull();
    expect(extractBearerToken('Basic abc')).toBeNull();
  });
});

describe('Session check', () => {
  it('returns valid when token is correct', () => {
    const token = createSession();
    const result = checkSession(`Bearer ${token}`);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when no token', () => {
    const result = checkSession(undefined);
    expect(result.valid).toBe(false);
  });
});
