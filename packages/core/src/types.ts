import type { PassportStatus } from '@pakar-talenta/db';

/**
 * Channel a passport can be delivered over. Mirrors the `delivery_channel`
 * enum in the database schema.
 */
export type DeliveryChannel = 'email' | 'whatsapp';

/** Why a delivery decision landed on one or more channels. */
export type DeliveryReason = 'phone' | 'email' | 'both' | 'no_contact';

/** Kind of reusable shortcut link generated for a passport. */
export type ReusableLinkType = 'wa' | 'mailto';

/**
 * Outcome of inspecting the contact details attached to a passport.
 *
 * When both email and phone are available, BOTH channels are returned so the
 * caller can send an email via SMTP **and** surface a WhatsApp link. A decision
 * is always returned (never thrown) so callers can branch their logic normally.
 */
export interface DeliveryDecision {
  /** Whether a delivery can be attempted at all. */
  deliverable: boolean;
  /** Channels to deliver over; empty when neither contact method is usable. */
  channels: DeliveryChannel[];
  /** Normalized recipients keyed by channel. */
  recipients: { email?: string; whatsapp?: string };
  /** Which contact detail(s) the decision was based on. */
  reason: DeliveryReason;
}

/**
 * Minimal passport shape needed to evaluate validity. Kept structural so both
 * database rows and freshly prepared records can be checked.
 */
export interface PassportValidityInput {
  status: PassportStatus;
  expiryDate: Date | string | number;
}

/** Input accepted by {@link generatePassportData}. */
export interface GeneratePassportDataInput {
  /** Professional's display name. Required. */
  fullName: string;
  /** Optional email address; invalid values are dropped. */
  email?: string | null;
  /** Optional phone number in any local or international format. */
  phone?: string | null;
  /** Pre-generated access code, when one already exists. */
  code?: string;
  /** Explicit expiry; takes precedence over `validityDays`. */
  expiryDate?: Date | string | number;
  /** How long the passport stays valid, in days. Defaults to 365. */
  validityDays?: number;
  /** Initial lifecycle status. Defaults to `active`. */
  status?: PassportStatus;
}
