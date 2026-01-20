# Specification: Player Registration

## Overview

**Topic of Concern:** Player registration for tournaments including army list submission

**Job to Be Done:** When I find a tournament I want to attend, I want to register and submit my army list, so I can participate in the event.

## Context

Players need to:
1. Browse available tournaments
2. Register for events
3. Submit army lists (paste code from Army builder)
4. Track their registration status

The flow ensures TOs have player counts and lists before events.

## Requirements

### Functional Requirements

1. **[PR-001]** Players can browse upcoming tournaments
   - List view with filters (date, location)
   - Shows: name, date, location, point limit, capacity/registered
   - Only shows tournaments in registration or active status

2. **[PR-002]** Players can view tournament details
   - Full event information
   - Current registrations count
   - Registration status (open, closed, full)
   - Their own registration status if registered

3. **[PR-003]** Players can register for open tournaments
   - One-click registration if logged in
   - Added to waitlist if at capacity
   - Cannot register for same tournament twice

4. **[PR-004]** Players can submit army list codes
   - Paste army code from Infinity Army builder
   - System extracts faction name from code
   - Can update list until deadline

5. **[PR-005]** Players can view their registrations
   - Dashboard shows all registered tournaments
   - Shows: tournament name, date, registration status, list status
   - Quick link to submit/update list

6. **[PR-006]** Players can withdraw from tournaments
   - Can withdraw before tournament starts
   - Freed spot goes to waitlist if applicable

### Non-Functional Requirements

- **UX:** Registration should be one-click when possible
- **Feedback:** Clear confirmation of registration
- **Mobile:** Primary use case is mobile browsing/registration

## User Stories

### Story 1: Browse Tournaments
**As a** player
**I want** to see upcoming tournaments
**So that** I can find events to attend

**Acceptance Criteria:**
- Given I visit the events page, when it loads, then I see a list of upcoming tournaments
- Given tournaments exist, when I view the list, then I see name, date, location, point limit
- Given I'm not logged in, when I browse, then I can still see events (but not register)

### Story 2: Register for Tournament
**As a** player
**I want** to register for a tournament
**So that** I can participate

**Acceptance Criteria:**
- Given I'm logged in and viewing an open tournament, when I click register, then I'm registered
- Given tournament is full, when I click register, then I'm added to waitlist
- Given I'm already registered, when I view the tournament, then I see "Registered" status

### Story 3: Submit Army List
**As a** registered player
**I want** to submit my army list
**So that** I'm eligible to play

**Acceptance Criteria:**
- Given I'm registered, when I access list submission, then I can paste my army code
- Given I paste a valid code, when I submit, then it's saved and faction is extracted
- Given deadline has passed, when I try to submit, then I see deadline passed message

### Story 4: View My Registrations
**As a** player
**I want** to see all my registered tournaments
**So that** I can track my upcoming events

**Acceptance Criteria:**
- Given I have registrations, when I view my dashboard, then I see all my registered events
- Given an event needs a list, when I view it, then I see a prompt to submit list

## Technical Notes

- Registrations stored in `registrations` table
- Army list code stored as text, faction extracted via simple parsing
- Waitlist is status='waitlist', ordered by created_at
- Supabase real-time for capacity updates

### Army Code Parsing

Army builder exports codes like:
```
Infantry Combat Group
FACTION: PanOceania
POINTS: 300/300
...
```

Extract faction from "FACTION:" line. Don't validate units (out of scope).

## Out of Scope

- Army list validation (legal units, points total)
- Payment processing
- Team/paired registration
- Transfer registration to another player

## Open Questions

- [ ] What's the exact format of Army builder export codes?
- [ ] Should we show other registered players' names?

## References

- PRD Section 3: Feature 3 (Player Registration)
- PRD User Stories: Epic: Tournament Discovery & Registration
