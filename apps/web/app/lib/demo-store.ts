/**
 * Passport data access — a single interface for both demo and production.
 *
 * - `DEMO_MODE !== 'false'` (default): serves an in-memory seeded dataset,
 *   persisted to `.demo-data.json` so edits survive reloads. No database.
 * - `DEMO_MODE === 'false'`: queries the real PostgreSQL database
 *   (`POSTGRES_URL`) via Drizzle, mirroring the same interface.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  generateUniqueCode,
  normalizeEmail,
  normalizePhone,
  addDays,
  detectDeliveryMethod,
  type PassportValidityInput,
} from '@pakar-talenta/core';
import type { PassportPass, PassportStatus } from '@pakar-talenta/db';
import { getDb } from '@/app/lib/db';
import { passportPasses, deliveryLog, auditLog } from '@pakar-talenta/db';
import { and, desc, eq, ilike, sql, type SQL } from 'drizzle-orm';

export const DEMO_MODE = process.env.DEMO_MODE !== 'false';

export interface PassportSummary {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  pendingDelivery: number;
}

export interface CreatePassportInput {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  validityDays?: number;
  expiryDate?: Date | string | number;
}

const CACHE_FILE = path.join(process.cwd(), '.demo-data.json');

/** Days are relative to "now" so the dataset always looks current and real. */
interface SeedEntry {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  code: string; // fixed, stable code so the card + verification always agree
  createdDaysAgo: number;
  expiresInDays?: number; // how many days the pass is valid from creation
  status: PassportStatus;
}

const SEED: SeedEntry[] = [
  // ── Active members (majority) ─────────────────────────────────────────
  { fullName: 'Rizky Aditya Pratama', email: 'rizky.aditya@techwijaya.id', phone: '+6281234567890', code: 'PTP-RZDY-7K9F', createdDaysAgo: 2, expiresInDays: 363, status: 'active' },
  { fullName: 'Sari Kartika Dewi', email: 'sari.kartika@gmail.com', phone: '+6281298765432', code: 'PTP-SRKT-4M2Q', createdDaysAgo: 5, expiresInDays: 300, status: 'active' },
  { fullName: 'Budi Santoso Wijaya', email: 'budi.santoso@finansialnusantara.com', phone: '+6281380011223', code: 'PTP-BDSN-9X3F', createdDaysAgo: 9, expiresInDays: 356, status: 'active' },
  { fullName: 'Anisa Rahmawati', email: 'anisa.rahmawati@studioarta.co.id', phone: '+6282112233445', code: 'PTP-ANSZ-QT7P', createdDaysAgo: 12, expiresInDays: 250, status: 'active' },
  { fullName: 'Dimas Anggara Putra', email: 'dimas.putra@logistix.id', phone: '+6287789012345', code: 'PTP-DMSP-2HV8', createdDaysAgo: 15, expiresInDays: 320, status: 'active' },
  { fullName: 'Maya Anggreni Sitorus', email: 'maya.sitorus@medika.digital', phone: '+6285644556677', code: 'PTP-MYAS-5GJ2', createdDaysAgo: 18, expiresInDays: 275, status: 'active' },
  { fullName: 'Fajar Nugroho Permana', email: 'fajar.nugroho@propertikita.com', phone: '+6282223456789', code: 'PTP-FJRP-WD4K', createdDaysAgo: 21, expiresInDays: 180, status: 'active' },
  { fullName: 'Citra Ayu Lestari', email: 'citra.ayu@eduwisata.id', phone: '+6285955566778', code: 'PTP-CTRL-8BYH', createdDaysAgo: 24, expiresInDays: 340, status: 'active' },
  { fullName: 'Hendra Gunawan', email: 'hendra.gunawan@energialam.co.id', phone: '+6281231112223', code: 'PTP-HNDG-X6CV', createdDaysAgo: 28, expiresInDays: 90, status: 'active' },
  { fullName: 'Nadia Berliana', email: 'nadia.berliana@gmail.com', phone: '+6281388899000', code: 'PTP-NDBL-3KQ7', createdDaysAgo: 31, expiresInDays: 200, status: 'active' },
  { fullName: 'Rangga Mahesa', email: 'rangga.mahesa@kreatifmedia.id', phone: '+6282112345678', code: 'PTP-RNGM-JZ5N', createdDaysAgo: 35, expiresInDays: 160, status: 'active' },
  { fullName: 'Fitri Handayani', email: 'fitri.handayani@bankansuri.co.id', phone: '+6285644889900', code: 'PTP-FTRH-9LW2', createdDaysAgo: 40, expiresInDays: 365, status: 'active' },
  { fullName: 'Andre Prakoso', email: 'andre.prakoso@teknoinovatif.id', phone: '+6287799988776', code: 'PTP-ANDR-U4SM', createdDaysAgo: 46, expiresInDays: 120, status: 'active' },
  // ── Expiring soon (active, < 7 days left) ─────────────────────────────
  { fullName: 'Lina Marlina', email: 'lina.marlina@retailerjuara.id', phone: '+6282311122233', code: 'PTP-LNMR-B7TC', createdDaysAgo: 358, expiresInDays: 6, status: 'active' },
  // ── Expired ───────────────────────────────────────────────────────────
  { fullName: 'Tono Haryanto', email: 'tono.haryanto@olddomain.com', phone: '+6281288887766', code: 'PTP-TNHR-5PDJ', createdDaysAgo: 400, expiresInDays: 365, status: 'expired' },
  { fullName: 'Yulia Anggraeni', email: 'yulia.angg@contoh.co.id', phone: '+6285700011223', code: 'PTP-YLAG-R8VS', createdDaysAgo: 500, expiresInDays: 365, status: 'expired' },
  // ── Revoked ───────────────────────────────────────────────────────────
  { fullName: 'Gunawan Cahyadi', email: 'gunawan.cahyadi@kasus.id', phone: '+6281288777666', code: 'PTP-GNWC-WKX3', createdDaysAgo: 90, expiresInDays: 275, status: 'revoked' },
  { fullName: 'Ratna Puspita', email: 'ratna.puspita@duplikat.net', phone: '+6281322233444', code: 'PTP-RTNP-2YH9', createdDaysAgo: 150, expiresInDays: 215, status: 'revoked' },
];

