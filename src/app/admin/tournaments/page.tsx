import { createClient } from '@/lib/supabase/server';
import { TournamentTable } from '@/components/admin/tournament-table';
import type { TournamentStatus } from '@/types/database';

// Type for raw Supabase query result
interface TournamentQueryResult {
  id: string;
  name: string;
  date_start: string;
  status: TournamentStatus;
  organizer: { id: string; name: string } | null;
  registrations: { count: number }[];
}

export default async function AdminTournamentsPage() {
  const supabase = await createClient();

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select(`
      id,
      name,
      date_start,
      status,
      organizer:users!organizer_id (
        id,
        name
      ),
      registrations (
        count
      )
    `)
    .order('date_start', { ascending: false });

  if (error) {
    console.error('Error fetching tournaments:', error);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tournament Management</h1>
        <p className="text-muted-foreground">Failed to load tournaments.</p>
      </div>
    );
  }

  // Transform data to include registration count
  const tournamentsWithCount = (tournaments as unknown as TournamentQueryResult[]).map((t) => ({
    id: t.id,
    name: t.name,
    date_start: t.date_start,
    status: t.status,
    organizer_name: t.organizer?.name ?? 'Unknown',
    player_count: t.registrations?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tournament Management</h1>
        <p className="text-muted-foreground">
          View and manage all tournaments in the system.
        </p>
      </div>

      <TournamentTable tournaments={tournamentsWithCount} />
    </div>
  );
}
