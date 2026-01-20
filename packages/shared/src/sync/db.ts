import Dexie, { type Table } from 'dexie';

/**
 * Local IndexedDB Schema for Offline-First Architecture
 *
 * This database mirrors the Supabase schema but adds:
 * - Local-only fields (_localId, _syncStatus, _lastModified)
 * - Change queue for pending sync operations
 */

// ============================================================================
// Entity Types (mirror Supabase schema + sync metadata)
// ============================================================================

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

/** Base interface for all synced entities */
export interface SyncedEntity {
  /** Server-assigned UUID (null if created offline) */
  id: string | null;
  /** Local auto-increment ID for IndexedDB */
  _localId?: number;
  /** Sync status */
  _syncStatus: SyncStatus;
  /** Last local modification timestamp */
  _lastModified: number;
  /** Server timestamp from last sync */
  _serverTimestamp?: string;
}

export interface LocalUser extends SyncedEntity {
  id: string;
  email: string;
  name: string;
  role: 'player' | 'to' | 'admin';
  faction_preference: string | null;
}

export interface LocalTournament extends SyncedEntity {
  id: string | null;
  name: string;
  description: string | null;
  date_start: string;
  date_end: string | null;
  location: string;
  organizer_id: string;
  point_limit: number;
  rounds: number;
  time_limit: number;
  max_capacity: number | null;
  registration_deadline: string | null;
  list_deadline: string | null;
  status: 'draft' | 'registration' | 'active' | 'completed';
  settings: Record<string, unknown>;
  game_system_id: string;
}

export interface LocalRegistration extends SyncedEntity {
  id: string | null;
  tournament_id: string;
  user_id: string;
  army_list_code: string | null;
  army_faction: string | null;
  status: 'registered' | 'waitlist' | 'dropped';
}

export interface LocalRound extends SyncedEntity {
  id: string | null;
  tournament_id: string;
  round_number: number;
  status: 'pairing' | 'active' | 'completed';
}

export interface LocalMatch extends SyncedEntity {
  id: string | null;
  round_id: string;
  player1_id: string;
  player2_id: string | null;
  table_number: number;
  /** Generic scores stored as JSON */
  scores: {
    player1: Record<string, number>;
    player2: Record<string, number> | null;
  } | null;
  confirmed_by_p1: boolean;
  confirmed_by_p2: boolean;
  confirmation_status: 'pending' | 'partial' | 'disputed' | 'confirmed' | 'completed';
  winner_id: string | null;
  is_bye: boolean;
  /** Hidden information state */
  match_state: Record<string, unknown>;
  /** Immutable log of state changes */
  state_log: Array<{
    timestamp: string;
    action: string;
    player_id: string;
    data: unknown;
  }>;
}

// ============================================================================
// Change Queue Types
// ============================================================================

export type ChangeOperation = 'insert' | 'update' | 'delete';

export interface ChangeQueueEntry {
  /** Auto-increment ID */
  id?: number;
  /** Table name */
  table: string;
  /** Server record ID (null for inserts) */
  recordId: string | null;
  /** Local ID for correlation */
  localId: number;
  /** Operation type */
  operation: ChangeOperation;
  /** Data payload */
  payload: Record<string, unknown>;
  /** Client timestamp */
  timestamp: number;
  /** Number of sync attempts */
  attempts: number;
  /** Last error message */
  lastError?: string;
}

// ============================================================================
// Dexie Database Class
// ============================================================================

export class TournamentDatabase extends Dexie {
  users!: Table<LocalUser, number>;
  tournaments!: Table<LocalTournament, number>;
  registrations!: Table<LocalRegistration, number>;
  rounds!: Table<LocalRound, number>;
  matches!: Table<LocalMatch, number>;
  changeQueue!: Table<ChangeQueueEntry, number>;

  constructor() {
    super('InfinityTournamentDB');

    this.version(1).stores({
      // Primary key is _localId (auto-increment), indexed by server id
      users: '++_localId, id, email, name',
      tournaments: '++_localId, id, organizer_id, status, date_start, game_system_id',
      registrations: '++_localId, id, tournament_id, user_id, [tournament_id+user_id]',
      rounds: '++_localId, id, tournament_id, round_number, [tournament_id+round_number]',
      matches: '++_localId, id, round_id, player1_id, player2_id, confirmation_status',
      changeQueue: '++id, table, recordId, timestamp',
    });
  }
}

// Singleton instance
let db: TournamentDatabase | null = null;

/**
 * Get the database instance
 */
export function getDatabase(): TournamentDatabase {
  if (!db) {
    db = new TournamentDatabase();
  }
  return db;
}

/**
 * Table name to typed table mapping
 */
export type TableName = 'users' | 'tournaments' | 'registrations' | 'rounds' | 'matches' | 'changeQueue';

/**
 * Get a table by name (for dynamic access)
 */
export function getTable(tableName: TableName): Table<SyncedEntity, number> {
  const database = getDatabase();
  switch (tableName) {
    case 'users':
      return database.users as Table<SyncedEntity, number>;
    case 'tournaments':
      return database.tournaments as Table<SyncedEntity, number>;
    case 'registrations':
      return database.registrations as Table<SyncedEntity, number>;
    case 'rounds':
      return database.rounds as Table<SyncedEntity, number>;
    case 'matches':
      return database.matches as Table<SyncedEntity, number>;
    case 'changeQueue':
      return database.changeQueue as unknown as Table<SyncedEntity, number>;
    default:
      throw new Error(`Unknown table: ${tableName}`);
  }
}

/**
 * Clear all local data (for logout or reset)
 */
export async function clearLocalDatabase(): Promise<void> {
  const database = getDatabase();
  await Promise.all([
    database.users.clear(),
    database.tournaments.clear(),
    database.registrations.clear(),
    database.rounds.clear(),
    database.matches.clear(),
    database.changeQueue.clear(),
  ]);
}

/**
 * Check if running in browser with IndexedDB support
 */
export function isIndexedDBSupported(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}
