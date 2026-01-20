'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { NotificationPrefs } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

interface PreferencesFormProps {
  userId: string;
  initialPrefs: NotificationPrefs;
}

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ id, checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? 'bg-primary' : 'bg-input'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg
          ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export function PreferencesForm({ userId, initialPrefs }: PreferencesFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    pairings: initialPrefs?.pairings ?? true,
    scores: initialPrefs?.scores ?? true,
    deadlines: initialPrefs?.deadlines ?? true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (key: keyof NotificationPrefs) => (checked: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: checked }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase
      .from('users')
      .update({
        notification_prefs: prefs,
      })
      .eq('id', userId);

    setIsLoading(false);

    if (error) {
      toast.error('Failed to save notification preferences');
      return;
    }

    toast.success('Notification preferences saved');
    setHasChanges(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pairings" className="text-base cursor-pointer">
              Pairings Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when round pairings are posted
            </p>
          </div>
          <ToggleSwitch
            id="pairings"
            checked={prefs.pairings}
            onChange={handleToggle('pairings')}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="scores" className="text-base cursor-pointer">
              Score Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when your opponent submits match scores
            </p>
          </div>
          <ToggleSwitch
            id="scores"
            checked={prefs.scores}
            onChange={handleToggle('scores')}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="deadlines" className="text-base cursor-pointer">
              Deadline Reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              Get reminded 24 hours before registration and list deadlines
            </p>
          </div>
          <ToggleSwitch
            id="deadlines"
            checked={prefs.deadlines}
            onChange={handleToggle('deadlines')}
            disabled={isLoading}
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
          {isLoading ? 'Saving...' : 'Save preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
}
