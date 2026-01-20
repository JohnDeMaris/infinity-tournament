# Specification: ITS Scoring

## Overview

**Topic of Concern:** Score entry, confirmation, and ITS scoring rules

**Job to Be Done:** When a game ends, I want to enter my scores and have them confirmed, so I can accurately track tournament standings.

## Context

ITS (Infinity Tournament System) uses three scoring components:
- **Objective Points (OP):** 0-10, primary ranking factor
- **Victory Points (VP):** Points scored during game (mission-dependent)
- **Army Points (AP):** Enemy army points destroyed

Score accuracy is critical. Dual confirmation (both players) or TO validation prevents disputes.

## Requirements

### Functional Requirements

1. **[SC-001]** Players can enter game scores
   - Input: OP (0-10), VP (0-300+), AP (0-300+)
   - Each player enters their own scores
   - Scores locked after both confirm

2. **[SC-002]** Score confirmation flow
   - Option A: Both players confirm scores match
   - Option B: TO enters/validates scores directly
   - Mismatches flagged for TO review

3. **[SC-003]** TO can edit any match scores
   - Override player-entered scores
   - Enter scores if players don't
   - Add notes for disputes

4. **[SC-004]** System validates score entries
   - OP must be 0-10
   - VP must be >= 0
   - AP must be 0 to point limit
   - Both players' scores must be entered

5. **[SC-005]** Bye scores are automatic
   - Player with bye receives: 10 OP, 0 VP, 0 AP
   - No opponent scores (bye has no opponent)

6. **[SC-006]** Winner determined from scores
   - Player with higher OP wins
   - If OP tied, VP tiebreaker
   - If still tied, draw

### Non-Functional Requirements

- **Speed:** Score entry < 30 seconds
- **Mobile:** Primary input device is phone
- **Clarity:** Large touch targets, clear labels

## User Stories

### Story 1: Enter Game Scores
**As a** player
**I want** to enter my game results
**So that** standings update correctly

**Acceptance Criteria:**
- Given my match is active, when I access score entry, then I see fields for OP/VP/AP
- Given I enter 8/215/180, when I submit, then my scores are saved
- Given invalid OP (15), when I submit, then I see validation error

### Story 2: Confirm Match Result
**As a** player
**I want** to confirm my opponent's scores
**So that** the result is verified

**Acceptance Criteria:**
- Given opponent entered their scores, when I view the match, then I see their scores
- Given scores look correct, when I click confirm, then match is locked
- Given scores look wrong, when I click dispute, then TO is notified

### Story 3: Resolve Score Dispute
**As a** TO
**I want** to see disputed scores
**So that** I can resolve conflicts

**Acceptance Criteria:**
- Given a match is disputed, when I view TO dashboard, then I see it flagged
- Given I review the dispute, when I enter final scores, then match is resolved

### Story 4: View Match History
**As a** player
**I want** to see my completed matches
**So that** I can review my performance

**Acceptance Criteria:**
- Given I completed matches, when I view my history, then I see all results
- Given a match result, when I view it, then I see both players' scores

## Technical Notes

### Score Entry UI

```
┌─────────────────────────────────────┐
│ Round 2 - Table 5                   │
│ vs. John Smith (PanOceania)         │
├─────────────────────────────────────┤
│ Your Scores                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ OP: 8   │ │ VP: 215 │ │ AP: 180 │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│ Opponent's Scores (from them)       │
│ OP: 5  |  VP: 180  |  AP: 150       │
│                                     │
│ [Confirm Scores]  [Report Issue]    │
└─────────────────────────────────────┘
```

### Match Confirmation States

- `pending`: Neither player entered scores
- `partial`: One player entered, waiting for other
- `disputed`: Scores don't match or flagged
- `confirmed`: Both confirmed or TO validated
- `completed`: Locked, affects standings

### Data Model

```sql
-- Match scores
player1_op, player1_vp, player1_ap,
player2_op, player2_vp, player2_ap,
confirmed_by_p1: boolean,
confirmed_by_p2: boolean,
winner_id: uuid (null if draw)
```

## Out of Scope

- Mission-specific scoring (beyond OP/VP/AP)
- Classified objectives tracking
- Sportsmanship/painting scores
- Automatic score calculation from game state

## Open Questions

- [ ] Should scores be visible to other players during round?
- [ ] Time limit for score entry before auto-escalation?

## References

- PRD Section 3: Feature 5 (ITS Scoring)
- PRD Appendix B: ITS Scoring Reference
