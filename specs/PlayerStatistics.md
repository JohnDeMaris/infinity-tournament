# Player Statistics Specification

**Phase:** 4
**Status:** Planning
**PRD Reference:** Phase 4: Player Statistics

---

## Jobs to Be Done

### JTBD-1: Player viewing their career stats
**When** I want to see how I've performed across tournaments
**I want** a profile page showing my win/loss record, tournament history, and faction stats
**So that** I can track my improvement and identify areas to work on

### JTBD-2: Player checking head-to-head record
**When** I'm paired against a rival
**I want** to see our historical head-to-head record
**So that** I know the stakes and can mentally prepare

### JTBD-3: Community viewing faction meta
**When** I want to understand which factions are performing well
**I want** to see win rates by faction across all tournaments
**So that** I can make informed choices about what to play

---

## Requirements

### [PS-001] Player Profile Page
**Priority:** P0
**Description:** Public profile page showing player career statistics.

**Route:** `/players/[id]`

**Acceptance Criteria:**
- [ ] Player name and basic info
- [ ] Total tournaments played
- [ ] Overall win/loss/draw record
- [ ] Win rate percentage
- [ ] Total matches played
- [ ] Average OP scored
- [ ] Tournament history list (recent first)

### [PS-002] Win/Loss by Faction Stats
**Priority:** P0
**Description:** Breakdown of performance by faction played.

**Acceptance Criteria:**
- [ ] List of factions played with match count
- [ ] Win/loss/draw record per faction
- [ ] Win rate percentage per faction
- [ ] Most played faction highlighted
- [ ] Best performing faction highlighted

### [PS-003] Head-to-Head Records
**Priority:** P1
**Description:** Record against specific opponents.

**Acceptance Criteria:**
- [ ] List of opponents faced (sorted by matches played)
- [ ] Win/loss record against each opponent
- [ ] Expandable to show individual match history
- [ ] Search/filter opponents

### [PS-004] Tournament History Detail
**Priority:** P1
**Description:** Detailed view of performance in each tournament.

**Acceptance Criteria:**
- [ ] Tournament name, date, location
- [ ] Final placement / total players
- [ ] Faction played
- [ ] Match-by-match results with opponents
- [ ] Total OP/VP/AP scored

### [PS-005] Player Stats API
**Priority:** P0
**Description:** Server-side functions to calculate player statistics.

**Acceptance Criteria:**
- [ ] `getPlayerStats(userId)` - Overall stats
- [ ] `getPlayerFactionStats(userId)` - By-faction breakdown
- [ ] `getPlayerTournamentHistory(userId)` - Tournament list
- [ ] `getHeadToHead(userId, opponentId)` - H2H record
- [ ] Efficient queries (indexes on matches table)

### [PS-006] Faction Meta Dashboard (P2)
**Priority:** P2
**Description:** Platform-wide faction performance statistics.

**Route:** `/stats/factions`

**Acceptance Criteria:**
- [ ] Overall win rates by faction
- [ ] Popular factions (by play rate)
- [ ] Time-filtered views (last 30 days, etc.)

---

## Technical Notes

### Database Queries

**Overall Stats:**
```sql
SELECT
  COUNT(DISTINCT t.id) as tournaments_played,
  COUNT(m.id) as matches_played,
  SUM(CASE WHEN m.winner_id = :userId THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN m.winner_id IS NULL AND m.is_bye = false THEN 1 ELSE 0 END) as draws,
  SUM(CASE WHEN m.winner_id IS NOT NULL AND m.winner_id != :userId THEN 1 ELSE 0 END) as losses,
  AVG(CASE WHEN m.player1_id = :userId THEN m.player1_op ELSE m.player2_op END) as avg_op
FROM matches m
JOIN rounds r ON m.round_id = r.id
JOIN tournaments t ON r.tournament_id = t.id
WHERE m.player1_id = :userId OR m.player2_id = :userId
```

**By Faction:**
```sql
SELECT
  reg.army_faction as faction,
  COUNT(m.id) as matches,
  SUM(CASE WHEN m.winner_id = :userId THEN 1 ELSE 0 END) as wins
FROM matches m
JOIN rounds r ON m.round_id = r.id
JOIN registrations reg ON reg.tournament_id = r.tournament_id AND reg.user_id = :userId
WHERE m.player1_id = :userId OR m.player2_id = :userId
GROUP BY reg.army_faction
```

### Existing Tables Used
- `users` - Player info
- `matches` - Match results (player1_id, player2_id, winner_id, scores)
- `rounds` - Round info
- `tournaments` - Tournament info
- `registrations` - Player-tournament link with faction

### No New Tables Required
All data can be calculated from existing tables.

---

## UI Components to Create

1. **PlayerStatsCard** - Summary stats (tournaments, W/L/D, win rate)
2. **FactionStatsTable** - By-faction performance breakdown
3. **TournamentHistoryList** - List of tournaments with results
4. **HeadToHeadTable** - Opponent records
5. **MatchHistoryRow** - Individual match result display

---

## Files to Create

- `src/app/(public)/players/[id]/page.tsx` - Profile page
- `src/lib/stats/player-stats.ts` - Stats calculation functions
- `src/components/stats/player-stats-card.tsx`
- `src/components/stats/faction-stats-table.tsx`
- `src/components/stats/tournament-history-list.tsx`
- `src/components/stats/head-to-head-table.tsx`
