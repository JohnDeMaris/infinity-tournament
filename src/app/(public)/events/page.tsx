import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { TournamentCard } from '@/components/tournament/tournament-card';

export const metadata = {
  title: 'Events - Infinity Tournament Manager',
  description: 'Browse upcoming Infinity tournaments',
};

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let user = null;
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    user = data;
  }

  // Get all public tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, organizer:users(id, name)')
    .in('status', ['registration', 'active', 'completed'])
    .order('date_start', { ascending: true });

  // Separate upcoming and past tournaments
  const today = new Date().toISOString().split('T')[0];
  const upcomingTournaments = tournaments?.filter(
    (t) => t.date_start >= today || t.status === 'active'
  ) || [];
  const pastTournaments = tournaments?.filter(
    (t) => t.date_start < today && t.status === 'completed'
  ) || [];

  // Get registration counts
  const tournamentIds = tournaments?.map((t) => t.id) || [];
  const countsMap = new Map<string, number>();

  if (tournamentIds.length > 0) {
    const { data: registrations } = await supabase
      .from('registrations')
      .select('tournament_id')
      .in('tournament_id', tournamentIds)
      .eq('status', 'registered');

    registrations?.forEach((r) => {
      countsMap.set(r.tournament_id, (countsMap.get(r.tournament_id) || 0) + 1);
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-8">Events</h1>

        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          {upcomingTournaments.length === 0 ? (
            <p className="text-muted-foreground">
              No upcoming events at this time.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  registeredCount={countsMap.get(tournament.id) || 0}
                />
              ))}
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastTournaments.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  registeredCount={countsMap.get(tournament.id) || 0}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
