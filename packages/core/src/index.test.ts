import { describe, it, expect } from 'vitest';
import {
  generateUniqueCode,
  detectDeliveryMethod,
  generateWaLink,
  generateMailtoLink,
  isPassportValid,
  generatePassportData,
  normalizePhone,
  isValidEmail,
} from './index';

describe('generateUniqueCode', () => {
  it('generates code in PTP-XXXX-XXXX format', () => {
    const code = generateUniqueCode();
    expect(code).toMatch(/^PTP-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  });

  it('generates unique codes on each call', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateUniqueCode()));
    expect(codes.size).toBe(100);
  });

  it('allows custom segment count and length', () => {
    const code = generateUniqueCode({ segments: 3, segmentLength: 3 });
    expect(code).toMatch(/^PTP-[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{3}-[2-9A-HJ-NP-Z]{3}$/);
  });
});

describe('normalizePhone', () => {
  it('strips + prefix', () => {
    expect(normalizePhone('+6281234567890')).toBe('6281234567890');
  });

  it('converts 08xx to 62xx', () => {
    expect(normalizePhone('081234567890')).toBe('6281234567890');
  });

  it('passes through already-normalized numbers', () => {
    expect(normalizePhone('6281234567890')).toBe('6281234567890');
  });
});

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('detectDeliveryMethod', () => {
  it('returns disabled when no contact info', () => {
    const result = detectDeliveryMethod(undefined, undefined);
    expect(result.deliverable).toBe(false);
    expect(result.channels).toHaveLength(0);
    expect(result.reason).toBe('no_contact');
  });

  it('detects email-only delivery', () => {
    const result = detectDeliveryMethod('user@example.com', undefined);
    expect(result.deliverable).toBe(true);
    expect(result.channels).toEqual(['email']);
    expect(result.recipients.email).toBe('user@example.com');
    expect(result.reason).toBe('email');
  });

  it('detects WhatsApp-only delivery', () => {
    const result = detectDeliveryMethod(undefined, '6281234567890');
    expect(result.deliverable).toBe(true);
    expect(result.channels).toEqual(['whatsapp']);
    expect(result.recipients.whatsapp).toBe('6281234567890');
    expect(result.reason).toBe('phone');
  });

  it('detects both channels when both present', () => {
    const result = detectDeliveryMethod('user@example.com', '6281234567890');
    expect(result.deliverable).toBe(true);
    expect(result.channels).toContain('email');
    expect(result.channels).toContain('whatsapp');
    expect(result.reason).toBe('both');
  });

  it('strips + prefix from phone number', () => {
    const result = detectDeliveryMethod(undefined, '+6281234567890');
    expect(result.recipients.whatsapp).toBe('6281234567890');
  });
});

describe('generateWaLink', () => {
  it('generates correct wa.me URL with message', () => {
    const msg = 'Hi John, your pass code is PTP-7K9F-QX2M';
    const link = generateWaLink('+6281234567890', msg);
    expect(link).toContain('https://wa.me/6281234567890');
    expect(link).toContain(encodeURIComponent(msg));
  });

  it('encodes special characters in message', () => {
    const link = generateWaLink('6281234567890', 'Hello & goodbye');
    expect(link).toContain('Hello%20%26%20goodbye');
  });

  it('throws on invalid phone', () => {
    expect(() => generateWaLink('not-a-phone', 'hello')).toThrow(TypeError);
  });
});

describe('generateMailtoLink', () => {
  it('generates mailto with subject and body', () => {
    const link = generateMailtoLink('user@example.com', 'Subject', 'Line 1\nLine 2');
    expect(link).toContain('mailto:user@example.com');
    expect(link).toContain('subject=');
    expect(link).toContain('body=');
    expect(link).toContain('%0A');
  });

  it('throws on invalid email', () => {
    expect(() => generateMailtoLink('not-an-email', 'Subject', 'Body')).toThrow(TypeError);
  });
});

describe('isPassportValid', () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  const past = new Date(Date.now() - 86400000).toISOString();

  it('returns true for active passport with future expiry', () => {
    const result = isPassportValid({ status: 'active', expiryDate: future });
    expect(result.valid).toBe(true);
    expect(result.reason).toBe('valid');
  });

  it('returns false when null', () => {
    const result = isPassportValid(null);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('no passport provided');
  });

  it('returns false when expired', () => {
    const result = isPassportValid({ status: 'active', expiryDate: past });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('expired');
  });

  it('returns false when revoked', () => {
    const result = isPassportValid({ status: 'revoked', expiryDate: future });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('revoked');
  });
});

describe('generatePassportData', () => {
  it('generates full passport data object', () => {
    const data = generatePassportData({
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+6281234567890',
      validityDays: 365,
    });

    expect(data.fullName).toBe('John Doe');
    expect(data.email).toBe('john@example.com');
    expect(data.phone).toBe('6281234567890'); // + stripped
    expect(data.status).toBe('active');
    expect(data.expiryDate).toBeInstanceOf(Date);
    expect(data.uniqueCode).toMatch(/^PTP-/);
  });

  it('requires fullName', () => {
    expect(() => generatePassportData({ fullName: '' })).toThrow('fullName is required');
  });

  it('requires at least one contact method', () => {
    expect(() => generatePassportData({ fullName: 'John Doe' })).toThrow(
      'at least one valid contact method'
    );
  });

  it('defaults validityDays to 365', () => {
    const data = generatePassportData({ fullName: 'John Doe', email: 'john@example.com' });
    const days = Math.round((data.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(days).toBeCloseTo(365, 0);
  });

  it('accepts a custom code', () => {
    const data = generatePassportData({
      fullName: 'John Doe',
      email: 'john@example.com',
      code: 'PTP-CUSTOM-CODE',
    });
    expect(data.uniqueCode).toBe('PTP-CUSTOM-CODE');
  });
});
