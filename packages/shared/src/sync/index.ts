// Database and types
export {
  getDatabase,
  clearLocalDatabase,
  isIndexedDBSupported,
  TournamentDatabase,
  type SyncStatus,
  type SyncedEntity,
  type LocalUser,
  type LocalTournament,
  type LocalRegistration,
  type LocalRound,
  type LocalMatch,
  type ChangeQueueEntry,
  type ChangeOperation,
} from './db';

// Change queue
export {
  enqueueChange,
  getPendingChanges,
  getPendingChangesForTable,
  dequeueChange,
  markChangeFailed,
  getPendingChangeCount,
  getFailedChanges,
  clearFailedChanges,
  getRetryDelay,
  hasRetryableChanges,
} from './queue';

// Conflict resolution
export {
  resolveConflict,
  hasConflict,
  markConflict,
  getConflicts,
  type ConflictStrategy,
  type ConflictInfo,
  type ResolutionResult,
} from './resolver';

// Sync engine
export {
  SyncEngine,
  initializeSyncEngine,
  getSyncEngine,
  type SyncConfig,
  type SyncStatus as EngineSyncStatus,
  type ConflictEvent,
} from './engine';

// React hooks for local data
export {
  createLocalRecord,
  updateLocalRecord,
  deleteLocalRecord,
  getLocalRecord,
  getLocalRecordByServerId,
  queryLocalRecords,
  getAllLocalRecords,
  submitMatchScores,
  getRecordSyncStatus,
  getPendingChangeCount as getPendingCount,
  hasPendingChanges,
} from './hooks';
