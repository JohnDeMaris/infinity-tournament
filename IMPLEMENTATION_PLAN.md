# Implementation Plan

Generated from specifications in `specs/`. Updated by Wiggum Plan workflow.

## Summary

**Specs processed:** OfflineFirst, GameSystemPlugin, RealTimePolish, HiddenInformation, ListValidation, PlayerStatistics, SpectatorMode, AdminDashboard, Notifications, Stability-Hardening, TechnicalDebt, **v1.1-v2-Roadmap**
**Total tasks:** 109
**Completed:** 101
**In Progress:** 0
**Pending:** 8

---

## Tasks

### Legend
- `[ ]` PENDING - Not started
- `[~]` IN_PROGRESS - Currently being worked on
- `[x]` COMPLETED - Done and validated

### Priority Order

Tasks are ordered by dependency and importance. Work top-to-bottom.

---

## Phase 0: Foundation

### [P0-001] Create packages/shared with Dexie schema and sync engine

**Status:** [x] COMPLETED
**Spec:** `specs/OfflineFirst.md` [OFF-001, OFF-002, OFF-004]
**Size:** L

**Files Created:**
- `packages/shared/package.json`
- `packages/shared/src/sync/db.ts` - IndexedDB schema with Dexie
- `packages/shared/src/sync/queue.ts` - Change queue
- `packages/shared/src/sync/resolver.ts` - Conflict resolution
- `packages/shared/src/sync/engine.ts` - Sync orchestration
- `packages/shared/src/sync/hooks.ts` - React hooks
- `packages/shared/src/sync/index.ts` - Exports

**Acceptance Criteria:**
- [x] All data operations hit IndexedDB first
- [x] Change queue with retry logic
- [x] Conflict resolution strategies
- [x] Sync engine with push/pull

---

### [P0-002] Create service worker for background sync

**Status:** [x] COMPLETED
**Spec:** `specs/OfflineFirst.md` [OFF-003]
**Size:** M

**Files Created:**
- `public/sw.js` - Service worker
- `src/lib/sync/register-sw.ts` - Registration helper

**Acceptance Criteria:**
- [x] Service worker caches static assets
- [x] Background Sync API integration
- [x] Online/offline detection
- [x] Service worker registration helper

---

### [P0-003] Create GameSystem interface and Infinity module

**Status:** [x] COMPLETED
**Spec:** `specs/GameSystemPlugin.md` [GSP-001, GSP-002, GSP-003]
**Size:** L

**Files Created:**
- `packages/shared/src/games/types.ts` - GameSystem interface
- `packages/shared/src/games/registry.ts` - Game registry
- `packages/shared/src/games/infinity/index.ts` - Infinity module
- `packages/shared/src/games/infinity/factions.ts` - 48 factions
- `packages/shared/src/games/infinity/hidden-info.ts` - Classifieds
- `packages/shared/src/games/infinity/parser.ts` - Army list parser
- `packages/shared/src/games/index.ts` - Exports

**Acceptance Criteria:**
- [x] GameSystem interface fully defined
- [x] Infinity scoring: OP/VP/AP fields
- [x] Infinity factions: 11 main + sectorials
- [x] Game registry with getDefault()

---

### [P0-004] Add monorepo configuration

**Status:** [x] COMPLETED
**Spec:** PRD Phase 0
**Size:** S

**Files Created:**
- `turbo.json` - Turborepo config
- `pnpm-workspace.yaml` - Workspace definition

**Acceptance Criteria:**
- [x] Turborepo build tasks
- [x] pnpm workspace configured

---

### [P0-005] Install shared package dependencies

**Status:** [x] COMPLETED
**Spec:** `specs/OfflineFirst.md`
**Size:** S

**Acceptance Criteria:**
- [x] Dexie installed in packages/shared

---

### [P0-006] Add database migration for game_system_id

**Status:** [x] COMPLETED
**Spec:** `specs/GameSystemPlugin.md` [GSP-006]
**Size:** M
**Depends on:** None

**Description:**
Add game_system_id column to tournaments table and generic scores to matches.

**Files Created:**
- `supabase/migrations/002_game_systems.sql`

**Files Modified:**
- `src/types/database.ts` - Added game_system_id to Tournament, MatchScores type, scores/match_state to Match

**Acceptance Criteria:**
- [x] tournaments.game_system_id VARCHAR(50) DEFAULT 'infinity'
- [x] matches.scores JSONB column for generic scores
- [x] matches.match_state JSONB for hidden info
- [x] Tournament TypeScript type updated
- [x] Existing data remains unchanged (migration uses DEFAULT 'infinity')

---

### [P0-007] Refactor score-form to use game system config

**Status:** [x] COMPLETED
**Spec:** `specs/GameSystemPlugin.md` [GSP-004]
**Size:** L
**Depends on:** P0-006

**Description:**
Update score entry form to dynamically render fields from GameSystem.scoring.fields config instead of hard-coded OP/VP/AP.

**Files Created:**
- `src/components/scoring/game-score-field.tsx` - Reusable score field component with validation

**Files Modified:**
- `src/components/scoring/score-form.tsx` - Refactored to use dynamic field rendering
- `package.json` - Added @infinity-tournament/shared dependency

**Acceptance Criteria:**
- [x] Form reads fields from `getGameSystem(gameSystemId).scoring.fields`
- [x] Field validation uses ScoreField.min/max
- [x] AP max uses tournament.pointLimit when field.maxFromTournament === 'pointLimit'
- [x] Labels and descriptions come from config
- [x] Works for any registered game system
- [x] Backwards compatible with legacy player1_op/vp/ap fields

---

### [P0-008] Refactor standings calculation to use game system

**Status:** [x] COMPLETED
**Spec:** `specs/GameSystemPlugin.md` [GSP-005]
**Size:** M
**Depends on:** P0-006

**Description:**
Update standings.ts to use game system tiebreaker order and winner determination function instead of hard-coded Infinity logic.

**Files Modified:**
- `src/lib/scoring/standings.ts` - Refactored to use game system config
- `src/types/database.ts` - Added generic scores to Standing interface

**Acceptance Criteria:**
- [x] `calculateStandings()` accepts gameSystemId parameter
- [x] Sorting uses `gameSystem.scoring.tiebreakers` array in order
- [x] Winner determination uses `gameSystem.scoring.determineWinner()`
- [x] Works with generic scores JSONB (not hard-coded op/vp/ap)
- [x] Backwards compatible with existing Infinity tournaments (legacy field fallback)

---

## Phase 1: Real-time & Polish

### [P1-001] Add Toaster to root layout and public pages

**Status:** [x] COMPLETED
**Spec:** `specs/RealTimePolish.md` [RTP-003]
**Size:** S
**Depends on:** None

**Description:**
Add Toaster component to root layout so toast notifications work on all pages including public pages.

**Files Modified:**
- `src/app/layout.tsx` - Added Toaster component
- `src/app/dashboard/layout.tsx` - Removed duplicate Toaster
- `src/app/to/layout.tsx` - Removed duplicate Toaster

**Acceptance Criteria:**
- [x] Toaster component added to root layout
- [x] Toast notifications work on public pages (events, standings)
- [x] No duplicate Toasters (removed from dashboard/to layouts)

---

### [P1-002] Create sync status indicator component

**Status:** [x] COMPLETED
**Spec:** `specs/RealTimePolish.md` [RTP-005]
**Size:** M
**Depends on:** None

**Description:**
Create a header component that shows sync status (synced, pending, offline) with pending change count.

**Files Created:**
- `src/components/layout/sync-status.tsx` - Sync status indicator component

**Files Modified:**
- `src/components/layout/header.tsx` - Added sync status indicator

**Acceptance Criteria:**
- [x] Shows "Synced" when no pending changes
- [x] Shows pending count when changes queued
- [x] Shows "Offline" when network unavailable
- [x] Shows "Syncing" during active sync
- [x] Click triggers manual sync when online

---

### [P1-003] Initialize sync engine in app layout

**Status:** [x] COMPLETED
**Spec:** `specs/RealTimePolish.md` [RTP-005]
**Size:** M
**Depends on:** P1-002

**Description:**
Initialize the sync engine from packages/shared in the app layout so offline sync works throughout the app.

**Files Created:**
- `src/components/providers/sync-provider.tsx` - Context provider for sync engine

**Files Modified:**
- `src/app/layout.tsx` - Wrapped app with sync provider

**Acceptance Criteria:**
- [x] Sync engine initializes on app load
- [x] Sync engine connects to Supabase
- [x] Background sync triggers when online
- [x] Service worker registered

---

### [P1-004] Add skeleton loaders to data-fetching pages

**Status:** [x] COMPLETED
**Spec:** `specs/RealTimePolish.md` [RTP-004]
**Size:** M
**Depends on:** None

