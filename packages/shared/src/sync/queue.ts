import { getDatabase, type ChangeQueueEntry, type ChangeOperation } from './db';

// Re-export types for external consumers
export type { ChangeQueueEntry, ChangeOperation };

/**
 * Change Queue Manager
 *
 * Manages the queue of changes waiting to be synced to the server.
 * Operations are processed in order (FIFO) when connectivity is restored.
 */

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

/**
 * Add a change to the sync queue
 */
export async function enqueueChange(
  table: string,
  recordId: string | null,
  localId: number,
  operation: ChangeOperation,
  payload: Record<string, unknown>
): Promise<number> {
  const db = getDatabase();

  const entry: Omit<ChangeQueueEntry, 'id'> = {
    table,
    recordId,
    localId,
    operation,
    payload,
    timestamp: Date.now(),
    attempts: 0,
  };

  const id = await db.changeQueue.add(entry as ChangeQueueEntry);
  return id;
}

/**
 * Get all pending changes
 */
export async function getPendingChanges(): Promise<ChangeQueueEntry[]> {
  const db = getDatabase();
  return db.changeQueue.orderBy('timestamp').toArray();
}

/**
 * Get pending changes for a specific table
 */
export async function getPendingChangesForTable(
  table: string
): Promise<ChangeQueueEntry[]> {
  const db = getDatabase();
  return db.changeQueue.where('table').equals(table).sortBy('timestamp');
}

/**
 * Remove a change from the queue (after successful sync)
 */
export async function dequeueChange(id: number): Promise<void> {
  const db = getDatabase();
  await db.changeQueue.delete(id);
}

/**
 * Mark a change as failed and increment retry count
 */
export async function markChangeFailed(
  id: number,
  error: string
): Promise<boolean> {
  const db = getDatabase();
  const entry = await db.changeQueue.get(id);

  if (!entry) return false;

  const newAttempts = entry.attempts + 1;

  if (newAttempts >= MAX_RETRY_ATTEMPTS) {
    // Move to dead letter queue or mark as permanent error
    await db.changeQueue.update(id, {
      attempts: newAttempts,
      lastError: `PERMANENT_FAILURE: ${error}`,
    });
    return false;
  }

  await db.changeQueue.update(id, {
    attempts: newAttempts,
    lastError: error,
  });
  return true;
}

/**
 * Get count of pending changes
 */
export async function getPendingChangeCount(): Promise<number> {
  const db = getDatabase();
  return db.changeQueue.count();
}

/**
 * Get changes that have permanently failed
 */
export async function getFailedChanges(): Promise<ChangeQueueEntry[]> {
  const db = getDatabase();
  return db.changeQueue
    .filter((entry) => entry.attempts >= MAX_RETRY_ATTEMPTS)
    .toArray();
}

/**
 * Clear failed changes (after user acknowledgment)
 */
export async function clearFailedChanges(): Promise<number> {
  const db = getDatabase();
  const failed = await getFailedChanges();
  const ids = failed.map((e) => e.id!).filter(Boolean);
  await db.changeQueue.bulkDelete(ids);
  return ids.length;
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(attempts: number): number {
  return Math.min(RETRY_DELAY_MS * Math.pow(2, attempts), 30000);
}

/**
 * Check if queue has items ready for retry
 */
export async function hasRetryableChanges(): Promise<boolean> {
  const db = getDatabase();
  const pending = await db.changeQueue
    .filter((entry) => entry.attempts < MAX_RETRY_ATTEMPTS)
    .first();
  return pending !== undefined;
}
