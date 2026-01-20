'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RegisterButtonProps {
  tournamentId: string;
  isFull: boolean;
}

export function RegisterButton({ tournamentId, isFull }: RegisterButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('You must be logged in to register');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from('registrations').insert({
      tournament_id: tournamentId,
      user_id: user.id,
      status: isFull ? 'waitlist' : 'registered',
    });

    setIsLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('You are already registered for this event');
      } else {
        toast.error('Failed to register: ' + error.message);
      }
      return;
    }

    if (isFull) {
      toast.success('Added to waitlist!');
    } else {
      toast.success('Successfully registered!');
    }

    router.refresh();
  };

  return (
    <Button
      onClick={handleRegister}
      disabled={isLoading}
      className="w-full"
      variant={isFull ? 'secondary' : 'default'}
    >
      {isLoading
        ? 'Registering...'
        : isFull
          ? 'Join Waitlist'
          : 'Register'}
    </Button>
  );
}
