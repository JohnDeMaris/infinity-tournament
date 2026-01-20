# Technical Debt Fixes - Product Requirements Document

**Version:** 1.0
**Created:** 2026-01-20
**Last Updated:** 2026-01-20
**Author:** Ji (AI Assistant)
**Status:** Draft

---

## 1. Problem Statement

### The Problem
The Infinity Tournament Manager has accumulated technical debt during rapid feature development. This debt creates:
- **Security gaps**: Incomplete RBAC allows unauthorized route access
- **Data integrity risks**: Migration naming collision could cause deployment failures
- **Code duplication**: Deprecated army parser duplicates shared package functionality
- **Security posture weakness**: CSP in report-only mode provides no protection

### Current State
- Two migration files share the `002_` prefix, risking deployment conflicts
- Middleware lacks role-based access control for TO-only routes
- Deprecated `src/lib/army/parser.ts` duplicates `packages/shared` functionality
- CSP headers only report violations, don't block attacks

### Opportunity
Fixing this debt now prevents production incidents and establishes a secure, maintainable foundation before adding Phase 7 (Payments) and Phase 9 (AI Chat).

---

## 2. Target User

### Primary User
**Persona:** Development Team
**Description:** Developers maintaining and extending the tournament platform
**Goals:** Deploy safely, maintain code quality, prevent security incidents
**Pain Points:** Confusion about which army parser to use, risk of migration failures

### Secondary Users
**Tournament Organizers (TOs):** Benefit from proper route protection
**Players:** Benefit from enforced CSP blocking XSS attacks

---

## 3. Core Features (MVP)

### Feature 1: Migration Renaming
**Description:** Rename migration files to have sequential, non-conflicting prefixes
**User Value:** Prevents deployment failures, ensures predictable migration order
**Acceptance Criteria:**
- [ ] All migrations have unique numeric prefixes (001-006)
- [ ] Migration order preserves data dependencies
- [ ] `supabase db reset` runs without errors
- [ ] No foreign key or dependency conflicts

### Feature 2: RBAC Middleware
**Description:** Add role-based access control to middleware for TO-only routes
**User Value:** Prevents unauthorized access to tournament organizer features
**Acceptance Criteria:**
- [ ] Middleware fetches user role from database or JWT claims
- [ ] TO-only routes (`/to/*`) reject non-TO users with 403
- [ ] Admin routes reject non-admin users
- [ ] Role check is efficient (cached or JWT-based)
- [ ] Unauthorized access redirects to appropriate page with message

### Feature 3: Remove Deprecated Army Parser
**Description:** Delete `src/lib/army/` and update all imports to use `@infinity-tournament/shared`
**User Value:** Single source of truth, reduced maintenance burden
**Acceptance Criteria:**
- [ ] `src/lib/army/` directory deleted
- [ ] All imports updated to `@infinity-tournament/shared`
- [ ] No runtime errors from missing imports
- [ ] Army parsing functionality unchanged

### Feature 4: Enforce CSP Headers
**Description:** Change CSP from report-only to enforced mode
**User Value:** Active protection against XSS and injection attacks
**Acceptance Criteria:**
- [ ] `Content-Security-Policy` header (not Report-Only)
- [ ] All legitimate app functionality still works
- [ ] No console CSP violations in normal operation
- [ ] OBS overlay/spectator mode still functions (may need frame-ancestors adjustment)

### Feature 5: Add Route-Level Error Boundaries
**Description:** Ensure all route groups have error.tsx files
**User Value:** Graceful error handling, better user experience
**Acceptance Criteria:**
- [ ] Each route group has error.tsx (auth, public, dashboard, to, admin)
- [ ] Errors show user-friendly message with retry option
- [ ] Error details logged for debugging
- [ ] Navigation remains functional after error

---

## 4. User Stories

### Epic: Database Migrations

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| TD-001 | As a developer, I want migrations to have unique prefixes, so that deployments don't fail | P0 | Blocking |
| TD-002 | As a developer, I want `supabase db reset` to work reliably, so that I can test locally | P0 | |

### Epic: Access Control

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| TD-003 | As a TO, I want only TOs to access `/to/*` routes, so that my tournaments are secure | P0 | Security |
| TD-004 | As an admin, I want only admins to access `/admin/*` routes, so that user data is protected | P0 | Security |
| TD-005 | As a player, I want to see a helpful message if I try to access TO routes, so that I understand what happened | P1 | UX |

### Epic: Code Quality

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| TD-006 | As a developer, I want one army parser location, so that I know which to use | P1 | Maintenance |
| TD-007 | As a developer, I want unused code removed, so that the codebase is clean | P1 | |

### Epic: Security Hardening

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| TD-008 | As a user, I want CSP to block malicious scripts, so that my session is protected | P0 | Security |
| TD-009 | As a TO, I want the OBS overlay to still work with CSP, so that I can stream tournaments | P1 | |

