/**
 * Append-only audit logging for Pakar Talenta Pass.
 * Every security-relevant action is recorded. Logs are immutable:
 * no UPDATE, no DELETE on audit tables — ever.
 */
import { sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { SessionPayload } from '@pakar-talenta/auth';

// ┌─── Audit event types ──────────────────────────────────────────────────

/**
 * Every event that triggers an audit log entry.
 * These align with the hard invariants in CLAUDE.md.
 */
export const AUDIT_EVENT_TYPES = [
  'passport_created',
  'passport_updated',
  'passport_revoked',
  'delivery_queued',
  'delivery_sent',
  'delivery_failed',
  'verification_attempt',
  'verification_success',
  'verification_failure',
  'magic_link_sent',
  'admin_login',
  'admin_login_failed',
  'access_granted',
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

/**
 * What was acted upon. Keeps the log row small while still being queryable.
 */
export const AUDIT_RESOURCE_TYPES = [
  'passport',
  'delivery',
  'session',
  'admin',
] as const;

export type AuditResourceType = (typeof AUDIT_RESOURCE_TYPES)[number];

// ┌─── Audit log record ───────────────────────────────────────────────────

export interface AuditLogInput {
  /** Event type — see {@link AUDIT_EVENT_TYPES}. */
  eventType: AuditEventType;
  /** What was affected (passport ID, session ID, etc.). */
  resourceType: AuditResourceType;
  /** UUID or identifier of the resource. */
  resourceId: string | null;
  /** Who performed the action (admin ID or 'anonymous'). */
  actor: string;
  /** Session context if available. */
  session: SessionPayload | null;
  /** IP address of the actor. */
  ipAddress: string | null;
  /** User-Agent string. */
  userAgent: string | null;
  /** Additional structured context. */
  metadata: Record<string, unknown> | null;
}

export interface AuditLogRecord extends AuditLogInput {
  /** UUID of the audit entry. */
  id: string;
  /** When the event occurred. */
  timestamp: Date;
}

// ┌─── Writer ─────────────────────────────────────────────────────────────

export interface AuditWriter {
  write(event: AuditLogInput): Promise<void>;
  query(filter: Partial<AuditLogRecord>): Promise<AuditLogRecord[]>;
}

/**
 * Creates an audit writer that stores events in the database.
 * The audit table is append-only: the writer uses raw INSERT only.
 */
export function createDatabaseAuditWriter(db: NodePgDatabase): AuditWriter {
  return {
    async write(event: AuditLogInput): Promise<void> {
      const sessionId = event.session ? JSON.stringify(event.session) : null;
      const meta = event.metadata ? JSON.stringify(event.metadata) : null;

      // Raw INSERT via sql tagged template — params are auto-escaped by pg driver
      await db.execute(sql`
        INSERT INTO audit_log (
          id, timestamp, event_type, resource_type, resource_id,
          actor, ip_address, user_agent, session, metadata
        ) VALUES (
          ${crypto.randomUUID()}, NOW(), ${event.eventType}, ${event.resourceType},
          ${event.resourceId}, ${event.actor}, ${event.ipAddress}, ${event.userAgent},
          ${sessionId}, ${meta}
        )
      `);
    },

    async query(filter: Partial<AuditLogRecord>): Promise<AuditLogRecord[]> {
      const conditions: SQL[] = [];
      if (filter.eventType) conditions.push(sql`event_type = ${filter.eventType}`);
      if (filter.resourceType) conditions.push(sql`resource_type = ${filter.resourceType}`);
      if (filter.resourceId) conditions.push(sql`resource_id = ${filter.resourceId}`);
      if (filter.actor) conditions.push(sql`actor = ${filter.actor}`);

      const whereClause =
        conditions.length > 0
          ? sql`WHERE ${conditions.reduce((acc, cond, i) =>
              i === 0 ? cond : sql`${acc} AND ${cond}`
            )}`
          : sql``;

      const result = await db.execute<{
        id: string;
        timestamp: Date;
        event_type: string;
        resource_type: string;
        resource_id: string | null;
        actor: string;
        ip_address: string | null;
        user_agent: string | null;
        session: string | null;
        metadata: string | null;
      }>(sql`
        SELECT * FROM audit_log ${whereClause}
        ORDER BY timestamp DESC
        LIMIT 100
      `);

      return result.rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        eventType: row.event_type as AuditEventType,
        resourceType: row.resource_type as AuditResourceType,
        resourceId: row.resource_id,
        actor: row.actor,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        session: row.session ? JSON.parse(row.session) : null,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    },
  };
}
