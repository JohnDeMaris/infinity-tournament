# Specification: OfflineFirst

## Overview

**Topic of Concern:** Offline-first data layer with background sync

**Job to Be Done:** When I'm at a tournament venue with poor WiFi, I want the app to work instantly regardless of network conditions, so I can submit scores, view standings, and manage the event without delays or failures.

## Context

Tournament venues often have unreliable WiFi. Current apps fail or become unusably slow when network is spotty. An offline-first architecture ensures all operations hit local IndexedDB first (<10ms latency), then sync in the background when connectivity is available. This is the foundation for all other features.

## Requirements

### Functional Requirements

1. **[OFF-001]** All data operations read/write to IndexedDB first
   - User perceives instant response (<50ms)
   - No network dependency for core operations

2. **[OFF-002]** Change queue tracks pending sync operations
   - FIFO processing order
   - Persists across browser sessions
   - Retry with exponential backoff

3. **[OFF-003]** Background sync when connectivity returns
   - Automatic detection of online/offline state
   - Service worker handles sync events
   - No user action required

4. **[OFF-004]** Conflict resolution for concurrent edits
   - Last-write-wins for most fields
   - Special merge logic for match scores (both confirmations preserved)
   - TO override capability for disputes

5. **[OFF-005]** Sync status indicator visible to users
   - Shows: synced, pending, conflict, error states
   - Count of pending changes

### Non-Functional Requirements

- **Performance:** Score submission <50ms local, full sync <5s when online
- **Reliability:** Zero data loss during offline/online transitions
- **Storage:** Support offline operation for entire tournament duration

## User Stories

### Story 1: Player Submits Scores Offline
**As a** tournament player
**I want** to submit my match scores even when WiFi drops
**So that** the round can proceed without waiting for network

**Acceptance Criteria:**
- Given I'm offline, when I submit scores, then they save locally immediately
- Given I come back online, when sync runs, then my scores appear for everyone
- Given my opponent also submitted offline, when both sync, then scores merge correctly

### Story 2: TO Manages Tournament Offline
**As a** tournament organizer
**I want** to generate pairings and manage rounds without network
**So that** venue WiFi issues don't delay the event

**Acceptance Criteria:**
- Given I'm offline, when I start a new round, then pairings generate from local data
- Given multiple TOs edit simultaneously, when both sync, then conflicts resolve gracefully

### Story 3: User Sees Sync Status
**As a** user
**I want** to see whether my changes are synced
**So that** I know if I need to wait before leaving

**Acceptance Criteria:**
- Given I have pending changes, when I view the app, then I see a sync indicator
- Given all changes are synced, when I view the app, then the indicator shows "synced"

## Technical Notes

- Use **Dexie.js** for IndexedDB (TypeScript-first, best DX)
- Service Worker for background sync registration
- React hooks for optimistic updates (`createLocalRecord`, `updateLocalRecord`)
- Supabase real-time subscriptions invalidate local cache on server changes

### Database Schema (IndexedDB)

```typescript
interface SyncedEntity {
  id: string | null;      // Server ID (null if created offline)
  _localId?: number;       // IndexedDB auto-increment
  _syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  _lastModified: number;   // Client timestamp
  _serverTimestamp?: string;
}
```

### Change Queue

```typescript
interface ChangeQueueEntry {
  table: string;
  recordId: string | null;
  localId: number;
  operation: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
  attempts: number;
}
```

## Out of Scope

- Real-time collaboration (Phase 1)
- Push notifications (Phase 5)
- Mobile app sync (Phase 11)
- Conflict resolution UI for complex disputes (manual TO intervention sufficient for MVP)

## Open Questions

- [ ] IndexedDB storage quotas - test with large tournaments (64+ players, 6 rounds)
- [ ] Service worker update strategy - how to deploy new versions without disrupting active tournaments

## References

- PRD Section 3: Core Architecture: Offline-First Speed
- PRD Section 14: Files to Create/Modify
