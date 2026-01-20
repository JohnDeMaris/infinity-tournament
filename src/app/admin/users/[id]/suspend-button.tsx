'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { suspendUser, unsuspendUser } from '@/lib/admin/actions';
import { useCsrfToken } from '@/hooks/use-csrf-token';

interface SuspendUserButtonProps {
  userId: string;
  isSuspended: boolean;
  isAdmin: boolean;
}

export function SuspendUserButton({
  userId,
  isSuspended,
  isAdmin,
}: SuspendUserButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { token: csrfToken, loading: csrfLoading } = useCsrfToken();

  // Don't show suspend button for admin users
  if (isAdmin) {
    return null;
  }

  const handleToggleSuspension = async () => {
    setIsPending(true);
    setError(null);

    try {
      const result = isSuspended
        ? await unsuspendUser(userId, csrfToken)
        : await suspendUser(userId, csrfToken);

      if (!result.success) {
        setError(result.error || 'An error occurred');
      } else {
        // Refresh the page to show updated status
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error toggling user suspension:', err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant={isSuspended ? 'default' : 'destructive'}
        onClick={handleToggleSuspension}
        disabled={isPending || csrfLoading}
      >
        {isPending
          ? isSuspended
            ? 'Unsuspending...'
            : 'Suspending...'
          : isSuspended
            ? 'Unsuspend User'
            : 'Suspend User'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
