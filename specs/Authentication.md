# Specification: Authentication

## Overview

**Topic of Concern:** User authentication and account management

**Job to Be Done:** When a player or TO wants to participate in tournaments, I want to create and access my account, so I can register for events and manage my tournament activities.

## Context

The system needs user accounts to:
- Track player registrations and results across tournaments
- Grant TO permissions for tournament management
- Enable score entry and confirmation
- Store player preferences (faction)

Supabase Auth provides email/password authentication with session management.

## Requirements

### Functional Requirements

1. **[AUTH-001]** Users can register with email and password
   - Email must be valid and unique
   - Password must meet minimum security requirements (8+ chars)
   - Profile includes name and optional faction preference

2. **[AUTH-002]** Users can log in with email and password
   - Session persists across browser sessions
   - Session refreshes automatically

3. **[AUTH-003]** Users can log out
   - Clears session on client and server
   - Redirects to public page

4. **[AUTH-004]** Users can reset their password
   - Request reset via email
   - Email contains secure reset link

5. **[AUTH-005]** Users have roles (player, to, admin)
   - All users start as player
   - TO role grants tournament creation access
   - Admin role for platform management (future)

6. **[AUTH-006]** Protected routes require authentication
   - Middleware checks auth state
   - Unauthenticated users redirected to login

### Non-Functional Requirements

- **Security:** Passwords hashed by Supabase, sessions use secure cookies
- **Performance:** Auth checks should not add noticeable latency
- **UX:** Forms show clear error messages, loading states

## User Stories

### Story 1: Player Registration
**As a** new player
**I want** to create an account
**So that** I can register for tournaments

**Acceptance Criteria:**
- Given I'm on the registration page, when I submit valid email/password/name, then my account is created and I'm logged in
- Given I submit an existing email, when I try to register, then I see an error message
- Given I submit invalid data, when I try to register, then I see specific validation errors

### Story 2: User Login
**As a** returning user
**I want** to log in to my account
**So that** I can access my dashboard and tournaments

**Acceptance Criteria:**
- Given I have an account, when I enter correct credentials, then I'm logged in and redirected to dashboard
- Given incorrect credentials, when I try to log in, then I see an error message
- Given I'm already logged in, when I visit login page, then I'm redirected to dashboard

### Story 3: Password Reset
**As a** user who forgot my password
**I want** to reset my password via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- Given I request a password reset, when I enter my email, then I receive a reset email
- Given I have a reset link, when I click it and enter a new password, then my password is updated

## Technical Notes

- Use Supabase Auth with `@supabase/ssr` for server-side session handling
- Middleware at `src/middleware.ts` for route protection
- Auth state managed via Supabase client, no separate state management needed
- User profile data stored in `public.users` table (extends auth.users)

## Out of Scope

- Social login (Google, Discord) - post-MVP
- Email verification requirement - MVP accepts any valid email
- Two-factor authentication
- Account deletion/GDPR workflows

## Open Questions

- [ ] Should TO role be self-service or require approval?

## References

- PRD Section 3: Feature 1 (User Management)
- Supabase Auth documentation
