# Specification: RealTimePolish

## Overview

**Topic of Concern:** Real-time data synchronization and UI responsiveness

**Job to Be Done:** When I'm viewing tournament standings or match results, I want to see updates instantly without refreshing the page, so I can stay informed during live events.

## Context

Phase 0 established the offline-first foundation with IndexedDB and background sync. Phase 1 builds on this by adding real-time subscriptions from Supabase, optimistic UI patterns, and polish elements like toast notifications and loading states. This creates the perception of instant responsiveness.

## Requirements

### Functional Requirements

1. **[RTP-001]** Real-time standings updates via Supabase subscriptions
   - Subscribe to matches table changes
   - Invalidate local cache when server changes detected
   - Update standings display without page refresh

2. **[RTP-002]** Optimistic UI for score submission
   - Show updated state immediately on user action
   - Reconcile with server response
   - Handle rollback on failure

3. **[RTP-003]** Toast notifications for user feedback
   - Success messages for completed actions
   - Error messages with retry options
   - Info messages for background events

4. **[RTP-004]** Skeleton loaders for loading states
   - Show loading skeletons while data fetches
   - Smooth transitions from skeleton to content
   - Consistent skeleton patterns across pages

5. **[RTP-005]** Sync status indicator
   - Show sync state in header (synced, pending, offline)
   - Display count of pending changes
   - Allow manual sync trigger

### Non-Functional Requirements

- **Performance:** UI updates within 100ms of data change
- **Reliability:** No data loss during optimistic updates
- **UX:** Smooth animations for state transitions

## User Stories

### Story 1: Player Sees Live Standings
**As a** tournament player
**I want** to see standings update in real-time
**So that** I know my position without refreshing

**Acceptance Criteria:**
- Given I'm viewing standings, when another match completes, then standings update automatically
- Given standings change, when my rank changes, then the row animates to new position
- Given I'm offline, when I come online, then standings sync without page refresh

### Story 2: Player Gets Immediate Feedback
**As a** player submitting scores
**I want** to see my action reflected immediately
**So that** I know my submission was received

**Acceptance Criteria:**
- Given I submit scores, when I press submit, then UI updates optimistically
- Given submission succeeds, when server confirms, then toast shows success
- Given submission fails, when server rejects, then UI rolls back with error toast

### Story 3: User Understands Loading State
**As a** user
**I want** to see meaningful loading indicators
**So that** I know the app is working

**Acceptance Criteria:**
- Given page is loading, when data fetches, then skeleton loaders show content structure
- Given data arrives, when rendering completes, then skeleton fades smoothly to content
- Given load fails, when timeout occurs, then error state shows with retry option

### Story 4: User Knows Sync Status
**As a** user with pending changes
**I want** to see sync status
**So that** I know if my changes are saved

**Acceptance Criteria:**
- Given I have pending changes, when I view the header, then sync indicator shows pending count
- Given I'm offline, when network drops, then indicator shows offline state
- Given I click sync indicator, when online, then manual sync triggers

## Technical Notes

### Supabase Realtime Setup
```typescript
// Subscribe to matches for a tournament
const channel = supabase.channel(`tournament:${id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'matches',
    filter: `round_id=in.(${roundIds})`
  }, (payload) => {
    // Invalidate local cache, recalculate standings
  })
  .subscribe();
```

### Optimistic Update Pattern
```typescript
// 1. Update local state immediately
// 2. Send to server
// 3. On success: confirm local state
// 4. On failure: rollback local state, show error
```

### Toast Integration
- Use `sonner` (already installed) for toast notifications
- Configure consistent styles for success/error/info
- Include action buttons for dismissable errors

### Skeleton Components
- Create reusable skeleton components in `src/components/ui/skeleton.tsx`
- Use Tailwind `animate-pulse` for animation
- Match actual content dimensions closely

## Out of Scope

- Push notifications (Phase 5)
- Spectator-specific features (Phase 6)
- Match state real-time updates (Phase 2)
- Complex conflict resolution UI (just handle gracefully)

## Open Questions

- [x] Which tables need real-time subscriptions? (matches, rounds, registrations)
- [ ] Should standings recalculation happen client-side or request from server?
- [ ] Rate limiting on subscriptions for large tournaments?

## References

- PRD Section 5: Phase 1 features
- Supabase Realtime docs: https://supabase.com/docs/guides/realtime
- Sonner docs: https://sonner.emilkowal.ski/
