# List Validation Specification

**Phase:** 3
**Status:** Planning
**PRD Reference:** Phase 3: List Validation

---

## Jobs to Be Done

### JTBD-1: Player submitting army list
**When** I paste my army code from Infinity Army
**I want** immediate feedback on whether it's valid
**So that** I know if there are issues before the deadline

### JTBD-2: TO checking list compliance
**When** I need to verify all submitted lists before the tournament
**I want** to validate all lists at once and see which have problems
**So that** I can contact players about issues and run a fair event

### JTBD-3: Player viewing validation results
**When** I view my submitted list
**I want** to see a clear breakdown of what was parsed (points, SWC, units)
**So that** I can verify it was parsed correctly

---

## Requirements

### [LV-001] Migrate to Shared Package Parser
**Priority:** P0
**Description:** Replace old `@/lib/army/parser.ts` with `@infinity-tournament/shared/games` parser.

**Acceptance Criteria:**
- [ ] ArmyListForm uses `parseInfinityArmyCode` from shared package
- [ ] ArmyListForm uses `validateInfinityList` from shared package
- [ ] Old `@/lib/army/parser.ts` can be deprecated
- [ ] Faction detection uses shared package faction list

### [LV-002] Real-time Validation Preview
**Priority:** P0
**Description:** Show validation results as user types, with debouncing.

**Acceptance Criteria:**
- [ ] Validation runs 500ms after user stops typing
- [ ] Shows detected faction, points, SWC in preview
- [ ] Shows list of parsed units with costs
- [ ] Errors displayed in red with clear messages
- [ ] Warnings displayed in yellow/amber

### [LV-003] Tournament Rules Validation
**Priority:** P0
**Description:** Validate parsed list against tournament-specific rules.

**Acceptance Criteria:**
- [ ] Validates points against tournament.point_limit
- [ ] Validates SWC against calculated limit (points/50)
- [ ] Error if over points limit
- [ ] Error if over SWC limit
- [ ] Warning if significantly under points (>10 under)

### [LV-004] List Preview Component
**Priority:** P1
**Description:** Visual component showing parsed list breakdown.

**Acceptance Criteria:**
- [ ] Card showing faction (with icon if available)
- [ ] Card showing points (X/Y format) with progress bar
- [ ] Card showing SWC (X/Y format) with progress bar
- [ ] Collapsible list of parsed units with names and costs
- [ ] Clear "Valid" / "Invalid" badge

### [LV-005] TO Batch Validation Page
**Priority:** P1
**Description:** Page for TOs to validate all submitted lists at once.

**Acceptance Criteria:**
- [ ] Route: `/to/[id]/validate-lists`
- [ ] Table showing all registrations with list status
- [ ] Status column: Valid, Invalid, Not Submitted, Pending Validation
- [ ] Expand row to see full validation results
- [ ] Filter by status (show only invalid, show only missing)
- [ ] "Validate All" button to run validation on all lists

### [LV-006] Export Validation Report
**Priority:** P2
**Description:** TO can export validation results for record-keeping.

**Acceptance Criteria:**
- [ ] Export as CSV with columns: Player, Faction, Points, SWC, Status, Errors
- [ ] Export as text summary for email/Discord

---

## Technical Notes

### Existing Code
- **Shared parser:** `packages/shared/src/games/infinity/parser.ts`
  - `parseInfinityArmyCode(code)` - returns ParsedList
  - `validateInfinityList(list, rules)` - returns ValidationResult
  - `detectFaction(code)` - returns faction or null
  - `extractPoints(code)` - returns points or null

- **Old parser (to replace):** `src/lib/army/parser.ts`
  - Simpler implementation, less robust

### Types (from shared package)
```typescript
interface ParsedList {
  raw: string;
  faction: string | null;
  points: number | null;
  units: { name: string; cost: number }[];
  errors: string[];
  warnings: string[];
  swc?: number; // Extracted SWC
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface TournamentRules {
  pointLimit: number;
  swcLimit?: number;
}
```

### Database
- `registrations.army_list_code` - Raw army code text
- `registrations.army_faction` - Selected faction
- `registrations.list_validation_result` - JSONB (NEW - stores ValidationResult)

---

## UI Components to Create

1. **ListValidationPreview** - Shows real-time validation as user types
2. **ParsedListDisplay** - Shows breakdown of parsed list
3. **ValidationBadge** - Simple valid/invalid indicator
4. **TOValidationTable** - Table of all lists with validation status

---

## Migration Path

1. Add new UI components alongside existing form
2. Update ArmyListForm to use shared parser
3. Add list_validation_result column to registrations
4. Store validation result on submit
5. Create TO batch validation page
6. Deprecate old parser (keep for reference)
