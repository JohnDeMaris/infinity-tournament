'use client';

import { useState, useEffect } from 'react';
import { usePushSubscription } from '@/hooks/use-push-subscription';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const DISMISS_KEY = 'notification-banner-dismissed';

/**
 * Banner component that prompts users to enable push notifications.
 *
 * Shows only when:
 * - Push notifications are supported
 * - Permission is 'default' (not yet asked)
 * - User is logged in
 * - Banner hasn't been dismissed
 */
export function NotificationPermissionBanner() {
  const {
    isSupported,
    permission,
    isLoading,
    subscribe,
  } = usePushSubscription();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Check if banner was previously dismissed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
      setIsDismissed(dismissed);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, 'true');
    }
  };

  const handleEnable = async () => {
    await subscribe();
    // Banner will auto-hide once permission changes from 'default'
  };

  // Don't show banner if:
  // - Still checking auth state
  // - Push is not supported
  // - Permission is not 'default' (already granted or denied)
  // - User is not logged in
  // - Banner was dismissed
  if (
    isCheckingAuth ||
    !isSupported ||
    permission !== 'default' ||
    !isLoggedIn ||
    isDismissed
  ) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Enable Notifications</CardTitle>
        <CardDescription>
          Get notified when pairings are posted or your opponent submits scores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button
            onClick={handleEnable}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={isLoading}
            size="sm"
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
