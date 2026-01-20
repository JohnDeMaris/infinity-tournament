/**
 * React Hooks for Offline-First Data Access
 *
 * These hooks provide optimistic updates with automatic sync.
 * All reads hit local IndexedDB first (instant), then sync in background.
 */

import { getDatabase, getTable, type SyncedEntity, type SyncStatus, type TableName } from './db';
import { enqueueChange } from './queue';
import { getSyncEngine } from './engine';

// ============================================================================
// Generic CRUD Operations with Optimistic Updates
// ============================================================================

export interface UseLocalDataOptions {
  /** Sync immediately after mutation */
  syncOnMutate?: boolean;
}

/**
 * Create a record locally with optimistic update
 */
export async function createLocalRecord<T extends SyncedEntity>(
  table: TableName,
  data: Omit<T, '_localId' | '_syncStatus' | '_lastModified' | 'id'>
): Promise<T> {
  const tableRef = getTable(table);

  const record: T = {
    ...data,
    id: null, // Will be assigned by server
    _syncStatus: 'pending',
    _lastModified: Date.now(),
  } as T;

  const localId = await tableRef.add(record);

  // Queue for sync
  await enqueueChange(table, null, localId, 'insert', data as Record<string, unknown>);

  // Trigger sync
  const engine = getSyncEngine();
  if (engine?.isOnlineNow()) {
    engine.sync();
  }

  return { ...record, _localId: localId } as T;
}

/**
 * Update a record locally with optimistic update
 */
export async function updateLocalRecord<T extends SyncedEntity>(
  table: TableName,
  localId: number,
  data: Partial<T>
): Promise<T | null> {
  const tableRef = getTable(table);

  const existing = await tableRef.get(localId);
  if (!existing) return null;

  const updated: T = {
    ...existing,
    ...data,
    _syncStatus: 'pending',
    _lastModified: Date.now(),
  } as T;

  await tableRef.update(localId, updated);

  // Queue for sync
  if (existing.id) {
    await enqueueChange(table, existing.id, localId, 'update', data as Record<string, unknown>);
  }

  // Trigger sync
  const engine = getSyncEngine();
  if (engine?.isOnlineNow()) {
    engine.sync();
  }

  return updated;
}

/**
 * Delete a record locally with optimistic update
 */
export async function deleteLocalRecord(
  table: TableName,
  localId: number
): Promise<boolean> {
  const tableRef = getTable(table);

  const existing = await tableRef.get(localId);
  if (!existing) return false;

  // If synced with server, queue delete operation
  if (existing.id) {
    await enqueueChange(table, existing.id, localId, 'delete', {});
  }

  await tableRef.delete(localId);

  // Trigger sync
  const engine = getSyncEngine();
  if (engine?.isOnlineNow()) {
    engine.sync();
  }

  return true;
}

/**
 * Get a record by local ID
 */
export async function getLocalRecord<T>(
  table: TableName,
  localId: number
): Promise<T | undefined> {
  const tableRef = getTable(table);
  return tableRef.get(localId) as Promise<T | undefined>;
}

/**
 * Get a record by server ID
 */
export async function getLocalRecordByServerId<T>(
  table: TableName,
  serverId: string
): Promise<T | undefined> {
  const tableRef = getTable(table);
  return tableRef.where('id').equals(serverId).first() as Promise<T | undefined>;
}

/**
 * Query records by index
 */
export async function queryLocalRecords<T>(
  table: TableName,
  index: string,
  value: string | number
): Promise<T[]> {
  const tableRef = getTable(table);
  const results = await tableRef.where(index).equals(value).toArray();
  return results as unknown as T[];
}

/**
 * Get all records from a table
 */
export async function getAllLocalRecords<T>(table: TableName): Promise<T[]> {
  const tableRef = getTable(table);
  const results = await tableRef.toArray();
  return results as unknown as T[];
}

// ============================================================================
// Match-Specific Operations
// ============================================================================

/**
 * Submit scores for a match (optimistic update)
 */
export async function submitMatchScores(
  matchLocalId: number,
  playerId: string,
  scores: Record<string, number>
): Promise<void> {
  const db = getDatabase();
  const match = await db.matches.get(matchLocalId);

  if (!match) {
    throw new Error('Match not found');
  }

  const isPlayer1 = match.player1_id === playerId;
  const isPlayer2 = match.player2_id === playerId;

  if (!isPlayer1 && !isPlayer2) {
    throw new Error('Player not in this match');
  }

  // Build updated match
  const updatedScores = match.scores ?? { player1: {}, player2: {} };
  if (isPlayer1) {
    updatedScores.player1 = scores;
  } else {
    updatedScores.player2 = scores;
  }

  const updates: Partial<typeof match> = {
    scores: updatedScores,
    confirmed_by_p1: isPlayer1 ? true : match.confirmed_by_p1,
    confirmed_by_p2: isPlayer2 ? true : match.confirmed_by_p2,
    _syncStatus: 'pending',
    _lastModified: Date.now(),
  };

  // Update confirmation status
  if (updates.confirmed_by_p1 && updates.confirmed_by_p2) {
    updates.confirmation_status = 'confirmed';
  } else if (updates.confirmed_by_p1 || updates.confirmed_by_p2) {
    updates.confirmation_status = 'partial';
  }

  await db.matches.update(matchLocalId, updates);

  // Queue for sync
  if (match.id) {
    await enqueueChange('matches', match.id, matchLocalId, 'update', {
      ...updates,
      _syncStatus: undefined,
      _lastModified: undefined,
    });
  }

  // Trigger sync
  const engine = getSyncEngine();
  if (engine?.isOnlineNow()) {
    engine.sync();
  }
}

// ============================================================================
// Sync Status Utilities
// ============================================================================

/**
 * Get sync status for a record
 */
export async function getRecordSyncStatus(
  table: TableName,
  localId: number
): Promise<SyncStatus | null> {
  const tableRef = getTable(table);
  const record = await tableRef.get(localId);
  return record?._syncStatus ?? null;
}

/**
 * Get count of pending changes
 */
export async function getPendingChangeCount(): Promise<number> {
  const db = getDatabase();
  return db.changeQueue.count();
}

/**
 * Check if any data is pending sync
 */
export async function hasPendingChanges(): Promise<boolean> {
  const count = await getPendingChangeCount();
  return count > 0;
}