**Description:**
Add loading.tsx files with skeleton loaders for all pages that fetch data.

**Files Created:**
- `src/app/(public)/events/loading.tsx` - Event list skeleton
- `src/app/(public)/events/[id]/loading.tsx` - Event detail skeleton
- `src/app/(public)/events/[id]/standings/loading.tsx` - Standings table skeleton
- `src/app/dashboard/events/[id]/list/loading.tsx` - Army list form skeleton
- `src/app/dashboard/events/[id]/match/[matchId]/loading.tsx` - Match score form skeleton

**Acceptance Criteria:**
- [x] Skeleton loaders match actual content layout
- [x] Smooth transition from skeleton to content
- [x] Consistent skeleton patterns across pages

---

### [P1-005] Add Supabase realtime subscriptions for standings

**Status:** [x] COMPLETED
**Spec:** `specs/RealTimePolish.md` [RTP-001]
**Size:** L
**Depends on:** P1-003

**Description:**
Add Supabase realtime subscriptions to standings page so it updates automatically when match scores change.

**Files Created:**
- `src/hooks/use-realtime-standings.ts` - Custom hook for realtime standings
- `src/components/tournament/realtime-standings.tsx` - Client component for realtime display

**Files Modified:**
- `src/app/(public)/events/[id]/standings/page.tsx` - Use realtime standings component

**Acceptance Criteria:**
- [x] Standings update automatically when any match completes
- [x] No page refresh required
- [x] Graceful degradation when offline
- [x] Unsubscribe on unmount to prevent memory leaks

---

### [P1-006] Implement optimistic UI for score submission

**Status:** [x] COMPLETED
**Spec:** `specs/RealTimePolish.md` [RTP-002]
**Size:** L
**Depends on:** P1-003

**Description:**
Refactor score-form to use optimistic updates instead of waiting for server response.

**Files Modified:**
- `src/components/scoring/score-form.tsx` - Added optimistic state, loading toasts, rollback on error

**Acceptance Criteria:**
- [x] Score updates show immediately in UI
- [x] Success toast shows after server confirms
- [x] On failure, UI rolls back with error toast
- [x] Form is not disabled during submission (shows loading state instead)

---

## Phase 2: Hidden Information Tracking

### [P2-001] Define MatchState and PlayerHiddenState types

**Status:** [x] COMPLETED
**Spec:** `specs/HiddenInformation.md` [HID-005]
**Size:** S
**Depends on:** None

**Description:**
Create TypeScript types for hidden game state, extending existing types in packages/shared.

**Files Created:**
- `packages/shared/src/games/infinity/match-state.ts` - MatchState, PlayerHiddenState, StateHistoryEntry types

**Files Modified:**
- `packages/shared/src/games/infinity/index.ts` - Export new types
- `packages/shared/src/games/index.ts` - Export match-state types
- `src/types/database.ts` - Import MatchState and use in Match interface

**Acceptance Criteria:**
- [x] MatchState interface with player1/player2/history
- [x] PlayerHiddenState with classifieds, hidden_deployment, data_tracker, lieutenant
- [x] StateHistoryEntry with timestamp, player_id, action, field, old_value, new_value
- [x] Types exported from packages/shared
- [x] Helper functions: createEmptyMatchState, createHistoryEntry, parseMatchState

---

### [P2-002] Create hidden-info-panel component

**Status:** [x] COMPLETED
**Spec:** `specs/HiddenInformation.md` [HID-001]
**Size:** M
**Depends on:** P2-001

**Description:**
Create the main collapsible panel that contains all hidden info tracking UI.

**Files Created:**
- `src/components/match/hidden-info-panel.tsx` - Collapsible panel with all sub-sections
- `src/components/match/index.ts` - Exports

**Acceptance Criteria:**
- [x] Collapsible panel with open/close state
- [x] Shows current player's hidden state
- [x] Only visible to owning player
- [x] Integrates child components (classified, deployment, data tracker, lieutenant)

---

### [P2-003] Create classified-selector component

**Status:** [x] COMPLETED
**Spec:** `specs/HiddenInformation.md` [HID-002]
**Size:** M
**Depends on:** P2-001

**Description:**
Dropdown component for selecting classified objectives from the ITS list.

**Files Created:**
- Inline in `src/components/match/hidden-info-panel.tsx` as ClassifiedsSection

**Acceptance Criteria:**
- [x] Dropdown with all ITS classified objectives
- [x] Select exactly 2 classifieds
- [x] Lock button with timestamp
- [x] Reveal button for each classified with timestamp
- [x] Disabled state when locked

---

### [P2-004] Create hidden-deployment-list component

**Status:** [x] COMPLETED
**Spec:** `specs/HiddenInformation.md` [HID-003]
**Size:** M
**Depends on:** P2-001

**Description:**
Free-form text list for tracking hidden deployment units.

**Files Created:**
- Inline in `src/components/match/hidden-info-panel.tsx` as HiddenDeploymentSection

**Acceptance Criteria:**
- [x] Add/remove hidden deployment units (free-form text)
- [x] Mark individual units as revealed with timestamp
- [x] Show reveal time for revealed units
- [x] No limit on number of hidden units

---

### [P2-005] Create data-tracker-field component

**Status:** [x] COMPLETED
**Spec:** `specs/HiddenInformation.md` [HID-004]
**Size:** S
**Depends on:** P2-001

**Description:**
Simple text field for designating the Data Tracker unit.

**Files Created:**
- Inline in `src/components/match/hidden-info-panel.tsx` as DataTrackerSection

**Acceptance Criteria:**
- [x] Single text input for unit designation
- [x] Optional - can be left empty
- [x] Timestamp when designated
- [x] Editable until match complete

---

### [P2-006] Integrate hidden-info-panel into score-form

**Status:** [x] COMPLETED
**Spec:** `specs/HiddenInformation.md` [HID-001]
**Size:** M
**Depends on:** P2-002, P2-003, P2-004, P2-005

**Description:**
Add the hidden info panel to the score entry form, saving state to match_state JSONB.

**Files Modified:**
- `src/components/scoring/score-form.tsx` - Added HiddenInfoPanel, local state tracking, and save handler

**Acceptance Criteria:**
- [x] HiddenInfoPanel appears below score entry (for games with hiddenInfo config)
- [x] State saves to match.match_state JSONB
- [x] State history appended on each change
- [x] Works offline (local state saved, syncs in background)

---

### [P2-007] Create TO match detail page with hidden info viewer

**Status:** [x] COMPLETED
**Spec:** `specs/HiddenInformation.md` [HID-006]
**Size:** L
**Depends on:** P2-006

**Description:**
Create a TO-specific match detail page that shows hidden info for both players.

**Files Created:**
- `src/app/to/[id]/matches/[matchId]/page.tsx` - TO match detail page
- `src/components/match/to-hidden-info-viewer.tsx` - Side-by-side hidden info viewer

**Acceptance Criteria:**
- [x] TO can view all hidden info for both players
- [x] Shows side-by-side comparison
- [x] TO can edit entries (creates audit log entry with TO attribution)
- [x] Access restricted to tournament TO (ownership verified)

---

### [P2-008] Add state-history-log component for TO

**Status:** [x] COMPLETED
**Spec:** `specs/HiddenInformation.md` [HID-005, HID-006]
**Size:** M
**Depends on:** P2-007

**Description:**
Audit log component showing all state changes with timestamps.

**Files Created:**
- `src/components/match/state-history-log.tsx` - Audit log viewer

**Acceptance Criteria:**
- [x] Shows chronological list of all state changes (sorted newest first)
- [x] Each entry shows: timestamp, player, action, field, old/new values
- [x] TO edits marked with edited_by field
- [x] Read-only (TO edits through TOHiddenInfoViewer)

---

## Phase 3: List Validation

### [P3-001] Migrate ArmyListForm to shared package parser
**Status:** [x] COMPLETED
**Spec:** `specs/ListValidation.md` [LV-001]
**Size:** M
**Depends on:** None

**Description:**
Replace old `@/lib/army/parser.ts` with `@infinity-tournament/shared/games` parser functions.

**Files Modified:**
- `src/components/tournament/army-list-form.tsx` - Use shared parser
- `src/lib/army/parser.ts` - Deprecate (add comment)

**Acceptance Criteria:**
- [ ] Import parseInfinityArmyCode from shared package
- [ ] Import validateInfinityList from shared package
- [ ] Use shared package factions instead of local FACTIONS
- [ ] Existing functionality preserved

---

### [P3-002] Create ListValidationPreview component
**Status:** [x] COMPLETED
**Spec:** `specs/ListValidation.md` [LV-002]
**Size:** L
**Depends on:** P3-001

**Description:**
Real-time validation preview component showing parsed list info and errors/warnings.

**Files Created:**
- `src/components/army/list-validation-preview.tsx`
- `src/components/army/index.ts`