### Epic: Error Handling

| ID | Story | Priority | Notes |
|----|-------|----------|-------|
| TD-010 | As a user, I want errors to show helpful messages, so that I know what to do | P1 | UX |
| TD-011 | As a developer, I want errors logged with context, so that I can debug issues | P1 | |

---

## 5. Technical Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Middleware                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Auth Check  │→ │ Role Fetch  │→ │ Route Authorization │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Route Groups                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ (auth)   │  │ (public) │  │ dashboard│  │   /to    │    │
│  │ error.tsx│  │ error.tsx│  │ error.tsx│  │ error.tsx│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Role storage | JWT custom claims | Avoids DB query on every request |
| CSP mode | Enforced | Active protection > monitoring |
| Migration numbering | Sequential 001-006 | Standard convention |

### Migration Renaming Plan

**Current:**
```
001_initial_schema.sql
002_game_systems.sql        ← CONFLICT
002_add_user_admin_fields.sql  ← CONFLICT
003_list_validation.sql
004_admin_dashboard.sql
005_notifications.sql
```

**After:**
```
001_initial_schema.sql
002_add_user_admin_fields.sql  (reordered - users before game systems)
003_game_systems.sql
004_list_validation.sql
005_admin_dashboard.sql
006_notifications.sql
```

### RBAC Implementation

**Option A: Database Query (Simple)**
```typescript
// In middleware - query users table for role
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();
```

**Option B: JWT Claims (Efficient)** ← Recommended
```typescript
// Set custom claim on login/role change
// Read from JWT in middleware - no DB query
const role = user.app_metadata?.role;
```

### CSP Adjustments for OBS

```typescript
// Allow framing for OBS overlay routes only
{
  source: '/spectator/:path*',
  headers: [
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Content-Security-Policy', value: "frame-ancestors 'self' obs:" }
  ]
}
```

---

## 6. Success Metrics

### Primary Metrics
| Metric | Definition | Target | Timeframe |
|--------|------------|--------|-----------|
| Migration Success | `supabase db reset` passes | 100% | Immediate |
| Unauthorized Access | 403s on role-protected routes | 100% blocked | Immediate |
| CSP Violations | Console errors in normal use | 0 | After deploy |

### Secondary Metrics
- Code reduction: Lines removed from deprecated army parser
- Test coverage: Error boundary tests added

### Anti-Metrics
- NOT optimizing for: Feature velocity (this is debt paydown)

---

## 7. Out of Scope (Post-MVP)

| Feature | Why Not MVP | Potential Timeline |
|---------|-------------|-------------------|
| Rate limiting | Different concern | Phase 10 |
| Full security audit | Requires dedicated effort | v2 |
| Observability/monitoring | Infrastructure concern | Phase 10 |
| Accessibility audit | Different focus | v1.1 |

---

## 8. Open Questions

| Question | Impact | Owner | Due Date |
|----------|--------|-------|----------|
| Should role be in JWT claims or DB query? | Performance vs simplicity | Dev | Before impl |
| Does OBS overlay need special CSP rules? | May break streaming | Dev | Test during impl |
| Any downstream dependencies on src/lib/army? | Could break imports | Dev | Check before delete |

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration rename breaks prod DB | Low | High | Test on staging first, backup before |
| CSP blocks legitimate functionality | Medium | Medium | Test all features, keep report-only fallback ready |
| JWT claims not synced with DB role | Low | Medium | Trigger claim update on role change |
| Error boundaries mask real issues | Low | Low | Ensure errors are logged before display |

---

## 10. Timeline & Milestones

| Milestone | Deliverables |
|-----------|--------------|
| M1: Migrations | Renamed migrations, tested locally |
| M2: RBAC | Middleware updated, role checks working |
| M3: Cleanup | Deprecated code removed, imports updated |
| M4: CSP | Headers enforced, OBS tested |
| M5: Error Handling | All routes have error boundaries |

---

## Appendix

### A. Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/002_game_systems.sql` | Rename to 003 |
| `supabase/migrations/003_list_validation.sql` | Rename to 004 |
| `supabase/migrations/004_admin_dashboard.sql` | Rename to 005 |
| `supabase/migrations/005_notifications.sql` | Rename to 006 |
| `src/lib/supabase/middleware.ts` | Add RBAC logic |
| `src/lib/army/parser.ts` | DELETE |
| `next.config.ts` | Change CSP to enforced |
| `src/app/(auth)/error.tsx` | Create if missing |
| `src/app/(public)/error.tsx` | Create if missing |
| `src/app/to/error.tsx` | Create if missing |
| `src/app/admin/error.tsx` | Create if missing |

### B. Related Documentation
- `IMPLEMENTATION_PLAN.md` - Will be updated by Wiggum
- `AGENTS.md` - Project conventions

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Ji | Initial draft |
