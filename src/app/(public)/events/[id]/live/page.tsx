'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { calculateStandings } from '@/lib/scoring/standings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RealtimeStandings } from '@/components/tournament/realtime-standings';
import { MatchTicker } from '@/components/tournament/match-ticker';
import { RoundClock } from '@/components/tournament/round-clock';
import { OverlayStandings } from '@/components/tournament/overlay-standings';
import { Skeleton } from '@/components/ui/skeleton';
import type { Standing } from '@/types';

interface PlayerData {
  id: string;
  name: string;
  faction: string | null;
}

interface MatchData {
  id: string;
  round_id: string;
  player1_id: string;
  player2_id: string | null;
  player1_op: number | null;
  player1_vp: number | null;
  player1_ap: number | null;
  player2_op: number | null;
  player2_vp: number | null;
  player2_ap: number | null;
  scores: { player1: Record<string, number>; player2: Record<string, number> } | null;
  winner_id: string | null;
  is_bye: boolean;
  confirmation_status: string;
  updated_at?: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string } | null;
  round?: { round_number: number };
}

interface RoundData {
  id: string;
  round_number: number;
  status: string;
  started_at: string | null;
}

interface TournamentData {
  id: string;
  name: string;
  status: string;
  rounds: number;
  time_limit: number;
  game_system_id: string;
}

export default function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams();
  const isOverlay = searchParams.get('overlay') === 'true';

  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [roundIds, setRoundIds] = useState<string[]>([]);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setTournamentId(id));
  }, [params]);

  // Fetch all data
  useEffect(() => {
    if (!tournamentId) return;

    const fetchData = async () => {
      const supabase = createClient();

      // Get tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name, status, rounds, time_limit, game_system_id')
        .eq('id', tournamentId)
        .single();

      if (tournamentError || !tournamentData) {
        setError('Tournament not found');
        setLoading(false);
        return;
      }

      // Only show for active or completed tournaments
      if (tournamentData.status !== 'active' && tournamentData.status !== 'completed') {
        setError('Tournament is not active');
        setLoading(false);
        return;
      }

      setTournament(tournamentData);

      // Get registered players
      const { data: registrations } = await supabase
        .from('registrations')
        .select('user_id, army_faction, user:users(id, name)')
        .eq('tournament_id', tournamentId)
        .eq('status', 'registered');

      const playerList = registrations?.map((r) => {
        const userRecord = Array.isArray(r.user) ? r.user[0] : r.user;
        return {
          id: r.user_id,
          name: (userRecord as { name: string })?.name || 'Unknown',
          faction: r.army_faction,
        };
      }) || [];

      setPlayers(playerList);

      // Get all rounds
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('id, round_number, status, started_at')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: false });

      const rounds = roundsData || [];
      const roundIdList = rounds.map((r) => r.id);
      setRoundIds(roundIdList);

      // Find current round (active or most recent completed)
      const activeRound = rounds.find((r) => r.status === 'active');
      const currentRoundData = activeRound || rounds[0] || null;
      setCurrentRound(currentRoundData);

      // Get all matches with player info
      if (roundIdList.length > 0) {
        const { data: matchData } = await supabase
          .from('matches')
          .select(`
            *,
            player1:users!matches_player1_id_fkey(id, name),
            player2:users!matches_player2_id_fkey(id, name),
            round:rounds!matches_round_id_fkey(round_number)
          `)
          .in('round_id', roundIdList);

        setMatches(matchData || []);

        // Calculate initial standings
        const initialStandings = calculateStandings(
          playerList,
          matchData || [],
          tournamentData.game_system_id
        );
        setStandings(initialStandings);
      }

      setLoading(false);
    };

    fetchData();
  }, [tournamentId]);

  // Loading state
  if (loading) {
    if (isOverlay) {
      return <div className="p-4"><Skeleton className="h-64 w-full" /></div>;
    }
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !tournament) {
    if (isOverlay) {
      return <div className="text-white text-center p-4">{error || 'Error loading'}</div>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{error || 'Tournament not found'}</p>
            <Link href="/events" className="text-primary hover:underline mt-4 inline-block">
              Browse events
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Overlay mode - minimal UI for OBS
  if (isOverlay) {
    return (
      <div className="overlay-container">
        <OverlayStandings standings={standings} maxRows={10} showHeader={true} />
        <style jsx global>{`
          body {
            background: transparent !important;
            margin: 0;
            padding: 0;
          }
          .overlay-container {
            padding: 0;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // Full live page
  const completedRoundsCount = roundIds.filter((_, i) => {
    const round = matches.find((m) => m.round_id === roundIds[i]);
    return round; // simplified check
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/events/${tournament.id}`}
                className="text-sm text-muted-foreground hover:text-foreground mb-1 inline-block"
              >
                &larr; Event details
              </Link>
              <h1 className="text-2xl font-bold">{tournament.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Current Round */}
              {currentRound && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Round {currentRound.round_number} of {tournament.rounds}
                </Badge>
              )}
              {/* Round Clock */}
              {currentRound?.started_at && currentRound.status === 'active' && (
                <RoundClock
                  startTime={currentRound.started_at}
                  durationMinutes={tournament.time_limit}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Standings - Main Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Live Standings</CardTitle>
              </CardHeader>
              <CardContent>
                <RealtimeStandings
                  tournamentId={tournament.id}
                  roundIds={roundIds}
                  players={players}
                  initialMatches={matches}
                  initialStandings={standings}
                  gameSystemId={tournament.game_system_id}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Ticker */}
            <MatchTicker
              tournamentId={tournament.id}
              roundIds={roundIds}
              initialMatches={matches}
              maxItems={8}
            />

            {/* Stream Overlay Link */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stream Overlay</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  For OBS/streaming, use this URL as a browser source:
                </p>
                <code className="text-xs bg-muted p-2 rounded block break-all">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/events/${tournament.id}/live?overlay=true`
                    : `/events/${tournament.id}/live?overlay=true`}
                </code>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
