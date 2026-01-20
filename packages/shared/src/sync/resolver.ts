import { getDatabase, type SyncedEntity, type LocalMatch } from './db';

/**
 * Conflict Resolution Strategies
 *
 * When the same record is modified locally and on the server,
 * we need a strategy to merge or choose between versions.
 */

export type ConflictStrategy =
  | 'client-wins'
  | 'server-wins'
  | 'last-write-wins'
  | 'manual'
  | 'merge';

export interface ConflictInfo<T> {
  localVersion: T;
  serverVersion: T;
  table: string;
  recordId: string;
}

export interface ResolutionResult<T> {
  resolved: T;
  strategy: ConflictStrategy;
  requiresUserAction: boolean;
}

/**
 * Default conflict resolution strategy per table
 */
const DEFAULT_STRATEGIES: Record<string, ConflictStrategy> = {
  users: 'server-wins',
  tournaments: 'last-write-wins',
  registrations: 'last-write-wins',
  rounds: 'server-wins',
  matches: 'merge', // Special handling for score confirmation
};

/**
 * Resolve a conflict between local and server versions
 */
export function resolveConflict<T extends SyncedEntity>(
  conflict: ConflictInfo<T>,
  strategy?: ConflictStrategy
): ResolutionResult<T> {
  const effectiveStrategy = strategy ?? DEFAULT_STRATEGIES[conflict.table] ?? 'server-wins';

  switch (effectiveStrategy) {
    case 'client-wins':
      return {
        resolved: conflict.localVersion,
        strategy: effectiveStrategy,
        requiresUserAction: false,
      };

    case 'server-wins':
      return {
        resolved: conflict.serverVersion,
        strategy: effectiveStrategy,
        requiresUserAction: false,
      };

    case 'last-write-wins':
      return resolveLastWriteWins(conflict);

    case 'merge':
      return resolveMerge(conflict);

    case 'manual':
    default:
      return {
        resolved: conflict.serverVersion,
        strategy: 'manual',
        requiresUserAction: true,
      };
  }
}

/**
 * Last-write-wins resolution
 */
function resolveLastWriteWins<T extends SyncedEntity>(
  conflict: ConflictInfo<T>
): ResolutionResult<T> {
  const localTime = conflict.localVersion._lastModified;
  const serverTime = conflict.serverVersion._serverTimestamp
    ? new Date(conflict.serverVersion._serverTimestamp).getTime()
    : 0;

  if (localTime > serverTime) {
    return {
      resolved: conflict.localVersion,
      strategy: 'last-write-wins',
      requiresUserAction: false,
    };
  }

  return {
    resolved: conflict.serverVersion,
    strategy: 'last-write-wins',
    requiresUserAction: false,
  };
}

/**
 * Merge resolution for matches (scores)
 *
 * Special handling for score entry:
 * - Both player confirmations are preserved
 * - Scores require both players to confirm
 * - TO override always wins
 */
function resolveMerge<T extends SyncedEntity>(
  conflict: ConflictInfo<T>
): ResolutionResult<T> {
  // For matches, merge confirmation status
  if (conflict.table === 'matches') {
    return resolveMatchConflict(
      conflict as unknown as ConflictInfo<LocalMatch>
    ) as unknown as ResolutionResult<T>;
  }

  // For other tables, fall back to last-write-wins
  return resolveLastWriteWins(conflict);
}

/**
 * Special merge logic for match score conflicts
 */
function resolveMatchConflict(
  conflict: ConflictInfo<LocalMatch>
): ResolutionResult<LocalMatch> {
  const local = conflict.localVersion;
  const server = conflict.serverVersion;

  // If server has completed/confirmed status, prefer server
  if (
    server.confirmation_status === 'completed' ||
    server.confirmation_status === 'confirmed'
  ) {
    return {
      resolved: server,
      strategy: 'merge',
      requiresUserAction: false,
    };
  }

  // Merge confirmations (OR logic - either confirmation counts)
  const merged: LocalMatch = {
    ...server,
    confirmed_by_p1: local.confirmed_by_p1 || server.confirmed_by_p1,
    confirmed_by_p2: local.confirmed_by_p2 || server.confirmed_by_p2,
    _localId: local._localId,
    _syncStatus: 'synced',
    _lastModified: Date.now(),
  };

  // Merge scores (prefer non-null)
  if (local.scores && server.scores) {
    merged.scores = {
      player1: { ...server.scores.player1, ...local.scores.player1 },
      player2: server.scores.player2
        ? { ...server.scores.player2, ...(local.scores.player2 ?? {}) }
        : local.scores.player2,
    };
  } else {
    merged.scores = local.scores ?? server.scores;
  }

  // Update confirmation status based on merged confirmations
  if (merged.confirmed_by_p1 && merged.confirmed_by_p2) {
    merged.confirmation_status = 'confirmed';
  } else if (merged.confirmed_by_p1 || merged.confirmed_by_p2) {
    merged.confirmation_status = 'partial';
  }

  // Check for disputed scores
  if (merged.scores?.player1 && merged.scores?.player2) {
    // Players entered conflicting scores - mark as disputed
    const p1Op = merged.scores.player1.op ?? 0;
    const p2Op = merged.scores.player2.op ?? 0;

    // In a non-draw, total OP should be 10 (winner gets more, loser gets less)
    // This is a simple heuristic - may need refinement
    if (p1Op + p2Op > 10) {
      merged.confirmation_status = 'disputed';
      return {
        resolved: merged,
        strategy: 'merge',
        requiresUserAction: true, // Needs TO intervention
      };
    }
  }

  return {
    resolved: merged,
    strategy: 'merge',
    requiresUserAction: false,
  };
}

/**
 * Detect if there's a conflict between local and server versions
 */
export function hasConflict<T extends SyncedEntity>(
  local: T,
  server: T
): boolean {
  // No conflict if synced or local is newer
  if (local._syncStatus === 'synced') {
    return false;
  }

  // Conflict if both have been modified since last sync
  const serverTime = server._serverTimestamp
    ? new Date(server._serverTimestamp).getTime()
    : 0;

  return local._lastModified > serverTime && serverTime > 0;
}

/**
 * Mark a local record as having a conflict
 */
export async function markConflict(
  table: string,
  localId: number
): Promise<void> {
  const db = getDatabase();
  const tableRef = db.table(table);
  await tableRef.update(localId, { _syncStatus: 'conflict' });
}

/**
 * Get all records with conflicts
 */
export async function getConflicts(
  table?: string
): Promise<Array<{ table: string; localId: number; record: SyncedEntity }>> {
  const db = getDatabase();
  const tables = table ? [table] : ['tournaments', 'registrations', 'rounds', 'matches'];
  const conflicts: Array<{ table: string; localId: number; record: SyncedEntity }> = [];

  for (const t of tables) {
    const records = await db
      .table(t)
      .filter((r: SyncedEntity) => r._syncStatus === 'conflict')
      .toArray();

    for (const record of records) {
      conflicts.push({
        table: t,
        localId: record._localId!,
        record,
      });
    }
  }

  return conflicts;
}
