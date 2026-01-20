import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PreferencesForm } from '@/components/notifications/preferences-form';

export const metadata = {
  title: 'Notification Preferences - Infinity Tournament Manager',
  description: 'Manage your notification settings',
};

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, notification_prefs')
    .eq('id', authUser.id)
    .single();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Notification Preferences</h1>
      <PreferencesForm
        userId={user.id}
        initialPrefs={user.notification_prefs}
      />
    </div>
  );
}
