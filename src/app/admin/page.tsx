import { createClient } from '@/lib/supabase/server';
import { StatsCards, type PlatformStats } from '@/components/admin/stats-cards';
import { AdminActionLog } from '@/components/admin/admin-action-log';
import type { AdminLog } from '@/types/database';

async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient();

  // Calculate date 7 days ago for "this week" queries
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoISO = oneWeekAgo.toISOString();

  // Fetch all stats in parallel
  const [
    usersResult,
    newUsersResult,
    tournamentsResult,
    draftTournamentsResult,
    registrationTournamentsResult,
    activeTournamentsResult,
    completedTournamentsResult,
    newTournamentsResult,
    matchesResult,
  ] = await Promise.all([
    // Total users count
    supabase.from('users').select('*', { count: 'exact', head: true }),

    // New users this week
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgoISO),

    // Total tournaments
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),

    // Tournaments by status
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'registration'),
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),

    // New tournaments this week
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgoISO),

    // Total matches (excluding ongoing matches - only confirmed/completed)
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .in('confirmation_status', ['confirmed', 'completed']),
  ]);

  return {
    totalUsers: usersResult.count ?? 0,
    newUsersThisWeek: newUsersResult.count ?? 0,
    tournaments: {
      total: tournamentsResult.count ?? 0,
      draft: draftTournamentsResult.count ?? 0,
      registration: registrationTournamentsResult.count ?? 0,
      active: activeTournamentsResult.count ?? 0,
      completed: completedTournamentsResult.count ?? 0,
    },
    newTournamentsThisWeek: newTournamentsResult.count ?? 0,
    totalMatches: matchesResult.count ?? 0,
  };
}

async function getRecentAdminLogs(): Promise<(AdminLog & { admin?: { name: string } | null })[]> {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('admin_logs')
    .select(`
      *,
      admin:users!admin_logs_admin_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  return (logs || []).map((log) => ({
    ...log,
    admin: Array.isArray(log.admin) ? log.admin[0] : log.admin,
  }));
}

export default async function AdminDashboardPage() {
  const [stats, logs] = await Promise.all([
    getPlatformStats(),
    getRecentAdminLogs(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and statistics
        </p>
      </div>

      <StatsCards stats={stats} />

      <AdminActionLog logs={logs} maxItems={10} />
    </div>
  );
}
