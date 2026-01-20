import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConnectedAccounts } from '@/components/settings/connected-accounts';

export const metadata = {
  title: 'Connected Accounts - Infinity Tournament Manager',
  description: 'Manage your connected authentication providers',
};

export default async function AccountsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Connected Accounts</h1>
      <ConnectedAccounts />
    </div>
  );
}