**Acceptance Criteria:**
- [ ] Debounced validation (500ms after typing stops)
- [ ] Shows detected faction with badge
- [ ] Shows points (X/Y) with progress bar
- [ ] Shows SWC (X/Y) with progress bar
- [ ] Shows parsed units count
- [ ] Red error badges for validation errors
- [ ] Yellow warning badges for warnings

---

### [P3-003] Add tournament rules validation to form
**Status:** [x] COMPLETED
**Spec:** `specs/ListValidation.md` [LV-003]
**Size:** S
**Depends on:** P3-001

**Description:**
Pass tournament point limit to validator and show errors if list exceeds limits.

**Files Modified:**
- `src/components/tournament/army-list-form.tsx` - Accept pointLimit prop, validate against it
- `src/app/dashboard/events/[id]/list/page.tsx` - Pass pointLimit to form

**Acceptance Criteria:**
- [ ] Validates points against tournament.point_limit
- [ ] Validates SWC against calculated limit (points/50)
- [ ] Shows clear error if over points limit
- [ ] Shows clear error if over SWC limit

---

### [P3-004] Create ParsedListDisplay component
**Status:** [x] COMPLETED
**Spec:** `specs/ListValidation.md` [LV-004]
**Size:** M
**Depends on:** P3-002

**Description:**
Visual component showing parsed list breakdown with unit details.

**Files Created:**
- `src/components/army/parsed-list-display.tsx`

**Acceptance Criteria:**
- [ ] Card layout with faction, points, SWC summary
- [ ] Progress bars showing points/SWC usage
- [ ] Collapsible unit list with names and costs
- [ ] Valid/Invalid badge with color coding
- [ ] Used for both player view and TO view

---

### [P3-005] Add list_validation_result column to database
**Status:** [x] COMPLETED
**Spec:** `specs/ListValidation.md`
**Size:** S
**Depends on:** None

**Description:**
Add JSONB column to store cached validation results for quick display.

**Files Created:**
- `supabase/migrations/003_list_validation.sql`

**Files Modified:**
- `src/types/database.ts` - Add list_validation_result to Registration type

**Acceptance Criteria:**
- [ ] registrations.list_validation_result JSONB column
- [ ] Stores ValidationResult (valid, errors, warnings)
- [ ] TypeScript types updated
- [ ] Existing registrations get NULL (not validated yet)

---

### [P3-006] Create TO batch validation page
**Status:** [x] COMPLETED
**Spec:** `specs/ListValidation.md` [LV-005]
**Size:** L
**Depends on:** P3-001, P3-004, P3-005

**Description:**
Page for TOs to validate all submitted lists at once.

**Files Created:**
- `src/app/to/[id]/validate-lists/page.tsx`
- `src/components/tournament/validation-table.tsx`

**Acceptance Criteria:**
- [ ] Table showing all registrations
- [ ] Columns: Player, Faction, Points, SWC, Status
- [ ] Status badges: Valid, Invalid, Not Submitted
- [ ] Expand row to see full validation details
- [ ] Filter by status
- [ ] "Validate All" button validates all lists and saves results

---

### [P3-007] Add export validation report
**Status:** [x] COMPLETED
**Spec:** `specs/ListValidation.md` [LV-006]
**Size:** S
**Depends on:** P3-006

**Description:**
Export validation results as CSV or text summary.

**Files Created:**
- `src/lib/export/validation-report.ts`

**Files Modified:**
- `src/app/to/[id]/validate-lists/page.tsx` - Add export buttons

**Acceptance Criteria:**
- [ ] Export as CSV with columns: Player, Faction, Points, SWC, Status, Errors
- [ ] Export as text summary (for Discord/email)
- [ ] Download triggers browser file save

---

## Phase 4: Player Statistics

### [P4-001] Create player stats calculation functions
**Status:** [x] COMPLETED
**Spec:** `specs/PlayerStatistics.md` [PS-005]
**Size:** L
**Depends on:** None

**Description:**
Create server-side functions to calculate player statistics from matches.

**Files Created:**
- `src/lib/stats/player-stats.ts` - Stats calculation functions

**Acceptance Criteria:**
- [ ] `getPlayerStats(userId)` - Overall stats (tournaments, W/L/D, win rate)
- [ ] `getPlayerFactionStats(userId)` - By-faction breakdown
- [ ] `getPlayerTournamentHistory(userId)` - Tournament list with results
- [ ] `getHeadToHead(userId, opponentId)` - H2H record
- [ ] Efficient Supabase queries

---

### [P4-002] Create PlayerStatsCard component
**Status:** [x] COMPLETED
**Spec:** `specs/PlayerStatistics.md` [PS-001]
**Size:** M
**Depends on:** P4-001

**Description:**
Summary card showing key player statistics.

**Files Created:**
- `src/components/stats/player-stats-card.tsx`
- `src/components/stats/index.ts`

**Acceptance Criteria:**
- [ ] Total tournaments played
- [ ] Overall W/L/D record
- [ ] Win rate percentage with visual indicator
- [ ] Total matches played
- [ ] Average OP scored

---

### [P4-003] Create FactionStatsTable component
**Status:** [x] COMPLETED
**Spec:** `specs/PlayerStatistics.md` [PS-002]
**Size:** M
**Depends on:** P4-001

**Description:**
Table showing performance breakdown by faction.

**Files Created:**
- `src/components/stats/faction-stats-table.tsx`

**Acceptance Criteria:**
- [ ] List of factions played with match count
- [ ] W/L/D record per faction
- [ ] Win rate percentage per faction
- [ ] Sortable columns
- [ ] Highlight best/most played faction

---

### [P4-004] Create TournamentHistoryList component
**Status:** [x] COMPLETED
**Spec:** `specs/PlayerStatistics.md` [PS-004]
**Size:** M
**Depends on:** P4-001

**Description:**
List of tournaments with player's results.

**Files Created:**
- `src/components/stats/tournament-history-list.tsx`

**Acceptance Criteria:**
- [ ] Tournament name, date, location
- [ ] Final placement (Xth of Y)
- [ ] Faction played
- [ ] Total OP/VP/AP scored
- [ ] Link to full tournament page

---

### [P4-005] Create HeadToHeadTable component
**Status:** [x] COMPLETED
**Spec:** `specs/PlayerStatistics.md` [PS-003]
**Size:** M
**Depends on:** P4-001

**Description:**
Table showing record against specific opponents.

**Files Created:**
- `src/components/stats/head-to-head-table.tsx`

**Acceptance Criteria:**
- [ ] List of opponents with match count
- [ ] W/L/D record per opponent
- [ ] Sortable by matches, wins
- [ ] Search/filter opponents
- [ ] Link to opponent profile

---

### [P4-006] Create player profile page
**Status:** [x] COMPLETED
**Spec:** `specs/PlayerStatistics.md` [PS-001]
**Size:** L
**Depends on:** P4-002, P4-003, P4-004, P4-005

**Description:**
Public player profile page assembling all stats components.

**Files Created:**
- `src/app/(public)/players/[id]/page.tsx`
- `src/app/(public)/players/[id]/loading.tsx`

**Acceptance Criteria:**
- [ ] Route: /players/[id]
- [ ] Player name and avatar
- [ ] PlayerStatsCard for summary
- [ ] FactionStatsTable for faction breakdown
- [ ] TournamentHistoryList for history
- [ ] HeadToHeadTable for rivals
- [ ] SEO metadata with player name

---

## Phase 6: Spectator Mode

### [P6-001] Create MatchTicker component
**Status:** [x] COMPLETED
**Spec:** `specs/SpectatorMode.md` [SM-002]
**Size:** M
**Depends on:** None

**Description:**
Real-time feed of recent match results.

**Files Created:**
- `src/components/tournament/match-ticker.tsx`

**Acceptance Criteria:**
- [x] Shows last 5-10 completed matches
- [x] Updates in real-time (Supabase subscriptions)
- [x] Shows player names, scores, winner
- [x] Animates new results in

---

### [P6-002] Create RoundClock component
**Status:** [x] COMPLETED
**Spec:** `specs/SpectatorMode.md` [SM-004]
**Size:** S
**Depends on:** None

**Description:**
Countdown timer showing time remaining in round.

**Files Created:**
- `src/components/tournament/round-clock.tsx`

**Acceptance Criteria:**
- [x] Shows time remaining (MM:SS format)
- [x] Takes startTime and durationMinutes as props
- [x] Visual warning when time is low (<5 min) - orange/pulsing
- [x] "Round Complete" when time expires

---

### [P6-003] Create OverlayStandings component
**Status:** [x] COMPLETED
**Spec:** `specs/SpectatorMode.md` [SM-003]
**Size:** M
**Depends on:** None

**Description:**
Minimal standings for streaming overlays.

**Files Created:**
- `src/components/tournament/overlay-standings.tsx`

