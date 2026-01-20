import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';

export default async function TOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!user) {
    redirect('/login');
  }

  // Check if user has TO or admin role
  if (user.role !== 'to' && user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
