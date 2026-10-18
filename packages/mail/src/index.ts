import { createTransport, type Transporter, type SendMailOptions } from 'nodemailer';
import type { PassportPass } from '@pakar-talenta/db';
import type { DeliveryDecision } from '@pakar-talenta/core';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

/** Resolves SMTP configuration from environment variables. */
export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? '';
  
  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be set');
  }

  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME ?? 'Pakar Talenta Pass',
  };
}

let _transporter: Transporter | null = null;

/** Lazily creates a Nodemailer transporter, reusing the instance. */
export function getTransporter(): Transporter {
  if (!_transporter) {
    const config = getSmtpConfig();
    _transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }
  return _transporter;
}

// ┌─── Email templates ────────────────────────────────────────────────────

/** Renders the invitation email body for a passport. */
export function renderInvitationEmail(
  passport: PassportPass,
  waLink: string | null,
  verifyUrl: string,
): string {
  const expiryDate = new Date(passport.expiryDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const waButton = waLink
    ? `<a href="${waLink}" style="display:inline-block;background:#D9B742;color:#11182C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Open in WhatsApp</a>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Your Pakar Talenta Pass</title>
<style>
  body { font-family: 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 40px; }
  .container { max-width: 600px; margin: 0 auto; background: rgba(17,24,44,0.7); border: 1px solid rgba(217,183,66,0.3); border-radius: 16px; padding: 32px; }
  .header { text-align: center; margin-bottom: 32px; }
  .logo { font-size: 24px; font-weight: 700; color: #D9B742; letter-spacing: 2px; }
  .code { font-family: monospace; font-size: 24px; letter-spacing: 4px; color: #ffffff; background: rgba(17,24,44,0.5); padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0; }
  .button { display: inline-block; background: #D9B742; color: #11182C; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; margin: 16px 0; }
  .wa-button { ${waButton ? '' : 'display:none;'} }
  .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; }
  .divider { height: 1px; background: rgba(217,183,66,0.2); margin: 24px 0; }
</style></head><body>
<div class="container">
  <div class="header">
    <div class="logo">Pakar Talenta Pass</div>
  </div>
  <h2 style="color:#ffffff;">Welcome, ${passport.fullName}!</h2>
  <p>Your exclusive access pass is ready. Use the code below to verify your credentials:</p>
  <div class="code">${passport.uniqueCode}</div>
  <p style="text-align:center;">Expires: <strong style="color:#D9B742;">${expiryDate}</strong></p>
  <div style="text-align:center; margin: 24px 0;">
    <a href="${verifyUrl}" class="button">Verify Your Pass</a>
  </div>
  ${waButton}
  <div class="divider"></div>
  <p style="font-size:14px;">This pass is tied to: ${passport.email ? passport.email : passport.phone}</p>
  <p class="footer">© 2025 Pakar Talenta Pass. All rights reserved.</p>
</div>
</body></html>`;
}

/** Renders plaintext version for email clients that don't support HTML. */
export function renderInvitationText(
  passport: PassportPass,
  verifyUrl: string,
): string {
  return `Your Pakar Talenta Pass — ${passport.uniqueCode}

Name: ${passport.fullName}
Expiry: ${new Date(passport.expiryDate).toISOString()}
Status: ${passport.status}

Verify your pass: ${verifyUrl}

Contact: ${passport.email ?? passport.phone ?? 'N/A'}`;
}

/** Renders a resend notification email. */
export function renderResendEmail(
  passport: PassportPass,
  waLink: string | null,
  verifyUrl: string,
): string {
  return renderInvitationEmail(passport, waLink, verifyUrl);
}

// ┌─── Sender ──────────────────────────────────────────────────────────────

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an email via SMTP. Returns a result object — never throws.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<SendResult> {
  try {
    const config = getSmtpConfig();
    const transporter = getTransporter();
    const options: SendMailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
      text,
    };
    const info = await transporter.sendMail(options);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sends a passport invitation email with both HTML and plaintext versions.
 */
export async function sendInvitationEmail(
  passport: PassportPass,
  decision: DeliveryDecision,
  verifyUrl: string,
  waLink: string | null,
): Promise<SendResult> {
  const recipient = decision.recipients.email ?? '';
  if (!recipient) return { success: false, error: 'No email recipient' };

  const html = renderInvitationEmail(passport, waLink, verifyUrl);
  const text = renderInvitationText(passport, verifyUrl);

  return sendEmail(
    recipient,
    `Your Pakar Talenta Pass – ${passport.uniqueCode}`,
    html,
    text,
  );
}
