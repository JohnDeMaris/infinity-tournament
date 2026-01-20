import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TOHiddenInfoViewer } from '@/components/match/to-hidden-info-viewer';

interface TOMatchPageProps {
  params: Promise<{ id: string; matchId: string }>;
}

export async function generateMetadata({ params }: TOMatchPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: tournament ? `Match Details - ${tournament.name} - ITM` : 'Match Details - ITM',
  };
}

export default async function TOMatchPage({ params }: TOMatchPageProps) {
  const { id: tournamentId, matchId } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Get tournament and verify ownership
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Verify TO ownership
  if (tournament.organizer_id !== authUser.id) {
    redirect('/to');
  }

  // Get match with round info
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

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    partial: 'Partial',
    disputed: 'Disputed',
    confirmed: 'Confirmed',
    completed: 'Completed',
  };
  const matchStatusLabel = statusLabels[match.confirmation_status] || match.confirmation_status;

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    partial: 'outline',
    disputed: 'destructive',
    confirmed: 'default',
    completed: 'default',
  };
  const matchStatusVariant = statusVariants[match.confirmation_status] || 'secondary';

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/to/${tournamentId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to {tournament.name}
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Round {match.round?.round_number} - Table {match.table_number}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {player1?.name || 'Unknown'} vs {player2?.name || 'BYE'}
            </span>
            <Badge variant={matchStatusVariant}>{matchStatusLabel}</Badge>
          </div>
        </div>
      </div>

      {/* Scores Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{player1?.name}</p>
              <p className="text-2xl font-bold">
                {match.scores?.player1?.op ?? match.player1_op ?? '-'} OP
              </p>
              <p className="text-sm text-muted-foreground">
                {match.scores?.player1?.vp ?? match.player1_vp ?? '-'} VP / {match.scores?.player1?.ap ?? match.player1_ap ?? '-'} AP
              </p>
              <div className="mt-2">
                {match.confirmed_by_p1 ? (
                  <Badge variant="outline" className="text-green-600">Confirmed</Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600">Not Confirmed</Badge>
                )}
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{player2?.name || 'BYE'}</p>
              {match.is_bye ? (
                <p className="text-lg text-muted-foreground">BYE</p>
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {match.scores?.player2?.op ?? match.player2_op ?? '-'} OP
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {match.scores?.player2?.vp ?? match.player2_vp ?? '-'} VP / {match.scores?.player2?.ap ?? match.player2_ap ?? '-'} AP
                  </p>
                  <div className="mt-2">
                    {match.confirmed_by_p2 ? (
                      <Badge variant="outline" className="text-green-600">Confirmed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600">Not Confirmed</Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {match.winner_id && (
            <div className="mt-4 text-center">
              <Badge className="text-lg">
                Winner: {match.winner_id === player1?.id ? player1?.name : player2?.name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden Information Viewer */}
      {!match.is_bye && (
        <TOHiddenInfoViewer
          matchId={match.id}
          matchState={match.match_state}
          player1={{ id: match.player1_id, name: player1?.name || 'Unknown' }}
          player2={{ id: match.player2_id!, name: player2?.name || 'Unknown' }}
          toUserId={authUser.id}
        />
      )}
    </div>
  );
}
