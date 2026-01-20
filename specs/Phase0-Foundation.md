# Phase 0: Foundation (Architecture Refactor)

**PRD Reference:** Section 5 - Feature Phases, Phase 0
**Priority:** P0 - Critical Foundation
**Status:** In Progress

## Overview

Transform the existing MVP into a robust, game-agnostic platform with offline-first architecture. Everything else depends on this foundation.

## Jobs to Be Done

### JTBD-001: Offline-First Data Access
**When** I'm at a tournament venue with poor WiFi
**I want** the app to work instantly regardless of network conditions
**So that** I can submit scores, view standings, and manage the event without delays

### JTBD-002: Game System Modularity
**When** I want to run a tournament for a different tabletop game
**I want** to select my game system and have appropriate scoring rules
**So that** the platform works for multiple games, not just Infinity

### JTBD-003: Seamless Sync
**When** I make changes offline and come back online
**I want** my changes to sync automatically without data loss
**So that** I don't have to worry about connectivity

---

## Functional Requirements

### FR-001: Local-First Data Layer
- All data operations hit IndexedDB first (<10ms latency)
- Background sync to Supabase when online
- Clear sync status indicator (synced/pending/conflict)
- Works completely offline for core functions

### FR-002: Game System Plugin Interface
- Abstract scoring configuration (fields, tiebreakers, winner determination)
- Abstract faction/army configuration
- Optional hidden information tracking
- UI customization per game

### FR-003: Infinity Game Module
- Implement GameSystem interface for Infinity
- OP/VP/AP scoring fields
- 11 factions + sectorials
- Classified objectives tracking
- Army list parser for Infinity Army exports

### FR-004: Sync Engine
- Change queue for pending operations
- Conflict detection and resolution
- Last-write-wins for most fields
- Special merge logic for match scores (both confirmations preserved)
- TO override capability

### FR-005: Service Worker
- Cache static assets for offline access
- Background sync when connectivity returns
- Sync status notifications

### FR-006: Database Schema Updates
- Add game_system_id to tournaments
- Generic scores JSONB field for matches
- Preserve backward compatibility with existing data

---

## Non-Functional Requirements

### NFR-001: Performance
- Score submission latency: <50ms (local)
- First Contentful Paint: <1.5s
- Works offline for 100% of core functions

### NFR-002: Data Integrity
- No data loss during offline/online transitions
- Conflict resolution preserves both player confirmations
- Audit log of all sync operations

### NFR-003: Migration
- Existing tournaments continue to work
- No data migration required for existing records
- Graceful fallback if IndexedDB unavailable

---

## Technical Architecture

### Monorepo Structure
```
infinity-tournament/
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── games/          # Game system plugins
│       │   ├── sync/           # Offline sync engine
│       │   ├── pairing/        # Swiss algorithm
│       │   └── scoring/        # Standings calculation
│       └── package.json
├── src/                        # Web app (existing)
├── turbo.json
└── pnpm-workspace.yaml
```

### Key Technologies
- **Dexie.js** - IndexedDB wrapper with TypeScript
- **Service Worker** - Background sync, asset caching
- **Turborepo** - Monorepo management

---

## Acceptance Criteria

- [ ] App works fully offline (create tournament, enter scores, view standings)
- [ ] Syncs automatically when online
- [ ] Conflict resolution handles concurrent edits
- [ ] All Infinity-specific code isolated to game module
- [ ] Existing tournaments continue to work
- [ ] Sync status visible to users
- [ ] <50ms latency for score submission

---

## Implementation Status

### Completed
- [x] Monorepo structure (turbo.json, pnpm-workspace.yaml)
- [x] packages/shared package setup
- [x] Game system types interface (GameSystem, ScoreField, etc.)
- [x] Infinity game module (factions, hidden info, parser)
- [x] Game registry
- [x] Dexie.js database schema
- [x] Change queue implementation
- [x] Conflict resolver
- [x] Sync engine core
- [x] React hooks for local data access

### In Progress
- [ ] Service worker for background sync
- [ ] Database migration for game_systems
- [ ] Refactor score-form to use game config
- [ ] Update standings to use game system
- [ ] Wire up sync engine to existing components

### Not Started
- [ ] Sync status indicator component
- [ ] Integration testing
- [ ] Migration testing with existing data

---

## Dependencies

- Existing MVP foundation (auth, tournament CRUD, pairing)
- Supabase real-time subscriptions
- Browser IndexedDB support

## Risks

| Risk | Mitigation |
|------|------------|
| Offline sync conflicts | CRDT-based resolution, TO override |
| IndexedDB quotas | Periodic cleanup of old data |
| Service worker complexity | Progressive enhancement |
