# Specification: Swiss Pairing

## Overview

**Topic of Concern:** Swiss-system pairing algorithm and round management

**Job to Be Done:** When a TO needs to start a round, I want to automatically pair players by standing, so I can efficiently run a fair tournament.

## Context

Swiss pairing is the standard format for Infinity tournaments:
- Players paired by current standing (best vs best)
- No repeat matchups within tournament
- Odd player count handled with bye assignment
- TOs can manually adjust if needed

## Requirements

### Functional Requirements

1. **[SP-001]** System generates Swiss pairings for each round
   - Players sorted by: OP (desc) → VP (desc) → AP (desc)
   - Top player paired with next available unpaired player
   - Continue until all players paired

2. **[SP-002]** System prevents repeat matchups
   - Check previous rounds for matchup history
   - Skip to next eligible opponent if already played
   - If impossible (odd case), flag for TO review

3. **[SP-003]** System handles odd player count with bye
   - Lowest-ranked unpaired player receives bye
   - Player cannot receive bye twice in same tournament
   - Bye awards: 10 OP, 0 VP, 0 AP (configurable)

4. **[SP-004]** System assigns table numbers
   - Sequential assignment: Table 1 = top matchup
   - Or random assignment (TO preference)

5. **[SP-005]** TO can manually adjust pairings
   - Swap players between matches
   - Change table assignments
   - Must maintain valid pairing (all players matched)

6. **[SP-006]** TO can start and complete rounds
   - Start round: generates pairings, notifies players
   - Complete round: requires all scores entered, advances to next

### Non-Functional Requirements

- **Performance:** Pairing calculation < 1 second for 64 players
- **Fairness:** Algorithm must be deterministic given same inputs
- **Reliability:** Pairings persist even if TO disconnects

## User Stories

### Story 1: Generate Round Pairings
**As a** TO
**I want** to generate pairings for the next round
**So that** players know their opponents

**Acceptance Criteria:**
- Given round N is complete, when I click "Start Next Round", then round N+1 pairings are generated
- Given 20 players, when pairings generate, then I see 10 matches
- Given players with scores, when pairings generate, then highest scorers face each other

### Story 2: Handle Odd Player Count
**As a** TO
**I want** the system to handle 15 players
**So that** everyone has a game or bye

**Acceptance Criteria:**
- Given 15 players, when I generate pairings, then 7 matches + 1 bye are created
- Given a player had bye in round 1, when round 2 pairs, then they don't get bye again

### Story 3: Adjust Pairings
**As a** TO
**I want** to swap two players between matches
**So that** I can accommodate special circumstances

**Acceptance Criteria:**
- Given generated pairings, when I select two players to swap, then their matchups are exchanged
- Given I make an invalid swap, when I try to confirm, then I see an error

### Story 4: View My Pairing
**As a** player
**I want** to see my current opponent and table
**So that** I know where to go

**Acceptance Criteria:**
- Given round is active, when I view my dashboard, then I see my opponent and table number
- Given I have a bye, when I view my pairing, then I see "Bye" clearly indicated

## Technical Notes

### Swiss Pairing Algorithm

```typescript
function generatePairings(players: Player[], previousMatches: Match[]): Pairing[] {
  // 1. Sort players by standing
  const sorted = sortByStanding(players);

  // 2. Create set of previous matchups for O(1) lookup
  const played = new Set(previousMatches.map(m => matchupKey(m)));

  // 3. Pair greedily from top
  const pairings: Pairing[] = [];
  const unpaired = [...sorted];

  while (unpaired.length > 1) {
    const p1 = unpaired.shift()!;

    // Find first eligible opponent
    const opponentIdx = unpaired.findIndex(p2 =>
      !played.has(matchupKey(p1, p2))
    );

    if (opponentIdx === -1) {
      // No valid opponent - pair with next anyway (edge case)
      const p2 = unpaired.shift()!;
      pairings.push({ player1: p1, player2: p2 });
    } else {
      const p2 = unpaired.splice(opponentIdx, 1)[0];
      pairings.push({ player1: p1, player2: p2 });
    }
  }

  // 4. Handle bye
  if (unpaired.length === 1) {
    pairings.push({ player1: unpaired[0], player2: null, isBye: true });
  }

  return pairings;
}
```

### Data Model

- `rounds` table: tournament_id, round_number, status
- `matches` table: round_id, player1_id, player2_id (null for bye), table_number

## Out of Scope

- Multiple tournament formats (only Swiss)
- Bracket/elimination rounds
- Player seeding (round 1 is random)
- Drop tracking (player drops, continues without them)

## Open Questions

- [ ] What if no valid pairing exists (everyone has played everyone)?
- [ ] Should round 1 be seeded or random?

## References

- PRD Section 3: Feature 4 (Swiss Pairing System)
- PRD Appendix C: Swiss Pairing Rules