// ─── Demo (in-memory) backing ────────────────────────────────────────────────

function seedPassport(entry: SeedEntry): PassportPass {
  const createdAt = addDays(new Date(), -entry.createdDaysAgo);
  const expiryDate = addDays(createdAt, entry.expiresInDays ?? 365);
  return {
    id: randomUUID(),
    fullName: entry.fullName,
    email: entry.email ? normalizeEmail(entry.email) : null,
    phone: entry.phone ? normalizePhone(entry.phone) : null,
    uniqueCode: entry.code,
    expiryDate,
    createdAt,
    status: entry.status,
  };
}

function isRecord(r: unknown): r is Record<string, unknown> {
  return !!r && typeof r === 'object';
}

function loadFresh(): PassportPass[] {
  return SEED.map(seedPassport);
}

/** Loads the store from disk, seeding it on first run. */
function load(): PassportPass[] {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const parsed: unknown[] = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed) || parsed.length === 0) return loadFresh();
    return parsed
      .map((entry) => {
        if (!isRecord(entry)) return null;
        const r = entry as PassportPass & { expiryDate: string; createdAt: string };
        return {
          id: r.id,
          fullName: r.fullName,
          email: r.email ?? null,
          phone: r.phone ?? null,
          uniqueCode: r.uniqueCode,
          expiryDate: new Date(r.expiryDate),
          createdAt: new Date(r.createdAt),
          status: r.status,
        };
      })
      .filter(Boolean) as PassportPass[];
  } catch {
    return loadFresh();
  }
}

function serialize(rows: PassportPass[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      ...r,
      expiryDate: r.expiryDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
    null,
    2,
  );
}

function persist(rows: PassportPass[]): void {
  try {
    fs.writeFileSync(CACHE_FILE, serialize(rows), 'utf8');
  } catch {
    /* demo only — non-fatal if the FS is unwritable */
  }
}

let store: PassportPass[] = load();

function save(): void {
  persist(store);
}

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

// ─── Data access (demo ⇄ production) ────────────────────────────────────────