**Acceptance Criteria:**
- [x] Transparent background
- [x] Minimal styling - just standings table
- [x] Compact layout with text shadows for readability
- [x] No header/footer elements

---

### [P6-004] Create live tournament page
**Status:** [x] COMPLETED
**Spec:** `specs/SpectatorMode.md` [SM-001]
**Size:** L
**Depends on:** P6-001, P6-002

**Description:**
Public page showing real-time tournament status.

**Files Created:**
- `src/app/(public)/events/[id]/live/page.tsx`
- `src/app/(public)/events/[id]/live/loading.tsx`

**Acceptance Criteria:**
- [x] Route: /events/[id]/live
- [x] Real-time standings (reuse RealtimeStandings)
- [x] MatchTicker showing recent results
- [x] RoundClock if round is active
- [x] Current round indicator
- [x] Link back to main tournament page

---

### [P6-005] Add overlay query param support
**Status:** [x] COMPLETED
**Spec:** `specs/SpectatorMode.md` [SM-003]
**Size:** S
**Depends on:** P6-003, P6-004

**Description:**
Support ?overlay=true for streaming overlays.

**Files Modified:**
- `src/app/(public)/events/[id]/live/page.tsx` - Add overlay mode

**Acceptance Criteria:**
- [x] ?overlay=true shows minimal UI
- [x] Uses OverlayStandings component
- [x] Transparent background CSS
- [x] No header/footer/padding

---

## Phase 8: Admin Dashboard

### [P8-001] Add database migration for admin features
**Status:** [x] COMPLETED
**Spec:** `specs/AdminDashboard.md` [AD-001, AD-006]
**Size:** S
**Depends on:** None

**Description:**
Add is_admin column to users table, status column for suspension, and admin_logs table.

**Files Created:**
- `supabase/migrations/004_admin_dashboard.sql`

**Files Modified:**
- `src/types/database.ts` - Add is_admin and status to User type

**Acceptance Criteria:**
- [ ] users.is_admin BOOLEAN DEFAULT false
- [ ] users.status TEXT DEFAULT 'active'
- [ ] admin_logs table for audit trail
- [ ] TypeScript types updated

---

### [P8-002] Create admin layout with route protection
**Status:** [x] COMPLETED
**Spec:** `specs/AdminDashboard.md` [AD-001]
**Size:** M
**Depends on:** P8-001

**Description:**
Admin-specific layout with sidebar navigation and route protection.

**Files Created:**
- `src/app/admin/layout.tsx` - Admin layout with sidebar
- `src/lib/admin/auth.ts` - Admin auth check helper

**Acceptance Criteria:**
- [ ] Checks is_admin flag on user
- [ ] Redirects non-admins to home
- [ ] Sidebar with navigation links
- [ ] Admin-specific header

---

### [P8-003] Create platform statistics dashboard
**Status:** [x] COMPLETED
**Spec:** `specs/AdminDashboard.md` [AD-005]
**Size:** M
**Depends on:** P8-002

**Description:**
Admin home page with platform statistics cards.

**Files Created:**
- `src/app/admin/page.tsx` - Dashboard home
- `src/components/admin/stats-cards.tsx` - Stats display

**Acceptance Criteria:**
- [ ] Total users count
- [ ] Total tournaments (by status)
- [ ] Total matches played
- [ ] Growth metrics (new this week/month)

---

### [P8-004] Create user management page
**Status:** [x] COMPLETED
**Spec:** `specs/AdminDashboard.md` [AD-002, AD-003]
**Size:** L
**Depends on:** P8-002

**Description:**
User list and detail pages with management actions.

**Files Created:**
- `src/app/admin/users/page.tsx` - User list
- `src/app/admin/users/[id]/page.tsx` - User detail
- `src/components/admin/user-table.tsx` - Paginated user table

**Acceptance Criteria:**
- [ ] Table with name, email, registered date, status
- [ ] Search by name or email
- [ ] Filter by status
- [ ] Suspend/unsuspend actions
- [ ] User detail view with activity

---

### [P8-005] Create tournament management page
**Status:** [x] COMPLETED
**Spec:** `specs/AdminDashboard.md` [AD-004]
**Size:** M
**Depends on:** P8-002

**Description:**
Tournament list with management actions.

**Files Created:**
- `src/app/admin/tournaments/page.tsx` - Tournament list
- `src/components/admin/tournament-table.tsx` - Paginated tournament table

**Acceptance Criteria:**
- [ ] Table with name, organizer, date, status, players
- [ ] Search by name
- [ ] Filter by status, date range
- [ ] Delete action for spam cleanup

---

### [P8-006] Create admin server actions
**Status:** [x] COMPLETED
**Spec:** `specs/AdminDashboard.md` [AD-002, AD-003, AD-004]
**Size:** M
**Depends on:** P8-001

**Description:**
Server actions for admin operations with audit logging.

**Files Created:**
- `src/lib/admin/actions.ts` - Admin server actions

**Acceptance Criteria:**
- [ ] suspendUser(userId) - Suspend a user
- [ ] unsuspendUser(userId) - Unsuspend a user
- [ ] deleteTournament(tournamentId) - Delete tournament
- [ ] All actions create admin_logs entries
- [ ] Actions verify admin role

---

### [P8-007] Create admin activity log component
**Status:** [x] COMPLETED
**Spec:** `specs/AdminDashboard.md` [AD-006]
**Size:** S
**Depends on:** P8-006

**Description:**
Display recent admin actions on dashboard.

**Files Created:**
- `src/components/admin/admin-action-log.tsx` - Activity log

**Files Modified:**
- `src/app/admin/page.tsx` - Add activity log to dashboard

**Acceptance Criteria:**
- [ ] Shows recent admin actions
- [ ] Displays: timestamp, admin, action, target
- [ ] Links to affected user/tournament

---

## Phase 5: Notifications

### [P5-001] Add database migration for notifications
**Status:** [x] COMPLETED
**Spec:** `specs/Notifications.md` [NOT-001]
**Size:** S
**Depends on:** None

**Description:**
Add push_subscriptions table and notification_prefs to users.

**Files Created:**
- `supabase/migrations/005_notifications.sql`

**Files Modified:**
- `src/types/database.ts` - Add PushSubscription and notification_prefs types

**Acceptance Criteria:**
- [ ] push_subscriptions table with user_id, endpoint, keys
- [ ] users.notification_prefs JSONB column
- [ ] TypeScript types updated

---

### [P5-002] Create push notification utilities
**Status:** [x] COMPLETED
**Spec:** `specs/Notifications.md` [NOT-001]
**Size:** M
**Depends on:** P5-001

**Description:**
Server-side utilities for sending push notifications.

**Files Created:**
- `src/lib/notifications/vapid.ts` - VAPID key handling
- `src/lib/notifications/push.ts` - Push notification sending
- `src/lib/notifications/subscribe.ts` - Subscription management
- `src/lib/notifications/index.ts` - Exports

**Acceptance Criteria:**
- [ ] getVapidPublicKey() returns public key
- [ ] sendPushNotification(subscription, payload) sends notification
- [ ] saveSubscription(userId, subscription) saves to database
- [ ] removeSubscription(userId, endpoint) removes from database

---

### [P5-003] Create push subscription hook
**Status:** [x] COMPLETED
**Spec:** `specs/Notifications.md` [NOT-002]
**Size:** M
**Depends on:** P5-002

**Description:**
React hook for managing push subscriptions on client.

**Files Created:**
- `src/hooks/use-push-subscription.ts`

**Acceptance Criteria:**
- [ ] Check permission status
- [ ] Request permission
- [ ] Subscribe to push
- [ ] Unsubscribe from push
- [ ] Store subscription on server

---

### [P5-004] Create notification permission banner
**Status:** [x] COMPLETED
**Spec:** `specs/Notifications.md` [NOT-002]
**Size:** S
**Depends on:** P5-003

**Description:**
Banner prompting users to enable notifications.

**Files Created:**
- `src/components/notifications/permission-banner.tsx`

**Acceptance Criteria:**
- [ ] Shows when permission not yet requested
- [ ] Hides when permission granted or denied
- [ ] Enable button triggers permission request
- [ ] Dismiss button hides banner

---

### [P5-005] Create notification preferences page
**Status:** [x] COMPLETED
**Spec:** `specs/Notifications.md` [NOT-006]
**Size:** M
**Depends on:** P5-001

**Description:**
Settings page for notification preferences.

**Files Created:**
- `src/app/dashboard/settings/notifications/page.tsx`
- `src/components/notifications/preferences-form.tsx`

**Acceptance Criteria:**
- [ ] Toggle for pairings notifications
- [ ] Toggle for score notifications
- [ ] Toggle for deadline reminders
- [ ] Save preferences to user profile

---

