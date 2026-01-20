import { createClient } from '@/lib/supabase/server';
import { UserTable } from '@/components/admin/user-table';

interface UserWithCounts {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
  tournaments_organized: number;
  tournaments_participated: number;
}

async function getUsers(): Promise<UserWithCounts[]> {
  const supabase = await createClient();

  // Fetch all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, display_name, is_admin, is_suspended, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  // For each user, get counts of tournaments organized and participated
  const usersWithCounts: UserWithCounts[] = await Promise.all(
    (users || []).map(async (user) => {
      // Count tournaments organized
      const { count: organizedCount } = await supabase
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', user.id);

      // Count tournament registrations (participated)
      const { count: participatedCount } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        id: user.id,
        email: user.email,
        name: user.display_name || 'Unknown',
        is_admin: user.is_admin || false,
        is_suspended: user.is_suspended || false,
        created_at: user.created_at,
        tournaments_organized: organizedCount || 0,
        tournaments_participated: participatedCount || 0,
      };
    })
  );

  return usersWithCounts;
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all registered users.
        </p>
      </div>

      <UserTable users={users} />
    </div>
  );
}
