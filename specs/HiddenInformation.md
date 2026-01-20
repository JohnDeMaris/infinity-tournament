# Specification: HiddenInformation

## Overview

**Topic of Concern:** Tracking hidden game state during Infinity matches

**Job to Be Done:** When I'm playing an Infinity match, I want to secretly record my classified objectives and hidden units, so the TO can verify them if disputes arise without revealing them to my opponent during play.

## Context

Infinity: The Game has several hidden information mechanics that are unique among tabletop wargames:

1. **Classified Objectives** - Each player secretly selects 2 objectives from a deck at the start of the game
2. **Hidden Deployment** - Certain units can be placed face-down and only revealed when activated
3. **Data Tracker** - One specialist is secretly designated for certain mission objectives
4. **Lieutenant** - The army's leader is secret until they die or are revealed

Currently, players track this information on paper or trust each other. Disputes can arise when a player claims they "always had that objective selected" or debates about which units were hidden deployment.

This feature provides a secure, timestamped way to record hidden information that:
- Only the owning player can see during the game
- Can be revealed at specific moments (when objective completed, unit activated)
- Creates an audit trail the TO can review if needed
- Doesn't require network connectivity (works offline)

## Requirements

### Functional Requirements

1. **[HID-001]** Match state panel in score entry UI
   - Collapsible panel below score entry form
   - Shows current hidden info state for the player
   - Only visible to the owning player (not opponent)

2. **[HID-002]** Classified objective selection
   - Dropdown to select 2 classified objectives from ITS list
   - Lock selection before round starts
   - Reveal button for each objective (timestamps when revealed)

3. **[HID-003]** Hidden deployment tracking
   - Text field to note hidden deployment units
   - Mark as "revealed" with timestamp when activated
   - Free-form to accommodate any unit

4. **[HID-004]** Data tracker designation
   - Single unit designation field
   - Optional - not all missions use it

5. **[HID-005]** State history log
   - Immutable append-only log of all state changes
   - Each entry has: timestamp, action, player, old_value, new_value
   - Stored in match_state JSONB column

6. **[HID-006]** TO override capability
   - TO can view all hidden info for any match in their tournament
   - TO can edit/correct entries if needed (creates audit entry)
   - Accessed via TO management interface

### Non-Functional Requirements

- **Performance:** State changes saved locally first (<50ms), sync in background
- **Security:** Hidden info only visible to owning player and TO
- **Offline:** Full functionality without network (syncs when online)

## User Stories

### Story 1: Player Records Classified Objectives
**As a** tournament player
**I want** to secretly record my classified objectives at game start
**So that** I can prove what I selected if my opponent disputes it

**Acceptance Criteria:**
- Given I'm on the match score page, when I expand the hidden info panel, then I see classified selection fields
- Given I select 2 classifieds, when I click "Lock Selections", then they're saved with timestamp
- Given my classifieds are locked, when I complete one, then I can click "Reveal" to mark it complete
- Given the match ends, when TO reviews, then they can see my locked selections and reveal times

### Story 2: Player Tracks Hidden Deployment
**As a** player with hidden deployment units
**I want** to record which units are face-down
**So that** I have proof of what was hidden if questioned

**Acceptance Criteria:**
- Given I have hidden deployment models, when I enter their names, then they're saved to match state
- Given a hidden unit activates, when I mark it revealed, then timestamp is recorded
- Given the game ends, when reviewing the log, then I can see when each unit was revealed

### Story 3: TO Resolves Dispute
**As a** Tournament Organizer
**I want** to view hidden info for any match
**So that** I can resolve disputes fairly

**Acceptance Criteria:**
- Given I'm managing a tournament, when I view a match, then I see a "View Hidden Info" button
- Given I click View Hidden Info, when panel opens, then I see both players' hidden state
- Given there's an error, when I edit an entry, then my change is logged with TO attribution

## Technical Notes

### Data Model

The `match_state` JSONB column stores:
```typescript
interface MatchState {
  player1: PlayerHiddenState;
  player2: PlayerHiddenState;
  history: StateHistoryEntry[];
}

interface PlayerHiddenState {
  classifieds: {
    selected: string[];      // IDs of selected classifieds
    locked_at: string | null; // ISO timestamp when locked
    revealed: string[];       // IDs that have been revealed
    reveal_times: Record<string, string>; // ID -> ISO timestamp
  };
  hidden_deployment: {
    units: string[];         // Free-form unit descriptions
    revealed: string[];       // Revealed unit descriptions
    reveal_times: Record<string, string>;
  };
  data_tracker: {
    unit: string | null;
    designated_at: string | null;
  };
  lieutenant: {
    unit: string | null;
    revealed_at: string | null;
  };
}

interface StateHistoryEntry {
  timestamp: string;
  player_id: string;
  action: 'set' | 'reveal' | 'lock' | 'edit';
  field: string;
  old_value: unknown;
  new_value: unknown;
  edited_by?: string; // Set if TO made the change
}
```

### Component Structure

```
src/components/match/
├── hidden-info-panel.tsx      # Main collapsible panel
├── classified-selector.tsx    # Classified objective picker
├── hidden-deployment-list.tsx # Hidden unit tracker
├── data-tracker-field.tsx     # Data tracker designation
├── state-history-log.tsx      # Audit log viewer (TO only)
└── index.ts
```

### Integration Points

- Extends existing score-form.tsx with optional panel
- Uses match.match_state JSONB column (already in schema)
- Works with offline sync engine from Phase 0
- Respects game system configuration (Infinity-specific)

## Out of Scope

- Command token tracking (nice-to-have, not core)
- Automatic objective validation (just tracking, not rules enforcement)
- Photo/image upload for disputes
- Real-time sync of hidden info (opponent doesn't need live updates)
- Multi-round objective tracking (each round is independent)

## Open Questions

- [x] Should classifieds auto-lock when round timer starts? (No, manual lock)
- [ ] Should we show a "pending reveal" state when player claims objective? (Deferred)
- [x] How to handle ITS missions with different classified counts? (Default 2, configurable per mission later)

## References

- PRD Section 5: Phase 2 - Hidden Information Tracking
- ITS Season 15 Rules: Classified Objectives
- packages/shared/src/games/infinity/hidden-info.ts - Existing type definitions