### [P5-006] Update service worker for push
**Status:** [x] COMPLETED
**Spec:** `specs/Notifications.md` [NOT-001]
**Size:** S
**Depends on:** None

**Description:**
Add push event handlers to service worker.

**Files Modified:**
- `public/sw.js` - Add push and notificationclick handlers

**Acceptance Criteria:**
- [ ] Handle push events
- [ ] Display notification with title, body, icon
- [ ] Open URL on notification click

---

## Completed Tasks

| Task ID | Description | Completed |
|---------|-------------|-----------|
| P0-001 | Dexie schema and sync engine | 2026-01-20 |
| P0-002 | Service worker | 2026-01-20 |
| P0-003 | GameSystem interface and Infinity module | 2026-01-20 |
| P0-004 | Monorepo configuration | 2026-01-20 |
| P0-005 | Install Dexie | 2026-01-20 |
| P0-006 | Database migration for game_system_id | 2026-01-20 |
| P0-007 | Refactor score-form for dynamic fields | 2026-01-20 |
| P0-008 | Refactor standings for game system | 2026-01-20 |
| P1-001 | Add Toaster to root layout | 2026-01-20 |
| P1-002 | Sync status indicator component | 2026-01-20 |
| P1-003 | Initialize sync engine in app layout | 2026-01-20 |
| P1-004 | Skeleton loaders for data-fetching pages | 2026-01-20 |
| P1-005 | Supabase realtime subscriptions for standings | 2026-01-20 |
| P1-006 | Optimistic UI for score submission | 2026-01-20 |
| P2-001 | MatchState and PlayerHiddenState types | 2026-01-20 |
| P2-002 | Hidden-info-panel component | 2026-01-20 |
| P2-003 | Classified-selector (inline) | 2026-01-20 |
| P2-004 | Hidden-deployment-list (inline) | 2026-01-20 |
| P2-005 | Data-tracker-field (inline) | 2026-01-20 |
| P2-006 | Integrate hidden-info-panel into score-form | 2026-01-20 |
| P2-007 | TO match detail page with hidden info viewer | 2026-01-20 |
| P2-008 | State-history-log component | 2026-01-20 |
| P3-001 | Migrate ArmyListForm to shared package parser | 2026-01-20 |
| P3-002 | ListValidationPreview component | 2026-01-20 |
| P3-003 | Tournament rules validation | 2026-01-20 |
| P3-004 | ParsedListDisplay component | 2026-01-20 |
| P3-005 | list_validation_result database column | 2026-01-20 |
| P3-006 | TO batch validation page | 2026-01-20 |
| P3-007 | Export validation report | 2026-01-20 |
| P4-001 | Player stats calculation functions | 2026-01-20 |
| P4-002 | PlayerStatsCard component | 2026-01-20 |
| P4-003 | FactionStatsTable component | 2026-01-20 |
| P4-004 | TournamentHistoryList component | 2026-01-20 |
| P4-005 | HeadToHeadTable component | 2026-01-20 |
| P4-006 | Player profile page | 2026-01-20 |
| P6-001 | MatchTicker component | 2026-01-20 |
| P6-002 | RoundClock component | 2026-01-20 |
| P6-003 | OverlayStandings component | 2026-01-20 |
| P6-004 | Live tournament page | 2026-01-20 |
| P6-005 | Overlay query param support | 2026-01-20 |
| P8-001 | Database migration for admin features | 2026-01-20 |
| P8-002 | Admin layout with route protection | 2026-01-20 |
| P8-003 | Platform statistics dashboard | 2026-01-20 |
| P8-004 | User management page | 2026-01-20 |
| P8-005 | Tournament management page | 2026-01-20 |
| P8-006 | Admin server actions | 2026-01-20 |
| P8-007 | Admin activity log component | 2026-01-20 |
| P5-001 | Database migration for notifications | 2026-01-20 |
| P5-002 | Push notification utilities | 2026-01-20 |
| P5-003 | Push subscription hook | 2026-01-20 |
| P5-004 | Notification permission banner | 2026-01-20 |
| P5-005 | Notification preferences page | 2026-01-20 |
| P5-006 | Service worker push handlers | 2026-01-20 |
| P10-001 | Install and configure Vitest | 2026-01-20 |
| P10-002 | Create test setup file and MSW handlers | 2026-01-20 |
| P10-003 | Write swiss.ts unit tests (18 tests) | 2026-01-20 |
| P10-004 | Write standings.ts unit tests (18 tests) | 2026-01-20 |
| P10-005 | Fix admin actions field mismatch | 2026-01-20 |
| P10-007 | Add security headers to next.config.ts | 2026-01-20 |
| P10-008 | Create error boundary components | 2026-01-20 |
| P10-006 | Write admin actions tests (16 tests) | 2026-01-20 |
| P10-009 | Safari PWA install prompt | 2026-01-20 |
| P10-010 | GitHub Actions CI workflow | 2026-01-20 |
| P10-011 | Install and configure Playwright | 2026-01-20 |
| TD-001 | Fix migration naming collision | 2026-01-20 |
| TD-002 | Complete RBAC middleware | 2026-01-20 |
| TD-003 | Remove deprecated army parser | 2026-01-20 |
| TD-004 | Enforce CSP headers | 2026-01-20 |
| TD-005 | Add route-level error boundaries | 2026-01-20 |

---

## Integration Notes

Phase 2 is now complete. The following integration items have been addressed:

### Phase 1 (Complete)
1. **Sync engine** - Initialized in app layout via SyncProvider ✅
2. **Sync status indicator** - Added to header ✅
3. **Real-time standings** - Using Supabase subscriptions ✅
4. **Toast notifications** - Available on all pages via root Toaster ✅
5. **Skeleton loaders** - Added to all data-fetching pages ✅
6. **Optimistic UI** - Score form updates immediately ✅

### Phase 2 (Complete)
1. **MatchState types** - Full type definitions for hidden information tracking ✅
2. **HiddenInfoPanel** - Collapsible panel with classifieds, hidden deployment, data tracker, lieutenant ✅
3. **Score form integration** - Hidden info panel added below scores for Infinity games ✅
4. **TO match viewer** - `/to/[id]/matches/[matchId]` page with side-by-side hidden info ✅
5. **State history log** - Audit trail with TO edit attribution ✅

**Remaining integration work (Phase 3+):**
- Tournament pages should pass gameSystemId to score forms and standings
- Create tournament form should include game system selector (default: Infinity)

---

## Discovered Work

- TypeScript errors in existing score-form.tsx and create-tournament-form.tsx (pre-existing)
- packages/shared needs to be added to main app dependencies for imports

---

## Blocked Tasks

None.

---

## Phase 10: Stability & Hardening (NEW)

**Source PRD:** `docs/PRD-Stability-Hardening.md`

### [P10-001] Install and configure Vitest

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 1
**Size:** S
**Depends on:** None

**Description:**
Install Vitest and configure for Next.js 16 with TypeScript path aliases.

**Files Created:**
- `vitest.config.mts` - Vitest configuration

**Files Modified:**
- `package.json` - Add vitest devDependencies and test scripts

**Acceptance Criteria:**
- [x] vitest, @vitejs/plugin-react, vite-tsconfig-paths installed
- [x] `npm test` runs vitest
- [x] TypeScript path aliases (@/) work in tests
- [x] jsdom environment configured

---

### [P10-002] Create test setup file and MSW handlers

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 1
**Size:** M
**Depends on:** P10-001

**Description:**
Create test setup file with testing-library matchers and MSW handlers for Supabase mocking.

**Files Created:**
- `src/test/setup.ts` - Test setup with jest-dom matchers and MSW server

**Acceptance Criteria:**
- [x] @testing-library/jest-dom matchers available
- [x] MSW server starts/stops correctly in tests
- [x] Supabase API endpoints mocked (stub handlers ready)

---

### [P10-003] Write swiss.ts unit tests

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 1
**Size:** M
**Depends on:** P10-002

**Description:**
Write comprehensive unit tests for the Swiss pairing algorithm.

**Files Created:**
- `src/lib/pairing/swiss.test.ts` - Swiss pairing tests (18 tests)

**Acceptance Criteria:**
- [x] Test basic pairing (even players)
- [x] Test odd players (bye assignment)
- [x] Test rematch prevention
- [x] Test standings-based pairing
- [x] Test table assignment (sequential/random)
- [x] >80% coverage of swiss.ts

---

### [P10-004] Write standings.ts unit tests

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 1
**Size:** M
**Depends on:** P10-002

**Description:**
Write comprehensive unit tests for standings calculation and tiebreakers.

**Files Created:**
- `src/lib/scoring/standings.test.ts` - Standings calculation tests (18 tests)

**Acceptance Criteria:**
- [x] Test basic standings calculation
- [x] Test tiebreaker order (OP > VP > SoS)
- [x] Test Strength of Schedule calculation
- [x] Test tied ranks
- [x] Test bye match handling
- [x] >80% coverage of standings.ts

