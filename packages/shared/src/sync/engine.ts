import {
  getDatabase,
  getTable,
  type SyncedEntity,
  type TableName,
} from './db';
import {
  getPendingChanges,
  dequeueChange,
  markChangeFailed,
  type ChangeQueueEntry,
} from './queue';
import { resolveConflict, hasConflict } from './resolver';

/**
 * Sync Engine
 *
 * Orchestrates bidirectional sync between local IndexedDB and Supabase.
 * Handles:
 * - Pushing local changes to server
 * - Pulling server changes to local
 * - Conflict resolution
 * - Online/offline state management
 */

export interface SyncConfig {
  /** Supabase client instance */
  supabase: SupabaseClient;
  /** Called when sync status changes */
  onStatusChange?: (status: SyncStatus) => void;
  /** Called when a conflict requires manual resolution */
  onConflict?: (conflict: ConflictEvent) => void;
  /** Sync interval in ms (default: 30000) */
  syncInterval?: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

export interface ConflictEvent {
  table: string;
  recordId: string;
  localVersion: unknown;
  serverVersion: unknown;
}

// Minimal Supabase client interface
interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: unknown[]; error: unknown }>;
    insert: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
    update: (data: unknown) => {
      eq: (column: string, value: unknown) => Promise<{ data: unknown; error: unknown }>;
    };
    delete: () => {
      eq: (column: string, value: unknown) => Promise<{ error: unknown }>;
    };
    upsert: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
  };
}

let syncEngine: SyncEngine | null = null;

/**
 * Sync Engine Class
 */
export class SyncEngine {
  private config: SyncConfig;
  private status: SyncStatus = 'idle';
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isOnline: boolean = true;

  constructor(config: SyncConfig) {
    this.config = config;
    this.setupNetworkListeners();
  }

  /**
   * Start the sync engine
   */
  start(): void {
    if (this.syncInterval) return;

    // Initial sync
    this.sync();

    // Periodic sync
    const interval = this.config.syncInterval ?? 30000;
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.status !== 'syncing') {
        this.sync();
      }
    }, interval);
  }

  /**
   * Stop the sync engine
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Manually trigger a sync
   */
  async sync(): Promise<void> {
    if (!this.isOnline || this.status === 'syncing') {
      return;
    }

    this.setStatus('syncing');

    try {
      // 1. Push local changes to server
      await this.pushChanges();

      // 2. Pull server changes to local
      await this.pullChanges();

      this.setStatus('idle');
    } catch (error) {
      console.error('Sync error:', error);
      this.setStatus('error');
    }
  }

  /**
   * Push pending local changes to server
   */
  private async pushChanges(): Promise<void> {
    const changes = await getPendingChanges();

    for (const change of changes) {
      try {
        await this.pushSingleChange(change);
        await dequeueChange(change.id!);
      } catch (error) {
        const canRetry = await markChangeFailed(
          change.id!,
          error instanceof Error ? error.message : 'Unknown error'
        );
        if (!canRetry) {
          console.error('Change permanently failed:', change);
        }
      }
    }
  }

  /**
   * Push a single change to the server
   */
  private async pushSingleChange(change: ChangeQueueEntry): Promise<void> {
    const { table, recordId, operation, payload } = change;

    switch (operation) {
      case 'insert': {
        const { error, data } = await this.config.supabase
          .from(table)
          .insert(payload);
        if (error) throw error;

        // Update local record with server ID
        if (data && typeof data === 'object' && 'id' in data) {
          const tableRef = getTable(table as TableName);
          await tableRef.update(change.localId, {
            id: (data as { id: string }).id,
            _syncStatus: 'synced',
          });
        }
        break;
      }

      case 'update': {
        if (!recordId) throw new Error('Update requires recordId');
        const { error } = await this.config.supabase
          .from(table)
          .update(payload)
          .eq('id', recordId);
        if (error) throw error;

        // Mark as synced
        const tableRef = getTable(table as TableName);
        await tableRef.update(change.localId, { _syncStatus: 'synced' });
        break;
      }

      case 'delete': {
        if (!recordId) throw new Error('Delete requires recordId');
        const { error } = await this.config.supabase
          .from(table)
          .delete()
          .eq('id', recordId);
        if (error) throw error;

        // Remove from local
        const tableRef = getTable(table as TableName);
        await tableRef.delete(change.localId);
        break;
      }
    }
  }

  /**
   * Pull changes from server to local
   */
  private async pullChanges(): Promise<void> {
    const tables = ['tournaments', 'registrations', 'rounds', 'matches'];

    for (const table of tables) {
      await this.pullTableChanges(table);
    }
  }

  /**
   * Pull changes for a specific table
   */
  private async pullTableChanges(table: string): Promise<void> {
    const tableRef = getTable(table as TableName);

    // Get last sync timestamp for this table
    // In a full implementation, we'd track this per-table
    const { data, error } = await this.config.supabase.from(table).select('*');

    if (error) {
      console.error(`Error pulling ${table}:`, error);
      return;
    }

    if (!data || !Array.isArray(data)) return;

    for (const serverRecord of data as SyncedEntity[]) {
      // Skip records without a server ID
      if (!serverRecord.id) continue;

      // Find matching local record
      const localRecord = await tableRef
        .where('id')
        .equals(serverRecord.id)
        .first();

      if (!localRecord) {
        // New record from server - add locally
        await tableRef.add({
          ...serverRecord,
          _syncStatus: 'synced',
          _lastModified: Date.now(),
          _serverTimestamp: new Date().toISOString(),
        });
      } else if (hasConflict(localRecord, serverRecord)) {
        // Conflict - resolve it
        const result = resolveConflict({
          localVersion: localRecord,
          serverVersion: serverRecord,
          table,
          recordId: serverRecord.id!,
        });

        if (result.requiresUserAction && this.config.onConflict) {
          this.config.onConflict({
            table,
            recordId: serverRecord.id!,
            localVersion: localRecord,
            serverVersion: serverRecord,
          });
        }

        await tableRef.update(localRecord._localId!, {
          ...result.resolved,
          _serverTimestamp: new Date().toISOString(),
        });
      } else {
        // No conflict - update local with server version
        await tableRef.update(localRecord._localId!, {
          ...serverRecord,
          _localId: localRecord._localId,
          _syncStatus: 'synced',
          _lastModified: localRecord._lastModified,
          _serverTimestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Setup network state listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.setStatus('idle');
      this.sync(); // Sync immediately when back online
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.setStatus('offline');
    });

    // Initial state
    this.isOnline = navigator.onLine;
    if (!this.isOnline) {
      this.setStatus('offline');
    }
  }

  /**
   * Set and broadcast status change
   */
  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.config.onStatusChange?.(status);
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Check if currently online
   */
  isOnlineNow(): boolean {
    return this.isOnline;
  }
}

/**
 * Initialize the sync engine singleton
 */
export function initializeSyncEngine(config: SyncConfig): SyncEngine {
  if (syncEngine) {
    syncEngine.stop();
  }
  syncEngine = new SyncEngine(config);
  return syncEngine;
}

/**
 * Get the sync engine singleton
 */
export function getSyncEngine(): SyncEngine | null {
  return syncEngine;
}
