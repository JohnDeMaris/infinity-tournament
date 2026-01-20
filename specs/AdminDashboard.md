# Admin Dashboard Specification

**Phase:** 8
**Status:** Planning
**PRD Reference:** Phase 8: Admin Dashboard

---

## Jobs to Be Done

### JTBD-1: Platform admin monitoring users
**When** I notice suspicious activity or receive a report
**I want** to view and manage user accounts
**So that** I can investigate and take action on problematic users

### JTBD-2: Platform admin managing tournaments
**When** spam tournaments are created or a TO abandons an event
**I want** to view and manage all tournaments
**So that** I can clean up the platform and help players

### JTBD-3: Platform admin understanding growth
**When** I want to understand platform usage and growth
**I want** to see aggregate statistics
**So that** I can make informed decisions about features and resources

---

## Requirements

### [AD-001] Admin Route Protection
**Priority:** P0
**Description:** Admin-only route group with role-based access control.

**Route:** `/admin/*`

**Acceptance Criteria:**
- [ ] Admin routes protected by middleware
- [ ] Check user role from database (is_admin column)
- [ ] Redirect non-admins to home page
- [ ] Show unauthorized message

### [AD-002] User Management Page
**Priority:** P0
**Description:** View and manage all platform users.

**Route:** `/admin/users`

**Acceptance Criteria:**
- [ ] Table showing all users
- [ ] Columns: Name, Email, Registered Date, Tournaments, Status
- [ ] Search by name or email
- [ ] Filter by status (active, suspended)
- [ ] Actions: View profile, Suspend/Unsuspend
- [ ] Pagination for large user lists

### [AD-003] User Detail View
**Priority:** P0
**Description:** Detailed view of a single user.

**Route:** `/admin/users/[id]`

**Acceptance Criteria:**
- [ ] User profile information
- [ ] List of tournaments they've organized
- [ ] List of tournaments they've participated in
- [ ] Recent activity log
- [ ] Admin actions: Edit role, Suspend, Delete

### [AD-004] Tournament Management Page
**Priority:** P0
**Description:** View and manage all tournaments.

**Route:** `/admin/tournaments`

**Acceptance Criteria:**
- [ ] Table showing all tournaments
- [ ] Columns: Name, Organizer, Date, Status, Players
- [ ] Search by name
- [ ] Filter by status, date range
- [ ] Actions: View, Delete
- [ ] Bulk delete for spam cleanup

### [AD-005] Platform Statistics Dashboard
**Priority:** P1
**Description:** Overview of platform metrics.

**Route:** `/admin` (dashboard home)

**Acceptance Criteria:**
- [ ] Total registered users
- [ ] Total tournaments (by status)
- [ ] Total matches played
- [ ] New users this week/month
- [ ] New tournaments this week/month
- [ ] Simple charts showing growth trends

### [AD-006] Admin Activity Log
**Priority:** P1
**Description:** Audit trail of admin actions.

**Acceptance Criteria:**
- [ ] Log all admin actions (suspend user, delete tournament, etc.)
- [ ] Show recent admin actions on dashboard
- [ ] Admin action includes: timestamp, admin user, action type, target

---

## Technical Notes

### Database Changes

```sql
-- Add admin flag to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Admin activity log
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,  -- 'user', 'tournament'
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User status for suspension
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'suspended'));
```

### Middleware Pattern

```typescript
// src/middleware.ts or src/app/admin/layout.tsx
export async function checkAdminAccess(userId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return user?.is_admin === true;
}
```

### Existing Tables Used
- `users` - User info
- `tournaments` - Tournament info
- `registrations` - For player counts
- `matches` - For match counts

---

## UI Components to Create

1. **AdminLayout** - Admin-specific layout with sidebar navigation
2. **AdminStats** - Stats cards for dashboard
3. **UserTable** - Paginated user list with search/filter
4. **TournamentTable** - Paginated tournament list with search/filter
5. **AdminActionLog** - Recent admin actions display

---

## Files to Create

- `src/app/admin/layout.tsx` - Admin layout with sidebar
- `src/app/admin/page.tsx` - Dashboard home with stats
- `src/app/admin/users/page.tsx` - User management
- `src/app/admin/users/[id]/page.tsx` - User detail
- `src/app/admin/tournaments/page.tsx` - Tournament management
- `src/components/admin/stats-cards.tsx` - Stats display
- `src/components/admin/user-table.tsx` - User list
- `src/components/admin/tournament-table.tsx` - Tournament list
- `src/components/admin/admin-action-log.tsx` - Activity log
- `src/lib/admin/actions.ts` - Admin server actions
- `supabase/migrations/004_admin_dashboard.sql` - Schema updates