/** Lists passes, optionally filtered by a name search and status. */
export async function listPassports(search?: string, status?: string): Promise<PassportPass[]> {
  if (!DEMO_MODE) {
    const db = getDb();
    const conditions: SQL[] = [];
    if (search) conditions.push(ilike(passportPasses.fullName, `%${search}%`));
    if (status && ['active', 'expired', 'revoked'].includes(status)) {
      conditions.push(eq(passportPasses.status, status as PassportStatus));
    }
    if (conditions.length > 0) {
      return db
        .select()
        .from(passportPasses)
        .where(and(...conditions))
        .orderBy(desc(passportPasses.createdAt));
    }
    return db.select().from(passportPasses).orderBy(desc(passportPasses.createdAt));
  }

  let rows = store;
  if (search) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((r) => r.fullName.toLowerCase().includes(q));
  }
  if (status && ['active', 'expired', 'revoked'].includes(status)) {
    rows = rows.filter((r) => r.status === status);
  }
  return [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPassport(id: string): Promise<PassportPass | null> {
  if (!DEMO_MODE) {
    const db = getDb();
    const [row] = await db.select().from(passportPasses).where(eq(passportPasses.id, id)).limit(1);
    return row ?? null;
  }
  return store.find((r) => r.id === id) ?? null;
}

export async function getPassportByCode(code: string): Promise<PassportPass | null> {
  const normalized = code.trim().toUpperCase();
  if (!DEMO_MODE) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(passportPasses)
      .where(eq(passportPasses.uniqueCode, normalized))
      .limit(1);
    return row ?? null;
  }
  return store.find((r) => r.uniqueCode.toUpperCase() === normalized) ?? null;
}

/**
 * Looks up a passport by unique code and confirms it matches the given
 * identifier (email or phone).
 */
export async function verifyPassport(identifier: string, code: string): Promise<PassportPass | null> {
  const id = identifier?.trim() ?? '';
  const uniqueCode = code?.trim().toUpperCase() ?? '';
  if (!id || !uniqueCode) return null;

  const passport = await getPassportByCode(code);
  if (!passport) return null;

  if (id.includes('@')) {
    if (!passport.email) return null;
    return normalizeEmail(passport.email) === normalizeEmail(id) ? passport : null;
  }
  if (!passport.phone) return null;
  return normalizePhone(passport.phone) === normalizePhone(id) ? passport : null;
}

export function isPassportValid(passport: PassportValidityInput | null | undefined) {
  if (!passport) return { valid: false as const, reason: 'no passport provided' };
  if (passport.status !== 'active') return { valid: false as const, reason: `status is ${passport.status}` };
  const expiry = passport.expiryDate instanceof Date ? passport.expiryDate : new Date(passport.expiryDate);
  if (Number.isNaN(expiry.getTime())) return { valid: false as const, reason: 'invalid expiry date' };
  if (expiry.getTime() <= Date.now()) return { valid: false as const, reason: 'expired' };
  return { valid: true as const, reason: 'valid' };
}

function buildPassportRecord(input: CreatePassportInput) {
  const fullName = input.fullName?.trim();
  if (!fullName) throw new Error('fullName is required');

  const email =
    input.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())
      ? normalizeEmail(input.email)
      : null;
  const phone = input.phone ? normalizePhone(input.phone) : null;
  if (phone && !/^\d{8,15}$/.test(phone)) throw new Error('Phone number is invalid');

  if (!detectDeliveryMethod(email, phone).deliverable) {
    throw new Error('At least one valid contact method (email or phone) is required');
  }

  const validityDays = input.validityDays && input.validityDays > 0 ? input.validityDays : 365;
  const expiryDate = input.expiryDate
    ? new Date(input.expiryDate)
    : addDays(new Date(), validityDays);

  return { fullName, email, phone, expiryDate, validityDays };
}

export async function createPassport(input: CreatePassportInput): Promise<PassportPass> {
  const { fullName, email, phone, expiryDate } = buildPassportRecord(input);
  const credential = generateUniqueCode();

  if (!DEMO_MODE) {
    const db = getDb();
    const [row] = await db
      .insert(passportPasses)
      .values({ fullName, email, phone, uniqueCode: credential, expiryDate, status: 'active' })
      .returning();
    return row;
  }

  const passport: PassportPass = {
    id: randomUUID(),
    fullName,
    email,
    phone,
    uniqueCode: credential,
    expiryDate,
    createdAt: new Date(),
    status: 'active',
  };
  store = [passport, ...store];
  save();
  return passport;
}

export async function updatePassportStatus(id: string, status: PassportStatus): Promise<PassportPass | null> {
  if (!DEMO_MODE) {
    const db = getDb();
    const [row] = await db
      .update(passportPasses)
      .set({ status })
      .where(eq(passportPasses.id, id))
      .returning();
    return row ?? null;
  }
  const passport = await getPassport(id);
  if (!passport) return null;
  passport.status = status;
  save();
  return passport;
}

