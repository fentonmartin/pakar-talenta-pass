/**
 * Environment configuration for Pakar Talenta Pass.
 * Resolves and validates all environment variables at startup.
 */

export interface AppConfig {
  // ┌─── Environment ───────────────────────────────────────────────────────
  nodeEnv: 'development' | 'production' | 'test';
  isDev: boolean;
  isProd: boolean;

  // ┌─── Database ──────────────────────────────────────────────────────────
  postgresUrl: string;

  // ┌─── Auth ──────────────────────────────────────────────────────────────
  jwtSecret: string;
  jwtExpiresIn: string;
  adminPasswordHash: string;
  totpSecret: string;
  totpIssuer: string;

  // ┌─── Mail ─────────────────────────────────────────────────────────────
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpFromEmail: string;
  smtpFromName: string;

  // ┌─── Redis (for worker queue) ─────────────────────────────────────────
  redisUrl: string;

  // ┌─── URLs ───────────────────────────────────────────────────────────────
  baseUrl: string;
  passDomain: string;
  appName: string;

  // ┌─── Rate limiting ─────────────────────────────────────────────────────
  rateLimitWindowMs: number;
  rateLimitMax: number;

  // ┌─── Session ───────────────────────────────────────────────────────────
  sessionMaxAge: number;
}

const REQUIRED_VARS = [
  'POSTGRES_URL',
  'JWT_SECRET',
  'ADMIN_PASSWORD_HASH',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
] as const;

/**
 * Validates that all required environment variables are set.
 * Throws a descriptive error listing any missing variables.
 */
function validateEnv(vars: readonly string[]): void {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Copy .env.example and fill in the required values.`
    );
  }
}

/**
 * Security floor — ensures critical settings are never insecure in production.
 */
function clampSecurityFloor(config: Partial<AppConfig>): AppConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as AppConfig['nodeEnv'];
  const isDev = nodeEnv === 'development';
  const isProd = nodeEnv === 'production';

  // In production, JWT secret must be at least 32 chars
  const jwtSecret = config.jwtSecret ?? process.env.JWT_SECRET ?? '';
  if (isProd && jwtSecret.length < 32) {
    throw new Error('Security floor: JWT_SECRET must be >= 32 chars in production');
  }

  // In production, SMTP must use encryption
  const smtpPort = config.smtpPort ?? process.env.SMTP_PORT ?? '587';
  if (isProd && smtpPort !== '465' && smtpPort !== '587') {
    throw new Error('Security floor: SMTP_PORT must be 465 (TLS) or 587 (STARTTLS) in production');
  }

  return {
    nodeEnv,
    isDev,
    isProd,
    postgresUrl: config.postgresUrl ?? process.env.POSTGRES_URL ?? '',
    jwtSecret: jwtSecret,
    jwtExpiresIn: config.jwtExpiresIn ?? process.env.JWT_EXPIRES_IN ?? '7d',
    adminPasswordHash: config.adminPasswordHash ?? process.env.ADMIN_PASSWORD_HASH ?? '',
    totpSecret: config.totpSecret ?? process.env.TOTP_SECRET ?? '',
    totpIssuer: config.totpIssuer ?? process.env.TOTP_ISSUER ?? 'Pakar Talenta Pass',
    smtpHost: config.smtpHost ?? process.env.SMTP_HOST ?? '',
    smtpPort,
    smtpUser: config.smtpUser ?? process.env.SMTP_USER ?? '',
    smtpPass: config.smtpPass ?? process.env.SMTP_PASS ?? '',
    smtpFromEmail: config.smtpFromEmail ?? process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? '',
    smtpFromName: config.smtpFromName ?? process.env.SMTP_FROM_NAME ?? 'Pakar Talenta Pass',
    redisUrl: config.redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379',
    baseUrl: config.baseUrl ?? process.env.BASE_URL ?? 'http://localhost:3000',
    passDomain: config.passDomain ?? process.env.PASS_DOMAIN ?? 'pass.pakartalenta.co.id',
    appName: config.appName ?? process.env.APP_NAME ?? 'Pakar Talenta Pass',
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
    sessionMaxAge: Number(process.env.SESSION_MAX_AGE ?? 7 * 24 * 60 * 60 * 1000),
  };
}

let cachedConfig: AppConfig | null = null;

/**
 * Loads and validates configuration from environment variables.
 * Caches the result for the lifetime of the process.
 */
export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  validateEnv(REQUIRED_VARS);
  cachedConfig = clampSecurityFloor({});
  return cachedConfig;
}

/** Resets the cached config (useful for tests). */
export function resetConfig(): void {
  cachedConfig = null;
}
