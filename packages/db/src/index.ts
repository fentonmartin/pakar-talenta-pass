import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Enums
 */

/** Lifecycle state of a passport pass. */
export const passportStatusEnum = pgEnum('passport_status', ['active', 'expired', 'revoked']);

/** Delivery channel used to send a passport. */
export const deliveryChannelEnum = pgEnum('delivery_channel', ['email', 'whatsapp']);

/** Outcome of an attempted delivery. */
export const deliveryStatusEnum = pgEnum('delivery_status', ['sent', 'failed', 'pending']);

/** How a passport was accessed. */
export const accessMethodEnum = pgEnum('access_method', [
  'direct_link',
  'code_lookup',
  'magic_link',
]);

/** Kind of reusable link generated for a passport. */
export const reusableLinkTypeEnum = pgEnum('reusable_link_type', ['wa', 'mailto']);

/**
 * Tables
 */

/** A single digital access pass issued to a vetted professional. */
export const passportPasses = pgTable('passport_passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name').notNull(),
  email: varchar('email'),
  phone: varchar('phone'),
  uniqueCode: varchar('unique_code').notNull().unique(),
  expiryDate: timestamp('expiry_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: passportStatusEnum('status').default('active').notNull(),
});

/** Audit trail of every delivery attempt for a passport. */
export const deliveryLog = pgTable('delivery_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  passportId: uuid('passport_id')
    .notNull()
    .references(() => passportPasses.id, { onDelete: 'cascade' }),
  channel: deliveryChannelEnum('channel').notNull(),
  recipient: varchar('recipient').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  status: deliveryStatusEnum('status').notNull(),
  error: text('error'),
});

/** Audit trail of every passport access. */
export const accessLogs = pgTable('access_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  passportId: uuid('passport_id')
    .notNull()
    .references(() => passportPasses.id, { onDelete: 'cascade' }),
  accessMethod: accessMethodEnum('access_method').notNull(),
  accessedBy: varchar('accessed_by').notNull(),
  accessedAt: timestamp('accessed_at').defaultNow().notNull(),
});

/** Reusable WhatsApp / mailto links pointing at a passport. */
export const reusableLinks = pgTable('reusable_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  passportId: uuid('passport_id')
    .notNull()
    .references(() => passportPasses.id, { onDelete: 'cascade' }),
  type: reusableLinkTypeEnum('type').notNull(),
  url: text('url').notNull(),
  createdBy: varchar('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Relations
 */

export const passportPassesRelations = relations(passportPasses, ({ many }) => ({
  deliveryLog: many(deliveryLog),
  accessLogs: many(accessLogs),
  reusableLinks: many(reusableLinks),
}));

export const deliveryLogRelations = relations(deliveryLog, ({ one }) => ({
  passport: one(passportPasses, {
    fields: [deliveryLog.passportId],
    references: [passportPasses.id],
  }),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  passport: one(passportPasses, {
    fields: [accessLogs.passportId],
    references: [passportPasses.id],
  }),
}));

export const reusableLinksRelations = relations(reusableLinks, ({ one }) => ({
  passport: one(passportPasses, {
    fields: [reusableLinks.passportId],
    references: [passportPasses.id],
  }),
}));

/**
 * Inferred row types
 */

export type PassportPass = typeof passportPasses.$inferSelect;
export type NewPassportPass = typeof passportPasses.$inferInsert;

export type DeliveryLogEntry = typeof deliveryLog.$inferSelect;
export type NewDeliveryLogEntry = typeof deliveryLog.$inferInsert;

export type AccessLogEntry = typeof accessLogs.$inferSelect;
export type NewAccessLogEntry = typeof accessLogs.$inferInsert;

export type ReusableLink = typeof reusableLinks.$inferSelect;
export type NewReusableLink = typeof reusableLinks.$inferInsert;

export type PassportStatus = PassportPass['status'];
export type DeliveryChannel = DeliveryLogEntry['channel'];
export type DeliveryStatus = DeliveryLogEntry['status'];
export type AccessMethod = AccessLogEntry['accessMethod'];
export type ReusableLinkType = ReusableLink['type'];

/**
 * Schema export (used by the Drizzle client and Drizzle Kit).
 */
export const schema = {
  passportPasses,
  deliveryLog,
  accessLogs,
  reusableLinks,
  passportPassesRelations,
  deliveryLogRelations,
  accessLogsRelations,
  reusableLinksRelations,
  passportStatusEnum,
  deliveryChannelEnum,
  deliveryStatusEnum,
  accessMethodEnum,
  reusableLinkTypeEnum,
} as const;
