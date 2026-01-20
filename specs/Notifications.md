# Notifications Specification

**Phase:** 5
**Status:** Planning
**PRD Reference:** Phase 5: Notifications

---

## Jobs to Be Done

### JTBD-1: Player notified when pairings are posted
**When** pairings are posted for the next round
**I want** to receive a notification
**So that** I know to check my matchup and find my table

### JTBD-2: Player notified when opponent submits scores
**When** my opponent submits scores for our match
**I want** to receive a notification
**So that** I can confirm or dispute the results quickly

### JTBD-3: Player reminded of deadlines
**When** a deadline is approaching (list submission, registration)
**I want** to receive a reminder
**So that** I don't miss important dates

---

## Requirements

### [NOT-001] Web Push Setup
**Priority:** P0
**Description:** Configure web push notifications infrastructure.

**Acceptance Criteria:**
- [ ] Generate VAPID keys for push notifications
- [ ] Create push subscription management
- [ ] Store subscriptions in database
- [ ] Service worker handles push events

### [NOT-002] Push Permission UI
**Priority:** P0
**Description:** UI for requesting notification permission.

**Acceptance Criteria:**
- [ ] Prompt users to enable notifications
- [ ] Show permission status in settings
- [ ] Handle permission denied gracefully
- [ ] Subscribe to push when permission granted

### [NOT-003] Pairings Posted Notification
**Priority:** P0
**Description:** Notify registered players when pairings are posted.

**Acceptance Criteria:**
- [ ] Trigger when round status changes to 'active'
- [ ] Send to all registered players in tournament
- [ ] Include tournament name and round number
- [ ] Link to tournament page

### [NOT-004] Score Confirmation Notification
**Priority:** P0
**Description:** Notify opponent when scores are submitted.

**Acceptance Criteria:**
- [ ] Trigger when opponent submits scores
- [ ] Send to the other player in the match
- [ ] Include summary of submitted scores
- [ ] Link to match confirmation page

### [NOT-005] Deadline Reminder Notification
**Priority:** P1
**Description:** Remind players of upcoming deadlines.

**Acceptance Criteria:**
- [ ] Reminder 24 hours before registration deadline
- [ ] Reminder 24 hours before list submission deadline
- [ ] Only send to registered players (for list deadline)
- [ ] Only send to potential registrants (for registration deadline)

### [NOT-006] Notification Preferences
**Priority:** P1
**Description:** User controls for notification types.

**Route:** `/dashboard/settings/notifications`

**Acceptance Criteria:**
- [ ] Toggle for pairings notifications
- [ ] Toggle for score notifications
- [ ] Toggle for deadline reminders
- [ ] Save preferences to user profile

---

## Technical Notes

### Database Changes

```sql
-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,  -- {p256dh, auth}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Notification preferences
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"pairings": true, "scores": true, "deadlines": true}';
```

### Service Worker Push Handler

```javascript
// public/sw.js addition
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge.png',
    data: { url: data.url },
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### VAPID Keys

Store in environment variables:
- `VAPID_PUBLIC_KEY` - Public key for client
- `VAPID_PRIVATE_KEY` - Private key for server
- `VAPID_SUBJECT` - mailto: or https: URL

---

## UI Components to Create

1. **NotificationPermissionBanner** - Prompt to enable notifications
2. **NotificationPreferences** - Settings page section
3. **PushSubscriptionManager** - Hook for managing subscriptions

---

## Files to Create

- `src/lib/notifications/vapid.ts` - VAPID key handling
- `src/lib/notifications/push.ts` - Push notification sending
- `src/lib/notifications/subscribe.ts` - Subscription management
- `src/hooks/use-push-subscription.ts` - React hook
- `src/components/notifications/permission-banner.tsx`
- `src/components/notifications/preferences-form.tsx`
- `src/app/dashboard/settings/notifications/page.tsx`
- `supabase/migrations/005_notifications.sql`
