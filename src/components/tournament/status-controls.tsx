'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Tournament, TournamentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface StatusControlsProps {
  tournament: Tournament;
}

export function StatusControls({ tournament }: StatusControlsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (newStatus: TournamentStatus) => {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from('tournaments')
      .update({ status: newStatus })
      .eq('id', tournament.id);

    setIsLoading(false);

    if (error) {
      toast.error('Failed to update status: ' + error.message);
      return;
    }

    toast.success(`Tournament status updated to ${newStatus}`);
    router.refresh();
  };

  const getNextAction = () => {
    switch (tournament.status) {
      case 'draft':
        return {
          label: 'Open Registration',
          status: 'registration' as TournamentStatus,
          description:
            'This will make the tournament visible to players and allow them to register.',
          variant: 'default' as const,
        };
      case 'registration':
        return {
          label: 'Start Tournament',
          status: 'active' as TournamentStatus,
          description:
            'This will close registration and allow you to start running rounds. Make sure all players have submitted their lists.',
          variant: 'default' as const,
        };
      case 'active':
        return {
          label: 'Complete Tournament',
          status: 'completed' as TournamentStatus,
          description:
            'This will mark the tournament as finished. Make sure all rounds are complete.',
          variant: 'secondary' as const,
        };
      default:
        return null;
    }
  };

  const action = getNextAction();

  if (!action) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Tournament completed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={action.variant} disabled={isLoading}>
            {isLoading ? 'Updating...' : action.label}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action.label}?</AlertDialogTitle>
            <AlertDialogDescription>{action.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateStatus(action.status)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {tournament.status === 'registration' && (
        <Button
          variant="outline"
          onClick={() => updateStatus('draft')}
          disabled={isLoading}
        >
          Back to Draft
        </Button>
      )}
    </div>
  );
}
