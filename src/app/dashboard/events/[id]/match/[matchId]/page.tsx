import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ScoreForm } from '@/components/scoring/score-form';

interface MatchPageProps {
  params: Promise<{ id: string; matchId: string }>;
}

export const metadata = {
  title: 'Enter Scores - ITM',
};

export default async function MatchPage({ params }: MatchPageProps) {
  const { id: tournamentId, matchId } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Get tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, name, point_limit, status, game_system_id')
    .eq('id', tournamentId)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Get match with player info
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(`
      *,
      round:rounds(id, round_number, tournament_id)
    `)
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    notFound();
  }

  // Verify match belongs to this tournament
  if (match.round?.tournament_id !== tournamentId) {
    notFound();
  }

  // Verify user is in this match
  if (match.player1_id !== authUser.id && match.player2_id !== authUser.id) {
    redirect(`/events/${tournamentId}`);
  }

  // Get player details
  const { data: player1 } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', match.player1_id)
    .single();

  let player2 = null;
  if (match.player2_id) {
    const { data } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', match.player2_id)
      .single();
    player2 = data;
  }

  return (
    <div className="container max-w-2xl py-8">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        &larr; Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-2">
        Round {match.round?.round_number}
      </h1>
      <p className="text-muted-foreground mb-6">{tournament.name}</p>

      <ScoreForm
        match={match}
        currentUserId={authUser.id}
        player1={player1!}
        player2={player2}
        tournamentPointLimit={tournament.point_limit}
        gameSystemId={tournament.game_system_id || 'infinity'}
      />
    </div>
  );
}