---

### [P10-005] Fix admin actions field mismatch

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 2
**Size:** S
**Depends on:** None

**Description:**
Fix bug where admin actions check `is_suspended` but database uses `status` column.

**Files Created:**
- `supabase/migrations/002_add_user_admin_fields.sql` - Migration to add status, is_admin, and admin_logs

**Files Modified:**
- `src/lib/admin/actions.ts` - Fixed field references (is_suspended → status, display_name → name)

**Acceptance Criteria:**
- [x] suspendUser uses correct `status` field
- [x] unsuspendUser uses correct `status` field
- [x] Matches database schema (status = 'active' | 'suspended')

---

### [P10-006] Write admin actions tests

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 2
**Size:** S
**Depends on:** P10-002, P10-005

**Description:**
Write tests for admin server actions.

**Files Created:**
- `src/lib/admin/actions.test.ts` - Admin action tests

**Acceptance Criteria:**
- [ ] Test suspendUser success
- [ ] Test unsuspendUser success
- [ ] Test admin authorization check
- [ ] Test self-suspension prevention

---

### [P10-007] Add security headers to next.config.js

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 3
**Size:** S
**Depends on:** None

**Description:**
Add security headers to all responses via Next.js config.

**Files Modified:**
- `next.config.ts` - Added headers() function with security headers

**Acceptance Criteria:**
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Content-Security-Policy-Report-Only configured
- [x] Headers applied to all routes via /(.*) source pattern

---

### [P10-008] Create error boundary components

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 4
**Size:** S
**Depends on:** None

**Description:**
Add React error boundaries for graceful error handling.

**Files Created:**
- `src/app/error.tsx` - Root error UI with try again and go home actions
- `src/app/global-error.tsx` - Global error boundary for critical errors
- `src/components/ui/error-boundary.tsx` - Reusable ErrorBoundary class component

**Acceptance Criteria:**
- [x] Root error boundary catches render errors
- [x] Shows user-friendly error message
- [x] Includes "Try again" recovery action
- [x] Logs errors to console

---

### [P10-009] Create Safari PWA install prompt

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 5
**Size:** M
**Depends on:** None

**Description:**
Prompt Safari users to install PWA to prevent 7-day IndexedDB eviction.

**Files Created:**
- `src/components/pwa/safari-install-prompt.tsx` - Install prompt component
- `src/hooks/use-pwa-install.ts` - PWA detection hook

**Files Modified:**
- `src/app/layout.tsx` - Add install prompt

**Acceptance Criteria:**
- [ ] Detect Safari/iOS not in standalone mode
- [ ] Show prompt after 2nd visit (cookie-based)
- [ ] Instructions for "Add to Home Screen"
- [ ] Dismissable with 30-day persistence

---

### [P10-010] Create GitHub Actions CI workflow

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 1
**Size:** S
**Depends on:** P10-001

**Description:**
Create CI workflow that runs on every PR.

**Files Created:**
- `.github/workflows/ci.yml` - CI workflow

**Acceptance Criteria:**
- [ ] Runs on push to main and PRs
- [ ] Installs dependencies (npm ci)
- [ ] Runs lint (npm run lint)
- [ ] Runs type check (npx tsc --noEmit)
- [ ] Runs tests (npm test)
- [ ] Runs build (npm run build)

---

