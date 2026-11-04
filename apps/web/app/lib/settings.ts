/**
 * Runtime app settings store.
 *
 * Persists admin-overridable configuration (admin password hash, SMTP) to
 * `data/settings.json` (git-ignored). Values here take precedence over the
 * matching environment variables, so admin can change their password / SMTP
 * without editing `.env` or restarting.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface SmtpSettings {
  host?: string;
  port?: number | string;
  user?: string;
  pass?: string;
  fromEmail?: string;
  fromName?: string;
  secure?: boolean;
}

export interface AppSettings {
  adminPasswordHash?: string;
  smtp?: SmtpSettings;
}

const FILE = path.join(process.cwd(), 'data', 'settings.json');

let cache: AppSettings | null = null;

function readRaw(): string {
  try {
    return fs.readFileSync(FILE, 'utf8');
  } catch {
    return '{}';
  }
}

function load(): AppSettings {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(readRaw()) as AppSettings;
    cache = (parsed && typeof parsed === 'object' ? parsed : {}) as AppSettings;
  } catch {
    cache = {};
  }
  return cache;
}

function persist(next: AppSettings): void {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(next, null, 2), 'utf8');
  } catch {
    /* non-fatal */
  }
}

export function getSettings(): AppSettings {
  return load();
}

/** Updates part of the settings and persists. */
export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const current = load();
  const next: AppSettings = {
    ...current,
    ...(patch.adminPasswordHash !== undefined ? { adminPasswordHash: patch.adminPasswordHash } : {}),
    ...(patch.smtp ? { smtp: { ...current.smtp, ...patch.smtp } } : {}),
  };
  persist(next);
  cache = next;
  return next;
}

/** Effective admin password hash — persisted override, then env. */
export function getAdminPasswordHash(): string | null {
  const fromSettings = load().adminPasswordHash;
  return fromSettings || process.env.ADMIN_PASSWORD_HASH || null;
}

/** Effective SMTP config — persisted override merged over env. */
export function getSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
} {
  const s = load().smtp ?? {};
  const ports = Number(s.port ?? process.env.SMTP_PORT ?? '587');

  const tlsFrom = process.env.SMTP_SECURE === 'true' || (!process.env.SMTP_SECURE && ports === 465);
  return {
    host: s.host || process.env.SMTP_HOST || '',
    port: Number.isFinite(ports) ? ports : 587,
    user: s.user || process.env.SMTP_USER || '',
    pass: s.pass || process.env.SMTP_PASS || '',
    from: s.fromEmail || process.env.SMTP_FROM || process.env.SMTP_USER || '',
    secure: typeof s.secure === 'boolean' ? s.secure : tlsFrom,
  };
}

/**
 * Mirrors the effective SMTP config back into env vars so the mail package
 * (which reads env) also honours a persisted SMTP override.
 */
export function syncSmtpEnv(): void {
  if (!load().smtp) return; // no override → nothing to sync
  const cfg = getSmtpConfig();
  process.env.SMTP_HOST = cfg.host;
  process.env.SMTP_PORT = String(cfg.port);
  process.env.SMTP_USER = cfg.user;
  process.env.SMTP_PASS = cfg.pass;
  process.env.SMTP_FROM = cfg.from;
  process.env.SMTP_FROM_EMAIL = cfg.from;
  process.env.SMTP_SECURE = String(cfg.secure);
}