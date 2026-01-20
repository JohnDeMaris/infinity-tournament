# Spectator Mode Specification

**Phase:** 6
**Status:** Planning
**PRD Reference:** Phase 6: Spectator Mode

---

## Jobs to Be Done

### JTBD-1: Remote viewer following live tournament
**When** I can't attend a tournament in person
**I want** to see live standings and recent match results
**So that** I can follow along from home

### JTBD-2: Streamer showing tournament updates
**When** I'm streaming a tournament on Twitch
**I want** a clean overlay showing standings
**So that** viewers can see the competition status

### JTBD-3: TO managing live display
**When** I have a display showing tournament status
**I want** an auto-updating view that doesn't need refreshing
**So that** players and spectators can see current standings

---

## Requirements

### [SM-001] Live Tournament Page
**Priority:** P0
**Description:** Public page showing real-time tournament status.

**Route:** `/events/[id]/live`

**Acceptance Criteria:**
- [ ] Real-time standings that update automatically (Supabase subscriptions)
- [ ] Current round indicator
- [ ] Time remaining in round (if configured)
- [ ] No manual refresh needed

### [SM-002] Match Ticker
**Priority:** P1
**Description:** Recent match results feed.

**Acceptance Criteria:**
- [ ] Shows last 5-10 completed matches
- [ ] Updates in real-time as matches complete
- [ ] Shows player names, scores, winner
- [ ] Animates new results in

### [SM-003] Stream Overlay Mode
**Priority:** P1
**Description:** Minimal UI for OBS/streaming overlays.

**Route:** `/events/[id]/live?overlay=true`

**Acceptance Criteria:**
- [ ] Transparent background (for OBS browser source)
- [ ] Minimal styling - just standings table
- [ ] Auto-scales for different sizes
- [ ] No header/footer

### [SM-004] Round Clock
**Priority:** P1
**Description:** Countdown timer showing time remaining in round.

**Acceptance Criteria:**
- [ ] Shows time remaining (MM:SS format)
- [ ] Configurable by TO (round start time)
- [ ] Visual warning when time is low (<5 min)
- [ ] "Round Complete" when time expires

### [SM-005] Featured Table
**Priority:** P2
**Description:** Highlight a specific match for spectators.

**Acceptance Criteria:**
- [ ] TO can mark a table as "featured"
- [ ] Featured match shows prominently on live page
- [ ] Shows player names, factions, current state

---

## Technical Notes

### Real-time Implementation
Already have Supabase subscriptions from Phase 1. Reuse:
- `src/hooks/use-realtime-standings.ts`
- `src/components/tournament/realtime-standings.tsx`

### Overlay Mode
Use URL query param `?overlay=true` to:
- Remove header/footer
- Apply transparent background
- Remove padding/margins

### Round Clock
Need to add `round_start_time` to rounds table or calculate from tournament settings.

---

## UI Components to Create/Modify

1. **LiveTournamentPage** - Main live view page
2. **MatchTicker** - Recent results feed
3. **RoundClock** - Countdown timer
4. **OverlayStandings** - Minimal standings for streaming
5. **FeaturedMatch** - Highlighted match card

---

## Files to Create

- `src/app/(public)/events/[id]/live/page.tsx` - Live page
- `src/components/tournament/match-ticker.tsx` - Recent results
- `src/components/tournament/round-clock.tsx` - Timer
- `src/components/tournament/overlay-standings.tsx` - Stream overlay