### [P10-011] Install and configure Playwright

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-Stability-Hardening.md` Feature 1
**Size:** M
**Depends on:** P10-010

**Description:**
Set up Playwright for E2E testing foundation.

**Files Created:**
- `playwright.config.ts` - Playwright configuration
- `e2e/example.spec.ts` - Example E2E test

**Files Modified:**
- `package.json` - Add playwright scripts
- `.github/workflows/ci.yml` - Add E2E job

**Acceptance Criteria:**
- [ ] Playwright installed and configured
- [ ] Webserver starts for tests
- [ ] Example test passes
- [ ] CI runs E2E tests

---

## Phase 11: Technical Debt (NEW)

**Source PRD:** `docs/PRD-TechnicalDebt.md`
**Spec:** `specs/TechnicalDebt.md`

### [TD-001] Fix migration naming collision

**Status:** [x] COMPLETED
**Spec:** `specs/TechnicalDebt.md` TD-001
**Size:** S
**Depends on:** None

**Description:**
Rename migration files to have sequential, non-conflicting prefixes. Two files currently share `002_` prefix.

**Files to Rename:**
- `002_game_systems.sql` → `003_game_systems.sql`
- `003_list_validation.sql` → `004_list_validation.sql`
- `004_admin_dashboard.sql` → `005_admin_dashboard.sql`
- `005_notifications.sql` → `006_notifications.sql`

**Acceptance Criteria:**
- [ ] All migrations have unique prefixes (001-006)
- [ ] `supabase db reset` runs without errors
- [ ] Data dependencies preserved

---

### [TD-002] Complete RBAC middleware

**Status:** [x] COMPLETED
**Spec:** `specs/TechnicalDebt.md` TD-002
**Size:** M
**Depends on:** None

**Description:**
Add role-based access control to middleware for TO-only and admin-only routes.

**Files Modified:**
- `src/lib/supabase/middleware.ts` - Add role check logic

**Acceptance Criteria:**
- [ ] Middleware fetches user role from JWT claims or database
- [ ] `/to/*` routes reject non-TO users with redirect
- [ ] `/admin/*` routes reject non-admin users with redirect
- [ ] Helpful error message shown to unauthorized users

---

### [TD-003] Remove deprecated army parser

**Status:** [x] COMPLETED
**Spec:** `specs/TechnicalDebt.md` TD-003
**Size:** S
**Depends on:** None

**Description:**
Delete deprecated `src/lib/army/` directory and update any remaining imports to use shared package.

**Files to Delete:**
- `src/lib/army/parser.ts`
- `src/lib/army/` directory

**Files to Check/Update:**
- Any files importing from `@/lib/army/`

**Acceptance Criteria:**
- [ ] `src/lib/army/` directory deleted
- [ ] All imports updated to `@infinity-tournament/shared`
- [ ] No runtime errors from missing imports

---

### [TD-004] Enforce CSP headers

**Status:** [x] COMPLETED
**Spec:** `specs/TechnicalDebt.md` TD-004
**Size:** S
**Depends on:** None

**Description:**
Change CSP from report-only to enforced mode.

**Files Modified:**
- `next.config.ts` - Change `Content-Security-Policy-Report-Only` to `Content-Security-Policy`

**Acceptance Criteria:**
- [ ] `Content-Security-Policy` header (not Report-Only)
- [ ] All legitimate app functionality works
- [ ] OBS overlay still functions
- [ ] No console CSP violations in normal operation

---

### [TD-005] Add route-level error boundaries

**Status:** [x] COMPLETED
**Spec:** `specs/TechnicalDebt.md` TD-005
**Size:** M
**Depends on:** None

**Description:**
Ensure all major route groups have error.tsx files for graceful error handling.

**Files to Create (if missing):**
- `src/app/(auth)/error.tsx`
- `src/app/(public)/error.tsx`
- `src/app/dashboard/error.tsx`
- `src/app/to/error.tsx`
- `src/app/admin/error.tsx`

**Acceptance Criteria:**
- [ ] Each route group has error.tsx
- [ ] Error pages show user-friendly message with retry
- [ ] Navigation remains functional after error
- [ ] Errors logged for debugging

---

## Phase A: Integration & Cleanup (v1.1 Roadmap)

### [A-001] Add game system selector to create-tournament-form

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature A1
**Size:** S
**Depends on:** None

**Description:**
Add a game system dropdown to the tournament creation form. Database already has game_system_id column with default 'infinity'.

**Files Modified:**
- `src/components/tournament/create-tournament-form.tsx` - Add Select dropdown
- `src/lib/validations/tournament.ts` - Add gameSystemId to schema

**Acceptance Criteria:**
- [ ] Dropdown shows available game systems (default: Infinity)
- [ ] Form submits gameSystemId to database
- [ ] Existing validation works

---

### [A-002] Wire gameSystemId to score-form component

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature A1
**Size:** S
**Depends on:** A-001

**Description:**
Pass gameSystemId from tournament to score form so it uses correct scoring fields.

**Files Modified:**
- `src/components/scoring/score-form.tsx` - Accept gameSystemId prop
- `src/app/dashboard/events/[id]/match/[matchId]/page.tsx` - Pass gameSystemId

**Acceptance Criteria:**
- [ ] Score form receives gameSystemId
- [ ] Correct scoring fields display based on game system

---

### [A-003] Wire gameSystemId to standings pages

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature A1
**Size:** S
**Depends on:** A-001

**Description:**
Pass gameSystemId to standings calculation for correct tiebreaker logic.

**Files Modified:**
- `src/app/(public)/events/[id]/standings/page.tsx` - Pass gameSystemId
- `src/hooks/use-realtime-standings.ts` - Accept gameSystemId

**Acceptance Criteria:**
- [ ] Standings use correct tiebreaker order for game system
- [ ] Real-time updates work with gameSystemId

---

## Phase B: Production Readiness (v1.1 Roadmap)

### [B-001] Install and configure Sentry

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B1
**Size:** M
**Depends on:** None

**Description:**
Install @sentry/nextjs and configure for error tracking.

**Files Created:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

**Files Modified:**
- `package.json` - Add @sentry/nextjs
- `next.config.ts` - Add Sentry webpack config

**Acceptance Criteria:**
- [ ] Sentry SDK installed
- [ ] Client errors captured
- [ ] Server errors captured
- [ ] Environment separation (dev/prod)

---

### [B-002] Integrate Sentry with error boundaries

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B1
**Size:** S
**Depends on:** B-001

**Description:**
Connect existing error boundaries to Sentry for automatic error reporting.

**Files Modified:**
- `src/app/error.tsx` - Add Sentry.captureException
- `src/app/global-error.tsx` - Add Sentry.captureException
- `src/components/ui/error-boundary.tsx` - Add Sentry integration

**Acceptance Criteria:**
- [ ] Error boundaries send errors to Sentry
- [ ] Stack traces readable via source maps

---

### [B-003] Configure Sentry source maps

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B1
**Size:** S
**Depends on:** B-001

**Description:**
Configure source map uploads to Sentry for readable stack traces.

**Files Modified:**
- `next.config.ts` - Sentry source map config
- `.github/workflows/ci.yml` - Add source map upload step

**Acceptance Criteria:**
- [ ] Source maps uploaded during build
- [ ] Stack traces show original TypeScript code

---

### [B-004] E2E test: User registration flow

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B2
**Size:** M
**Depends on:** None

**Description:**
Write Playwright test for user registration flow.

**Files Created:**
- `e2e/auth/registration.spec.ts`

**Acceptance Criteria:**
- [ ] Test navigates to registration page
- [ ] Test fills form and submits
- [ ] Test verifies success state
- [ ] Test handles error cases

---

### [B-005] E2E test: Tournament creation flow

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B2
**Size:** M
**Depends on:** None

**Description:**
Write Playwright test for TO creating a tournament.

**Files Created:**
- `e2e/tournament/create.spec.ts`

**Acceptance Criteria:**
- [ ] Test logs in as TO
- [ ] Test fills tournament form
- [ ] Test verifies tournament created
- [ ] Test checks tournament appears in list

---

### [B-006] E2E test: Player event registration

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B2
**Size:** M
**Depends on:** None

**Description:**
Write Playwright test for player registering for event.

**Files Created:**
- `e2e/tournament/registration.spec.ts`

**Acceptance Criteria:**
- [ ] Test logs in as player
- [ ] Test finds event
- [ ] Test registers for event
- [ ] Test submits army list

---

### [B-007] E2E test: Score entry and confirmation

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B2
**Size:** M
**Depends on:** None

**Description:**
Write Playwright test for score entry flow.

**Files Created:**
- `e2e/scoring/score-entry.spec.ts`

**Acceptance Criteria:**
- [ ] Test navigates to match page
- [ ] Test enters scores
- [ ] Test confirms submission
- [ ] Test verifies scores recorded

---

### [B-008] E2E test: Standings display

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B2
**Size:** M
**Depends on:** None

**Description:**
Write Playwright test for standings page.

**Files Created:**
- `e2e/tournament/standings.spec.ts`

**Acceptance Criteria:**
- [ ] Test loads standings page
- [ ] Test verifies player rankings
- [ ] Test checks tiebreaker display

---

### [B-009] Add E2E tests to CI workflow

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature B2
**Size:** S
**Depends on:** B-004

**Description:**
Update CI workflow to run E2E tests.

**Files Modified:**
- `.github/workflows/ci.yml` - Add E2E job with Playwright

**Acceptance Criteria:**
- [ ] CI runs E2E tests on PR
- [ ] Artifacts uploaded on failure
- [ ] Test results visible in PR

---

## Phase C: Security Hardening (v1.1 Roadmap)

### [C-001] Configure Google OAuth in Supabase

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C1
**Size:** S
**Depends on:** None

**Description:**
Configure Google OAuth provider in Supabase dashboard.

**Files Modified:**
- `.env.local.example` - Document required env vars
- `docs/SETUP.md` - Add OAuth setup instructions

**Acceptance Criteria:**
- [ ] Google OAuth configured in Supabase
- [ ] Redirect URLs configured
- [ ] Environment variables documented

---

### [C-002] Configure Discord OAuth in Supabase

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C1
**Size:** S
**Depends on:** None

**Description:**
Configure Discord OAuth provider in Supabase dashboard.

**Files Modified:**
- `.env.local.example` - Document required env vars
- `docs/SETUP.md` - Add OAuth setup instructions

**Acceptance Criteria:**
- [ ] Discord OAuth configured in Supabase
- [ ] Redirect URLs configured
- [ ] Environment variables documented

---

### [C-003] Add social login buttons to login page

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C1
**Size:** M
**Depends on:** C-001, C-002

**Description:**
Add Google and Discord login buttons to the login form.

**Files Modified:**
- `src/components/auth/login-form.tsx` - Add OAuth buttons
- `src/components/auth/social-login-buttons.tsx` - New component

**Acceptance Criteria:**
- [ ] Google login button visible
- [ ] Discord login button visible
- [ ] OAuth flow works on click
- [ ] Redirect back to app after auth

---

### [C-004] Add account linking UI

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C1
**Size:** M
**Depends on:** C-003

**Description:**
Allow users to link social accounts to existing email accounts.

**Files Created:**
- `src/app/dashboard/settings/accounts/page.tsx`
- `src/components/settings/connected-accounts.tsx`

**Acceptance Criteria:**
- [ ] Settings page shows connected providers
- [ ] Users can link additional providers
- [ ] Users can unlink providers (keep at least one)

---

### [C-005] Install Upstash rate limiting packages

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C2
**Size:** S
**Depends on:** None

**Description:**
Install @upstash/ratelimit and @upstash/redis packages.

**Files Modified:**
- `package.json` - Add dependencies
- `.env.local.example` - Add UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN

**Acceptance Criteria:**
- [ ] Packages installed
- [ ] Environment variables documented

---

### [C-006] Create rate limiting middleware

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C2
**Size:** M
**Depends on:** C-005

**Description:**
Create reusable rate limiting logic using Upstash.

**Files Created:**
- `src/lib/rate-limit.ts` - Rate limiter factory

**Acceptance Criteria:**
- [ ] Rate limiter configurable per endpoint
- [ ] Returns proper headers (X-RateLimit-*)
- [ ] Graceful fallback if Redis unavailable

---

### [C-007] Apply rate limits to auth endpoints

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C2
**Size:** S
**Depends on:** C-006

**Description:**
Add rate limiting to login and registration.

**Files Modified:**
- `src/middleware.ts` - Add rate limit checks for auth routes

**Acceptance Criteria:**
- [ ] 5 login attempts per minute per IP
- [ ] Clear error message when rate limited

---

### [C-008] Apply rate limits to score submission

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C2
**Size:** S
**Depends on:** C-006

**Description:**
Add rate limiting to score submission endpoints.

**Files Modified:**
- `src/middleware.ts` - Add rate limit for score routes

**Acceptance Criteria:**
- [ ] 30 submissions per minute per user
- [ ] Rate limit by user ID, not IP

---

### [C-009] Audit inline scripts for CSP

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C3
**Size:** M
**Depends on:** None

**Description:**
Audit codebase for inline scripts and styles that violate CSP.

**Files Created:**
- `docs/CSP-AUDIT.md` - Audit findings

**Acceptance Criteria:**
- [ ] All inline scripts identified
- [ ] All inline styles identified
- [ ] Plan for each violation

---

### [C-010] Implement CSP nonces

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C3
**Size:** M
**Depends on:** C-009

**Description:**
Add nonce generation for legitimate inline scripts.

**Files Modified:**
- `src/middleware.ts` - Generate nonce per request
- `src/app/layout.tsx` - Use nonce in script tags
- `next.config.ts` - Update CSP header

**Acceptance Criteria:**
- [ ] Nonces generated per request
- [ ] Inline scripts use nonces
- [ ] CSP allows nonced scripts

---

### [C-011] Enable enforced CSP

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C3
**Size:** S
**Depends on:** C-010

**Description:**
Change CSP from report-only to enforced.

**Files Modified:**
- `next.config.ts` - Change header name

**Acceptance Criteria:**
- [ ] Content-Security-Policy header (not Report-Only)
- [ ] No CSP violations in normal operation
- [ ] OBS overlay still works

---

### [C-012] Implement CSRF token generation

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C4
**Size:** M
**Depends on:** None

**Description:**
Create CSRF token generation and validation utilities.

**Files Created:**
- `src/lib/csrf.ts` - Token generation and validation

**Acceptance Criteria:**
- [ ] Tokens generated per session
- [ ] Tokens stored securely
- [ ] Validation function available

---

### [C-013] Add CSRF validation to server actions

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C4
**Size:** M
**Depends on:** C-012

**Description:**
Add CSRF validation to all state-changing server actions.

**Files Modified:**
- `src/lib/admin/actions.ts` - Add CSRF check
- `src/components/scoring/score-form.tsx` - Include token
- Other server action files

**Acceptance Criteria:**
- [ ] All mutations validate CSRF token
- [ ] Clear error on CSRF failure

---

### [C-014] Add CSRF tokens to all forms

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature C4
**Size:** M
**Depends on:** C-012

**Description:**
Include CSRF token in all form submissions.

**Files Created:**
- `src/components/ui/csrf-input.tsx` - Hidden CSRF input component

**Files Modified:**
- All form components - Add CSRF input

**Acceptance Criteria:**
- [ ] All forms include CSRF token
- [ ] Token auto-refreshes as needed

---

## Phase D: Engagement (v1.2 Roadmap)

### [D-001] Create achievements database schema

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature D1
**Size:** S
**Depends on:** None

**Description:**
Create database tables for achievements system.

**Files Created:**
- `supabase/migrations/007_achievements.sql`

**Schema:**
- achievements (id, name, description, category, icon, criteria_type, criteria_value)
- user_achievements (user_id, achievement_id, unlocked_at, progress)

**Acceptance Criteria:**
- [ ] Tables created with proper indexes
- [ ] Foreign keys to users table
- [ ] RLS policies for read access

---

### [D-002] Define initial achievement set

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature D1
**Size:** M
**Depends on:** D-001

**Description:**
Create TypeScript definitions and seed data for initial achievements.

**Files Created:**
- `src/lib/achievements/definitions.ts` - Achievement definitions
- `supabase/seed/achievements.sql` - Seed data

**Achievements:**
- First Tournament, First Win, Tournament Champion
- 10 Tournaments, 50 Tournaments, 100 Tournaments
- Faction Loyalist, Master of All
- TO Badge, Early Adopter

**Acceptance Criteria:**
- [ ] 10+ achievements defined
- [ ] Categories: Participation, Performance, Faction, Community
- [ ] Clear criteria for each

---

### [D-003] Create achievement unlock logic

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature D1
**Size:** L
**Depends on:** D-002

**Description:**
Implement achievement checking and unlock logic.

**Files Created:**
- `src/lib/achievements/checker.ts` - Check and unlock achievements
- `src/lib/achievements/hooks.ts` - React hooks for achievements

**Trigger Points:**
- After match completion
- After tournament completion
- After registration

**Acceptance Criteria:**
- [ ] Achievements check on relevant events
- [ ] Unlocks stored in database
- [ ] No duplicate unlocks

---

### [D-004] Add achievements to player profile

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature D1
**Size:** M
**Depends on:** D-003

**Description:**
Display earned achievements on player profile page.

**Files Created:**
- `src/components/achievements/achievement-badge.tsx`
- `src/components/achievements/achievement-grid.tsx`

**Files Modified:**
- `src/app/(public)/players/[id]/page.tsx` - Add achievements section

**Acceptance Criteria:**
- [ ] Achievements display as badges
- [ ] Hover shows details
- [ ] Progress shown for incomplete achievements

---

### [D-005] Create achievement notification component

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature D1
**Size:** M
**Depends on:** D-003

**Description:**
Show notification when achievement is unlocked.

**Files Created:**
- `src/components/achievements/achievement-toast.tsx`
- `src/components/achievements/achievement-modal.tsx`

**Acceptance Criteria:**
- [ ] Toast notification on unlock
- [ ] Click opens detail modal
- [ ] Animation/celebration effect

---

### [D-006] Add shareable achievement cards

**Status:** [x] COMPLETED
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature D1
**Size:** M
**Depends on:** D-004

**Description:**
Create shareable achievement cards for social media.

**Files Created:**
- `src/app/api/og/achievement/[id]/route.tsx` - OG image generation

**Acceptance Criteria:**
- [ ] OG image generated for achievements
- [ ] Proper social preview metadata
- [ ] Works on Twitter, Discord, etc.

---

## Phase E: Platform Growth (v2 Roadmap)

### [E-001] Research ITS API integration

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E1
**Size:** L
**Depends on:** None
**Blocked:** Requires Corvus Belli partnership

**Description:**
Research and document ITS API requirements and capabilities.

**Files Created:**
- `docs/ITS-API-RESEARCH.md`

**Acceptance Criteria:**
- [ ] API endpoints documented
- [ ] Authentication method identified
- [ ] Data model mapping complete

---

### [E-002] Implement ITS sync

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E1
**Size:** XL
**Depends on:** E-001
**Blocked:** Requires API access

**Description:**
Implement tournament results sync to official ITS system.

**Files Created:**
- `src/lib/its/client.ts` - ITS API client
- `src/lib/its/sync.ts` - Sync logic

**Acceptance Criteria:**
- [ ] Tournament registration syncs
- [ ] Results submission works
- [ ] Error handling robust

---

### [E-003] Set up Stripe integration

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E2
**Size:** L
**Depends on:** None

**Description:**
Install Stripe SDK and configure account.

**Files Created:**
- `src/lib/stripe/client.ts` - Stripe client
- `src/lib/stripe/webhooks.ts` - Webhook handler

**Files Modified:**
- `package.json` - Add stripe package
- `.env.local.example` - Add Stripe keys

**Acceptance Criteria:**
- [ ] Stripe SDK installed
- [ ] Test mode working
- [ ] Webhook endpoint configured

---

### [E-004] Add payment flow to registration

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E2
**Size:** L
**Depends on:** E-003

**Description:**
Add optional payment during tournament registration.

**Files Created:**
- `src/components/tournament/payment-form.tsx`
- `src/app/api/stripe/create-checkout/route.ts`

**Files Modified:**
- `src/components/tournament/create-tournament-form.tsx` - Add price field

**Acceptance Criteria:**
- [ ] TO can set entry fee
- [ ] Players pay during registration
- [ ] Payment status tracked

---

### [E-005] Create TO payout system

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E2
**Size:** L
**Depends on:** E-004

**Description:**
Allow TOs to receive payouts from tournament fees.

**Files Created:**
- `src/app/to/payouts/page.tsx`
- `src/lib/stripe/payouts.ts`

**Acceptance Criteria:**
- [ ] TO connects Stripe account
- [ ] Payouts transferred after event
- [ ] Fee reporting available

---

### [E-006] Enhance offline sync for full offline mode

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E3
**Size:** XL
**Depends on:** None

**Description:**
Expand offline capabilities for complete offline operation.

**Files Modified:**
- `packages/shared/src/sync/engine.ts` - Full offline support
- `public/sw.js` - Enhanced caching

**Acceptance Criteria:**
- [ ] All operations work offline
- [ ] Conflict resolution for simultaneous edits
- [ ] Clear offline indicator

---

### [E-007] Design chat data model

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E4
**Size:** M
**Depends on:** None

**Description:**
Design database schema for messaging system.

**Files Created:**
- `supabase/migrations/008_messaging.sql`
- `docs/MESSAGING-DESIGN.md`

**Schema:**
- conversations (id, type, tournament_id)
- messages (id, conversation_id, sender_id, content, sent_at)
- conversation_participants (conversation_id, user_id)

**Acceptance Criteria:**
- [ ] Schema supports 1:1 and group chats
- [ ] Tournament announcements supported
- [ ] Message history preserved

---

### [E-008] Implement real-time chat

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E4
**Size:** L
**Depends on:** E-007

**Description:**
Build real-time chat using Supabase Realtime.

**Files Created:**
- `src/components/chat/chat-window.tsx`
- `src/components/chat/message-list.tsx`
- `src/hooks/use-chat.ts`

**Acceptance Criteria:**
- [ ] Real-time message delivery
- [ ] Read receipts
- [ ] Typing indicators

---

### [E-009] Add chat moderation tools

**Status:** [ ] PENDING
**Spec:** `docs/PRD-v1.1-v2-Roadmap.md` Feature E4
**Size:** M
**Depends on:** E-008

**Description:**
Add moderation tools for chat system.

**Files Created:**
- `src/app/admin/moderation/page.tsx`
- `src/lib/moderation/actions.ts`

**Acceptance Criteria:**
- [ ] Report message functionality
- [ ] Admin can delete messages
- [ ] User muting/banning
