import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { calculateStandings } from '@/lib/scoring/standings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RealtimeStandings } from '@/components/tournament/realtime-standings';

interface StandingsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StandingsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: tournament
      ? `Standings - ${tournament.name} - ITM`
      : 'Standings - ITM',
  };
}

export default async function StandingsPage({ params }: StandingsPageProps) {
  const { id: tournamentId } = await params;
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

  // Get tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Only show standings for active or completed tournaments
  if (tournament.status !== 'active' && tournament.status !== 'completed') {
    notFound();
  }

  // Get registered players with their info
  const { data: registrations } = await supabase
    .from('registrations')
    .select('user_id, army_faction, user:users(id, name)')
    .eq('tournament_id', tournamentId)
    .eq('status', 'registered');

  const players =
    registrations?.map((r) => {
      const userRecord = Array.isArray(r.user) ? r.user[0] : r.user;
      return {
        id: r.user_id,
        name: userRecord?.name || 'Unknown',
        faction: r.army_faction,
      };
    }) || [];

  // Get all matches for this tournament
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id')
    .eq('tournament_id', tournamentId);

  const roundIds = rounds?.map((r) => r.id) || [];

  let matches: any[] = [];
  if (roundIds.length > 0) {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .in('round_id', roundIds);
    matches = matchData || [];
  }

  // Calculate standings
  const standings = calculateStandings(players, matches, tournament.game_system_id);

  // Count completed rounds
  const { count: completedRounds } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .eq('status', 'completed');

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 container py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link
              href={`/events/${tournamentId}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
            >
              &larr; Back to event
            </Link>
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
            <p className="text-muted-foreground">
              Standings after {completedRounds || 0} of {tournament.rounds} rounds
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tournament Standings</CardTitle>
            <CardDescription>
              Tiebreakers: OP &gt; VP &gt; AP &gt; SoS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RealtimeStandings
              tournamentId={tournamentId}
              roundIds={roundIds}
              players={players}
              initialMatches={matches}
              initialStandings={standings}
              currentUserId={authUser?.id}
              gameSystemId={tournament.game_system_id}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