export async function updatePassportExpiryDate(id: string, expiryDate: Date | string): Promise<PassportPass | null> {
  if (!DEMO_MODE) {
    const db = getDb();
    const [row] = await db
      .update(passportPasses)
      .set({ expiryDate: new Date(expiryDate) })
      .where(eq(passportPasses.id, id))
      .returning();
    return row ?? null;
  }
  const passport = await getPassport(id);
  if (!passport) return null;
  passport.expiryDate = new Date(expiryDate);
  save();
  return passport;
}

export async function getStats(): Promise<PassportSummary> {
  if (!DEMO_MODE) {
    const db = getDb();
    const all = await db.select().from(passportPasses);
    const [pend] = await db
      .select({ c: sql<number>`count(*)` })
      .from(deliveryLog)
      .where(eq(deliveryLog.status, 'pending'));
    return {
      total: all.length,
      active: all.filter((r) => r.status === 'active').length,
      expired: all.filter((r) => r.status === 'expired').length,
      revoked: all.filter((r) => r.status === 'revoked').length,
      pendingDelivery: Number(pend?.c ?? 0),
    };
  }

  const total = store.length;
  const active = store.filter((r) => r.status === 'active').length;
  const expired = store.filter((r) => r.status === 'expired').length;
  const revoked = store.filter((r) => r.status === 'revoked').length;
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).getTime();
  const pendingDelivery = store.filter(
    (r) => r.status === 'active' && r.createdAt.getTime() >= threeDaysAgo,
  ).length;
  return { total, active, expired, revoked, pendingDelivery };
}

export interface AuditEvent {
  id: string;
  eventType:
    | 'passport_created'
    | 'delivery_sent'
    | 'verification_success'
    | 'passport_revoked'
    | 'admin_login';
  resourceLabel: string;
  actor: string;
  timestamp: Date;
}

/** Returns a recent activity (audit) log. */
export async function listAuditLog(limit = 24): Promise<AuditEvent[]> {
  if (!DEMO_MODE) {
    const db = getDb();
    const rows = await db.select().from(auditLog).orderBy(desc(auditLog.timestamp)).limit(limit);
    return rows.map((r) => ({
      id: r.id,
      eventType: r.eventType as AuditEvent['eventType'],
      resourceLabel: ((r.metadata as Record<string, unknown> | null)?.resourceLabel as string) ?? r.resourceType,
      actor: r.actor,
      timestamp: r.timestamp,
    }));
  }

  const events: AuditEvent[] = [];
  const now = Date.now();

  for (const p of store) {
    events.push({
      id: `${p.id}:created`,
      eventType: 'passport_created',
      resourceLabel: `${p.fullName} · ${p.uniqueCode}`,
      actor: 'admin@pakartalenta.co.id',
      timestamp: p.createdAt,
    });
    if (now - p.createdAt.getTime() < 3 * 24 * 60 * 60 * 1000) {
      events.push({
        id: `${p.id}:delivery`,
        eventType: 'delivery_sent',
        resourceLabel: p.uniqueCode,
        actor: 'system',
        timestamp: new Date(p.createdAt.getTime() + 8 * 1000),
      });
    }
  }

  store
    .filter((p) => p.status === 'revoked')
    .forEach((p) => {
      events.push({
        id: `${p.id}:revoked`,
        eventType: 'passport_revoked',
        resourceLabel: p.uniqueCode,
        actor: 'admin@pakartalenta.co.id',
        timestamp: new Date(p.createdAt.getTime() + 60 * 1000),
      });
    });

  const active = store.filter((p) => p.status === 'active');
  events.push(
    {
      id: 'v:1',
      eventType: 'verification_success',
      resourceLabel: active[0]?.uniqueCode ?? '',
      actor: 'public',
      timestamp: new Date(now - 8 * 60 * 1000),
    },
    {
      id: 'v:2',
      eventType: 'verification_success',
      resourceLabel: active[1]?.uniqueCode ?? '',
      actor: 'public',
      timestamp: new Date(now - 47 * 60 * 1000),
    },
    {
      id: 'a:1',
      eventType: 'admin_login',
      resourceLabel: 'Admin Console',
      actor: 'admin',
      timestamp: new Date(now - 15 * 60 * 1000),
    },
    {
      id: 'a:2',
      eventType: 'admin_login',
      resourceLabel: 'Admin Console',
      actor: 'admin',
      timestamp: new Date(now - 3 * 60 * 60 * 1000),
    },
  );

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
}