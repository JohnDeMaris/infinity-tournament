import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerStatsCard } from '@/components/stats/player-stats-card';
import { FactionStatsTable } from '@/components/stats/faction-stats-table';
import { TournamentHistoryList } from '@/components/stats/tournament-history-list';
import { HeadToHeadTable } from '@/components/stats/head-to-head-table';
import {
  getPlayerStats,
  getPlayerFactionStats,
  getPlayerTournamentHistory,
  getAllHeadToHead,
} from '@/lib/stats/player-stats';

interface PlayerProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PlayerProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from('users')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: player ? `${player.name} - Player Profile - ITM` : 'Player Profile - ITM',
  };
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user for header
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let currentUser = null;
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    currentUser = data;
  }

  // Get player info
  const { data: player, error: playerError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', id)
    .single();

  if (playerError || !player) {
    notFound();
  }

  // Fetch all stats in parallel
  const [overallStats, factionStats, tournamentHistory, headToHeadRecords] = await Promise.all([
    getPlayerStats(id),
    getPlayerFactionStats(id),
    getPlayerTournamentHistory(id),
    getAllHeadToHead(id),
  ]);

  // Handle case where player exists but has no stats
  const hasNoStats = !overallStats || overallStats.matchesPlayed === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={currentUser} />

      <main className="flex-1 container py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Player Profile: {player.name}</h1>
          <p className="text-muted-foreground">
            Competitive statistics and tournament history
          </p>
        </div>

        {/* No stats message */}
        {hasNoStats && (
          <Card className="mb-6">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                This player has not participated in any tournaments yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats sections */}
        {!hasNoStats && (
          <div className="space-y-8">
            {/* Overall Stats Card */}
            {overallStats && (
              <section>
                <PlayerStatsCard stats={overallStats} />
              </section>
            )}

            {/* Faction Performance */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Faction Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <FactionStatsTable stats={factionStats} />
                </CardContent>
              </Card>
            </section>

            {/* Tournament History */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Tournament History</CardTitle>
                </CardHeader>
                <CardContent>
                  <TournamentHistoryList history={tournamentHistory} />
                </CardContent>
              </Card>
            </section>

            {/* Head-to-Head Records */}
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Head-to-Head Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <HeadToHeadTable records={headToHeadRecords} />
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
