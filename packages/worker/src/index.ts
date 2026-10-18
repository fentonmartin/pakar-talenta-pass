import { Worker, type Job, type WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import { getDatabase, closeDatabase, detectDeliveryMethod, generateWaLink } from '@pakar-talenta/core';
import { sendInvitationEmail } from '@pakar-talenta/mail';

const QUEUE_NAME = 'delivery';
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = 5000;

/** Shape of the job payload enqueued for each passport delivery. */
export interface DeliveryJobData {
  passportId: string;
  uniqueCode: string;
  verifyUrl: string;
}

/** Shape persisted in the delivery_log table. */
export type DeliveryLogRecord = NewDeliveryLogEntry;

import type { NewDeliveryLogEntry } from '@pakar-talenta/db';
import { eq } from 'drizzle-orm';
import { passportPasses, deliveryLog } from '@pakar-talenta/db';

let connection: IORedis | undefined;
let worker: Worker | undefined;

/**
 * Returns a shared Redis connection. Creates one if none exists.
 */
function getConnection(): IORedis {
  if (!connection) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    connection = new IORedis(url);
  }
  return connection;
}

/**
 * Processes a single delivery job:
 * 1. Fetches the passport from the database
 * 2. Detects delivery method (both / email / whatsapp / disabled)
 * 3. Generates wa.me link if phone present
 * 4. Sends SMTP email if email present
 * 5. Logs delivery result
 * 6. Returns the decision for callers
 */
async function processDelivery(job: Job<DeliveryJobData>): Promise<unknown> {
  const { passportId, verifyUrl } = job.data;
  const db = getDatabase();

  const [passport] = await db
    .select()
    .from(passportPasses)
    .where(eq(passportPasses.id, passportId))
    .limit(1);

  if (!passport) {
    await logDelivery(db, passportId, 'disabled', '', 'failed', 'Passport not found');
    return { success: false, error: 'Passport not found' };
  }

  const decision = detectDeliveryMethod(passport.email, passport.phone);

  if (!decision.deliverable) {
    await logDelivery(
      db, passportId, 'disabled', passport.email ?? '', 'failed', 'No valid contact method'
    );
    return { success: false, error: 'No valid contact method' };
  }

  const results: string[] = [];

  // Generate WhatsApp link (no API — just a deep link)
  if (decision.channels.includes('whatsapp')) {
    const waLink = generateWaLink(
      decision.recipients.whatsapp!,
      `Hi ${passport.fullName}, your Pakar Talenta Pass is ready. Code: ${passport.uniqueCode}. Verify: ${verifyUrl}`
    );
    results.push(`wa.me link generated: ${waLink}`);
  }

  // Send email via SMTP
  if (decision.channels.includes('email')) {
    const waLink = decision.channels.includes('whatsapp')
      ? generateWaLink(
          decision.recipients.whatsapp!,
          `Hi ${passport.fullName}…`
        )
      : null;

    const result = await sendInvitationEmail(passport, decision, verifyUrl, waLink);
    if (result.success) {
      results.push(`Email sent: ${result.messageId}`);
      await logDelivery(db, passportId, 'email', decision.recipients.email!, 'sent');
    } else {
      results.push(`Email failed: ${result.error}`);
      await logDelivery(db, passportId, 'email', decision.recipients.email!, 'failed', result.error);
    }
  }

  return { success: true, results, channels: decision.channels };
}

/** Writes a row to the delivery_log table. */
async function logDelivery(
  db: ReturnType<typeof getDatabase>,
  passportId: string,
  channel: 'email' | 'whatsapp' | 'disabled',
  recipient: string,
  status: 'sent' | 'failed' | 'pending',
  error?: string,
): Promise<void> {
  await db.insert(deliveryLog).values({
    passportId,
    channel: channel === 'disabled' ? 'email' : channel,
    recipient,
    status,
    error: error ?? null,
  });
}

/**
 * Starts the delivery worker. Call once at application startup.
 */
export function startWorker(opts?: Partial<WorkerOptions>): Worker {
  if (worker) return worker;

  const conn = getConnection();
  worker = new Worker(
    QUEUE_NAME,
    async (job) => processDelivery(job),
    {
      connection: conn,
      concurrency: 5,
      autorun: true,
      ...opts,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err);
  });

  worker.on('completed', (job) => {
    console.warn(`[worker] Job ${job.id} completed`);
  });

  return worker;
}

/**
 * Enqueues a new delivery job for a passport.
 */
export async function enqueueDelivery(
  passportId: string,
  uniqueCode: string,
  verifyUrl: string,
  attempts = MAX_ATTEMPTS,
): Promise<Job<DeliveryJobData>> {
  const conn = getConnection();
  const { Queue } = await import('bullmq');
  const queue = new Queue(QUEUE_NAME, { connection: conn });

  return queue.add(
    'deliver',
    { passportId, uniqueCode, verifyUrl },
    {
      attempts,
      backoff: { type: 'exponential', delay: BACKOFF_MS },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    }
  );
}

/**
 * Graceful shutdown — waits for in-flight jobs, closes connections.
 */
export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = undefined;
  }
  if (connection) {
    await connection.quit();
    connection = undefined;
  }
  await closeDatabase();
}
