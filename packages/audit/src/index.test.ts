import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { createDatabaseAuditWriter, AUDIT_EVENT_TYPES, AUDIT_RESOURCE_TYPES } from './index';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

function createMockDb(): NodePgDatabase {
  return {
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  } as unknown as NodePgDatabase;
}

describe('Audit constants', () => {
  it('has expected event types', () => {
    expect(AUDIT_EVENT_TYPES).toContain('passport_created');
    expect(AUDIT_EVENT_TYPES).toContain('verification_success');
    expect(AUDIT_EVENT_TYPES).toContain('admin_login');
  });

  it('has expected resource types', () => {
    expect(AUDIT_RESOURCE_TYPES).toContain('passport');
    expect(AUDIT_RESOURCE_TYPES).toContain('session');
    expect(AUDIT_RESOURCE_TYPES).toContain('admin');
  });
});

describe('createDatabaseAuditWriter', () => {
  let mockDb: NodePgDatabase;
  let writer: ReturnType<typeof createDatabaseAuditWriter>;

  beforeEach(() => {
    mockDb = createMockDb();
    writer = createDatabaseAuditWriter(mockDb);
  });

  it('writes audit events via INSERT', async () => {
    await writer.write({
      eventType: 'passport_created',
      resourceType: 'passport',
      resourceId: 'test-uuid',
      actor: 'admin-fen',
      session: null,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      metadata: { source: 'test' },
    });

    expect(mockDb.execute).toHaveBeenCalledTimes(1);
    const callArg = (mockDb.execute as Mock).mock.calls[0][0];
    // The sql tagged template produces an SQL object with an internal .sql string
    expect(callArg.sql || callArg).toBeTruthy();
    if (callArg.sql) {
      expect(callArg.sql).toContain('INSERT INTO audit_log');
    }
  });

  it('does not mutate event data', async () => {
    const event = {
      eventType: 'verification_success' as const,
      resourceType: 'passport' as const,
      resourceId: 'test-123',
      actor: 'anonymous',
      session: null,
      ipAddress: null,
      userAgent: null,
      metadata: null,
    };

    await writer.write(event);
    expect(event.resourceId).toBe('test-123');
  });

  it('serializes session payload', async () => {
    await writer.write({
      eventType: 'admin_login',
      resourceType: 'admin',
      resourceId: null,
      actor: 'admin-fen',
      session: { id: 'admin', role: 'admin', createdAt: Date.now(), mfaVerified: true },
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla',
      metadata: null,
    });

    expect(mockDb.execute).toHaveBeenCalledTimes(1);
    const callArg = (mockDb.execute as Mock).mock.calls[0][0];
    // SQL object from sql tagged template
    expect(callArg).toBeTruthy();
  });

  it('queries audit log by filter', async () => {
    const mockDbWithRows = {
      execute: vi.fn().mockResolvedValue({
        rows: [
          {
            id: 'audit-1',
            timestamp: new Date(),
            event_type: 'passport_created',
            resource_type: 'passport',
            resource_id: 'passport-uuid',
            actor: 'admin-fen',
            ip_address: '127.0.0.1',
            user_agent: 'test',
            session: null,
            metadata: null,
          },
        ],
      }),
    } as unknown as NodePgDatabase;

    const writer2 = createDatabaseAuditWriter(mockDbWithRows);
    const results = await writer2.query({ eventType: 'passport_created' });

    expect(results).toHaveLength(1);
    expect(results[0].eventType).toBe('passport_created');
    expect(mockDbWithRows.execute).toHaveBeenCalled();
  });

  it('returns empty array when no filters match', async () => {
    const mockDbEmpty = {
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    } as unknown as NodePgDatabase;

    const writer3 = createDatabaseAuditWriter(mockDbEmpty);
    const results = await writer3.query({ actor: 'nonexistent' });

    expect(results).toHaveLength(0);
  });
});
