# Specification: GameSystemPlugin

## Overview

**Topic of Concern:** Game system plugin architecture for multi-game support

**Job to Be Done:** When I want to run a tournament for different tabletop games, I want to select my game system and have appropriate scoring rules, so the platform works for Infinity, Warhammer, Warmachine, and other games.

## Context

The app must support multiple tabletop wargames, each with different scoring systems, factions, and special rules. A plugin architecture abstracts game-specific logic so the core tournament engine is game-agnostic. Infinity is the first (and default) implementation.

## Requirements

### Functional Requirements

1. **[GSP-001]** Define GameSystem interface for all game-specific configuration
   - Scoring fields (name, min, max, required)
   - Tiebreaker order
   - Winner determination function
   - Faction/army configuration

2. **[GSP-002]** Implement Infinity game module
   - OP/VP/AP scoring fields (0-10, unbounded, 0-pointLimit)
   - Tiebreakers: OP > VP > AP > SoS
   - 11 main factions + sectorials
   - Classified objectives tracking (optional hidden info)

3. **[GSP-003]** Game registry for managing available games
   - `getGameSystem(id)` returns game config
   - `getDefault()` returns Infinity
   - Future: allow registering new games

4. **[GSP-004]** Score form renders dynamically from game config
   - Reads `gameSystem.scoring.fields`
   - Applies validation rules from config
   - Handles `maxFromTournament` (e.g., AP max = point limit)

5. **[GSP-005]** Standings calculation uses game system tiebreakers
   - Sorts by `gameSystem.scoring.tiebreakers` in order
   - Uses `gameSystem.scoring.determineWinner` for win/loss

6. **[GSP-006]** Database stores game_system_id per tournament
   - New tournaments default to 'infinity'
   - Scores stored as generic JSONB

### Non-Functional Requirements

- **Extensibility:** Adding a new game requires only a new module, no core changes
- **Backward Compatibility:** Existing Infinity tournaments continue to work
- **Type Safety:** Full TypeScript types for all game system interfaces

## User Stories

### Story 1: TO Creates Infinity Tournament
**As a** tournament organizer
**I want** to create a tournament with Infinity scoring rules
**So that** score entry and standings work correctly for ITS format

**Acceptance Criteria:**
- Given I create a tournament, when I don't specify game, then Infinity is default
- Given tournament uses Infinity, when players enter scores, then they see OP/VP/AP fields
- Given tournament uses Infinity, when standings calculate, then OP is primary tiebreaker

### Story 2: Player Enters Game-Specific Scores
**As a** player
**I want** the score form to show fields appropriate for my game
**So that** I enter the right data without confusion

**Acceptance Criteria:**
- Given Infinity tournament, when I open score form, then I see OP (0-10), VP, AP fields
- Given AP field, when tournament is 300pts, then max AP is 300

### Story 3: Future - Add New Game System
**As a** developer
**I want** to add support for a new game by creating a module
**So that** I don't need to modify core tournament logic

**Acceptance Criteria:**
- Given I create `games/warhammer40k/index.ts`, when I register it, then it's available
- Given new game has different scoring, when tournament uses it, then correct fields appear

## Technical Notes

### GameSystem Interface

```typescript
interface GameSystem {
  id: string;                  // 'infinity', 'warhammer40k'
  name: string;                // Display name
  version: string;             // Rules version (e.g., 'N5')

  scoring: {
    fields: ScoreField[];      // [{name: 'op', label: 'OP', min: 0, max: 10}]
    tiebreakers: string[];     // ['op', 'vp', 'ap', 'sos']
    byeScores: Record<string, number>;
    determineWinner: (scores: MatchScores) => string | null;
  };

  lists: {
    factions: Faction[];
    pointLevels: number[];
    parser?: (code: string) => ParsedList;
    validator?: (list: ParsedList, rules: TournamentRules) => ValidationResult;
  };

  hiddenInfo?: {
    types: HiddenInfoType[];   // ['classified', 'hidden_deployment']
  };

  ui: {
    colors: { primary: string; secondary: string };
    logo?: string;
  };
}
```

### File Structure

```
packages/shared/src/games/
├── types.ts           # GameSystem interface
├── registry.ts        # Game registry
├── index.ts           # Exports
└── infinity/
    ├── index.ts       # Main module
    ├── factions.ts    # Faction definitions
    ├── hidden-info.ts # Classifieds, etc.
    └── parser.ts      # Army list parser
```

### Database Changes

```sql
-- Add to tournaments table
ALTER TABLE tournaments ADD COLUMN game_system_id TEXT DEFAULT 'infinity';

-- Add generic scores to matches
ALTER TABLE matches ADD COLUMN scores JSONB;
-- scores: {"player1": {"op": 8, "vp": 150}, "player2": {"op": 5, "vp": 120}}
```

## Out of Scope

- Warhammer 40k implementation (future phase)
- Full army list validation (Phase 3)
- Hidden information tracking UI (Phase 2)
- Game system administration UI

## Open Questions

- [ ] Should game systems be stored in database or code-only? (Code-only for MVP)
- [ ] Army list parser accuracy - need sample exports from Infinity Army

## References

- PRD Section 4: Core Architecture: Game System Modularity
- PRD Section 6: Database Schema Changes
