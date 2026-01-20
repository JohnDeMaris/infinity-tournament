# Technical Debt Fixes Specification

**Source PRD:** `docs/PRD-TechnicalDebt.md`
**Created:** 2026-01-20

---

## Overview

Fix accumulated technical debt to establish secure, maintainable foundation before Phase 7 (Payments) and Phase 9 (AI Chat).

---

## Jobs to Be Done

### TD-001: Fix Migration Naming Collision
**User:** Developer deploying the application
**When:** Running database migrations
**Want:** Predictable migration execution order
**So That:** Deployments don't fail due to naming conflicts

**Current State:**
- Two files share `002_` prefix: `002_game_systems.sql` and `002_add_user_admin_fields.sql`
- Migration order is ambiguous

**Acceptance Criteria:**
- All migrations have unique sequential prefixes (001-006)
- `supabase db reset` runs without errors
- Data dependencies preserved (users before game systems)

---

### TD-002: Complete RBAC Middleware
**User:** Tournament Organizer / Admin
**When:** Accessing protected routes
**Want:** Role-based access enforcement
**So That:** Unauthorized users cannot access TO/Admin features

**Current State:**
- Middleware checks authentication but not roles
- Lines 73-76 have TODO comment deferring to page-level checks

**Acceptance Criteria:**
- Middleware fetches user role efficiently (JWT claims or cached DB query)
- `/to/*` routes reject non-TO users with appropriate redirect
- `/admin/*` routes reject non-admin users
- Helpful error message shown to unauthorized users

---

### TD-003: Remove Deprecated Army Parser
**User:** Developer maintaining the codebase
**When:** Working with army list functionality
**Want:** Single source of truth for army parsing
**So That:** No confusion about which parser to use

**Current State:**
- `src/lib/army/parser.ts` duplicates `packages/shared/src/games/infinity/parser.ts`
- Some components may still import from deprecated location

**Acceptance Criteria:**
- `src/lib/army/` directory deleted
- All imports updated to `@infinity-tournament/shared`
- No runtime errors from missing imports
- Army parsing functionality unchanged

---

### TD-004: Enforce CSP Headers
**User:** End user browsing the application
**When:** Application loads
**Want:** Active XSS protection
**So That:** Malicious scripts are blocked

**Current State:**
- CSP headers set as `Content-Security-Policy-Report-Only`
- Violations only reported, not blocked

**Acceptance Criteria:**
- `Content-Security-Policy` header (not Report-Only)
- All legitimate app functionality works
- OBS overlay/spectator mode still functions
- No console CSP violations in normal operation

---

### TD-005: Add Route-Level Error Boundaries
**User:** End user encountering errors
**When:** An error occurs on any page
**Want:** Graceful error handling
**So That:** User can recover without losing navigation

**Current State:**
- Root `error.tsx` and `global-error.tsx` exist
- Route groups may lack specific error boundaries

**Acceptance Criteria:**
- Each major route group has `error.tsx` (auth, public, dashboard, to, admin)
- Error pages show user-friendly message
- "Try again" action available
- Navigation remains functional

---

## Technical Notes

### Migration Renaming Order

Based on dependency analysis:
1. `001_initial_schema.sql` - Base tables (unchanged)
2. `002_add_user_admin_fields.sql` - User admin fields (unchanged)
3. `003_game_systems.sql` - Game system support (was 002)
4. `004_list_validation.sql` - List validation (was 003)
5. `005_admin_dashboard.sql` - Admin dashboard (was 004)
6. `006_notifications.sql` - Notifications (was 005)

### RBAC Implementation Options

**Option A: JWT Custom Claims**
- Set role in `app_metadata` on login/role change
- Read from JWT in middleware - no DB query per request
- Requires trigger to update claims when role changes

**Option B: Cached Database Query**
- Query `users` table for role
- Cache result in session/cookie
- Simpler but adds DB query overhead

Recommendation: JWT claims for performance.

### CSP Considerations for OBS

The spectator overlay at `/events/[id]/live?overlay=true` may need special CSP rules:
- `frame-ancestors 'self' obs:` for OBS browser source
- Separate header rules for `/spectator/*` routes if needed

---

## Out of Scope

- Rate limiting (Phase 10)
- Full security audit (v2)
- Accessibility audit (v1.1)
