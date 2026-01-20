# Specification: Tournament Management

## Overview

**Topic of Concern:** Creating and configuring tournaments

**Job to Be Done:** When a TO wants to run an Infinity tournament, I want to create and configure an event with ITS settings, so I can manage the tournament from registration through completion.

## Context

Tournament Organizers need to create events with Infinity-specific settings including point limits, round counts, and ITS format configuration. The tournament lifecycle flows through:
draft → registration → active → completed

## Requirements

### Functional Requirements

1. **[TM-001]** TOs can create a new tournament
   - Required: name, date_start, location
   - Optional: date_end (for multi-day), description

2. **[TM-002]** TOs can configure ITS format settings
   - Point limit: 150, 200, 300, 400, or custom
   - Number of rounds: 3-6
   - Round time limit: 60-180 minutes
   - Scoring type: standard ITS (OP/VP/AP)

3. **[TM-003]** TOs can set registration options
   - Maximum capacity (or unlimited)
   - Registration deadline
   - List submission deadline
   - Open/closed registration toggle

4. **[TM-004]** TOs can manage tournament status
   - Draft: not visible to players, still configuring
   - Registration: visible, accepting signups
   - Active: tournament in progress, rounds running
   - Completed: finished, results finalized

5. **[TM-005]** TOs can view and manage registered players
   - See all registrations with status
   - View submitted army lists
   - Remove players if needed
   - Promote from waitlist

6. **[TM-006]** TOs can edit tournament details
   - Can edit draft/registration status tournaments freely
   - Limited edits once active (no changing rounds/points)

### Non-Functional Requirements

- **Validation:** All required fields validated before save
- **UX:** Multi-step wizard for tournament creation
- **Mobile:** TO management usable on tablet

## User Stories

### Story 1: Create Tournament
**As a** TO
**I want** to create a new tournament
**So that** players can discover and register for my event

**Acceptance Criteria:**
- Given I'm logged in as TO, when I access create tournament, then I see a creation form
- Given I fill required fields, when I submit, then tournament is created in draft status
- Given I'm a regular player, when I try to access create tournament, then I'm denied

### Story 2: Configure ITS Settings
**As a** TO
**I want** to set the point limit and round count
**So that** the tournament follows ITS format

**Acceptance Criteria:**
- Given I'm editing a tournament, when I set point limit to 300, then it saves as 300
- Given I set rounds to 4, when I save, then tournament expects 4 rounds
- Given invalid settings, when I try to save, then I see validation errors

### Story 3: Open Registration
**As a** TO
**I want** to change tournament status to registration
**So that** players can sign up

**Acceptance Criteria:**
- Given a draft tournament, when I click "Open Registration", then status changes to registration
- Given registration is open, when players visit the event, then they can register

### Story 4: View Registered Players
**As a** TO
**I want** to see who has registered
**So that** I can prepare for the event

**Acceptance Criteria:**
- Given my tournament has registrations, when I view player list, then I see all registered players
- Given a player submitted a list, when I view their registration, then I can see their army list

## Technical Notes

- Tournament data in `tournaments` table
- Status changes via RPC or direct update with RLS
- Only organizer_id can modify their tournaments
- Consider optimistic updates for better TO UX

## Out of Scope

- Tournament templates/cloning
- Recurring tournaments
- Multi-format tournaments (single format per event)
- Payment/entry fee handling

## Open Questions

- [ ] Can TOs have co-organizers with edit access?
- [ ] What happens to registrations if TO deletes tournament?

## References

- PRD Section 3: Feature 2 (Tournament Management)
- PRD Section 5: Data Model (Tournament entity)
