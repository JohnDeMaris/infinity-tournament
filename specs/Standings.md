# Specification: Standings

## Overview

**Topic of Concern:** Live standings calculation and display

**Job to Be Done:** When I'm at a tournament, I want to see real-time standings, so I can know my position and track the competition.

## Context

Standings must update in real-time as scores are entered. ITS uses a specific tiebreaker hierarchy:
1. Total Objective Points (OP)
2. Total Victory Points (VP)
3. Total Army Points (AP)
4. Strength of Schedule (SoS)

Mobile-first display for players checking standings between rounds.

## Requirements

### Functional Requirements

1. **[ST-001]** System calculates standings after each score entry
   - Sum OP, VP, AP across all completed matches
   - Calculate win/loss/draw record
   - Apply tiebreaker hierarchy

2. **[ST-002]** Standings update in real-time
   - Supabase real-time subscription
   - No manual refresh needed
   - Graceful degradation if connection lost

3. **[ST-003]** Display standings with all relevant data
   - Rank, player name, faction
   - Total OP, VP, AP
   - Win-Loss-Draw record
   - Current round opponent (during round)

4. **[ST-004]** Calculate Strength of Schedule (SoS)
   - Sum of all opponents' OP totals
   - Fourth tiebreaker after OP/VP/AP
   - Updates as opponents' scores change

5. **[ST-005]** Show round-by-round results
   - Expandable view per round
   - All matchups and scores
   - Filterable by player

6. **[ST-006]** Export final standings
   - CSV format for TO records
   - Includes all scoring data
   - Top 3/winners highlighted

### Non-Functional Requirements

- **Performance:** Standings render < 500ms for 64 players
- **Real-time:** Updates within 2 seconds of score confirmation
- **Mobile:** Readable on small screens, swipeable columns

## User Stories

### Story 1: View Live Standings
**As a** player
**I want** to see current standings
**So that** I know my tournament position

**Acceptance Criteria:**
- Given tournament is active, when I view standings, then I see ranked player list
- Given new score is entered, when I watch standings, then they update automatically
- Given I'm ranked 5th, when I view standings, then my row is highlighted

### Story 2: Check Tiebreaker Details
**As a** player
**I want** to see why I'm ranked below someone with same OP
**So that** I understand the tiebreaker

**Acceptance Criteria:**
- Given same OP as another player, when I view standings, then VP shows as tiebreaker
- Given standings table, when I look at columns, then OP/VP/AP/SoS are visible

### Story 3: View Round Results
**As a** player
**I want** to see all results from Round 2
**So that** I can review the competition

**Acceptance Criteria:**
- Given round 2 is complete, when I view round results, then I see all matchups
- Given a matchup, when I view it, then I see both players' scores

### Story 4: Export Final Standings
**As a** TO
**I want** to export final standings
**So that** I have records for ITS reporting

**Acceptance Criteria:**
- Given tournament is complete, when I click export, then CSV downloads
- Given CSV, when I open it, then all player scores are included

## Technical Notes

### Standings Calculation

```typescript
interface Standing {
  rank: number;
  playerId: string;
  playerName: string;
  faction: string;
  totalOp: number;
  totalVp: number;
  totalAp: number;
  wins: number;
  losses: number;
  draws: number;
  sos: number;
}

function calculateStandings(matches: Match[], players: Player[]): Standing[] {
  // 1. Aggregate scores per player
  const stats = aggregatePlayerStats(matches, players);

  // 2. Calculate SoS for each player
  const withSos = calculateStrengthOfSchedule(stats, matches);

  // 3. Sort by tiebreaker hierarchy
  const sorted = withSos.sort((a, b) => {
    if (a.totalOp !== b.totalOp) return b.totalOp - a.totalOp;
    if (a.totalVp !== b.totalVp) return b.totalVp - a.totalVp;
    if (a.totalAp !== b.totalAp) return b.totalAp - a.totalAp;
    return b.sos - a.sos;
  });

  // 4. Assign ranks (handle ties)
  return assignRanks(sorted);
}
```

### Strength of Schedule (SoS)

```typescript
function calculateSoS(playerId: string, matches: Match[], standings: Map<string, number>): number {
  // Get all opponents this player faced
  const opponents = matches
    .filter(m => m.player1_id === playerId || m.player2_id === playerId)
    .map(m => m.player1_id === playerId ? m.player2_id : m.player1_id)
    .filter(id => id !== null); // Exclude byes

  // Sum opponents' total OP
  return opponents.reduce((sum, oppId) => sum + (standings.get(oppId) ?? 0), 0);
}
```

### Real-time Updates

- Subscribe to `matches` table changes
- Recalculate standings on any update
- Debounce rapid updates (100ms)
- Optimistic local updates where safe

### Mobile Display

```
┌─────────────────────────────────────┐
│ #  Player          OP  VP   W-L-D  │
├─────────────────────────────────────┤
│ 1  John S. (YJ)    27  645   3-0   │
│ 2  Mike P. (PO)    25  590   2-1   │
│ 3  Sarah K. (Nom)  24  520   2-1   │
│ ★ 4  You (CA)      22  480   2-1   │
│ 5  Tim R. (Haq)    20  410   1-2   │
└─────────────────────────────────────┘
← Swipe for AP, SoS →
```

## Out of Scope

- Historical standings (only current tournament)
- Cross-tournament rankings
- Player statistics/analytics
- Predictions/projections

## Open Questions

- [ ] How to handle ties in final standings (co-champions)?
- [ ] Should SoS be visible to players or TO-only?

## References

- PRD Section 3: Feature 6 (Live Standings)
- PRD Appendix B: ITS Scoring Reference (Tiebreaker Order)
