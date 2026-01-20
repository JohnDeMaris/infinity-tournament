'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateSwissPairings, generateRound1Pairings, buildPlayerStats } from '@/lib/pairing/swiss';
import type { Tournament, Round, Match } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface RoundWithMatches extends Round {
  matches: Match[];
}

interface RoundControlsProps {
  tournament: Tournament;
  rounds: RoundWithMatches[];
  playerCount: number;
}

export function RoundControls({
  tournament,
  rounds,
  playerCount,
}: RoundControlsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const currentRound = rounds.find((r) => r.status !== 'completed');
  const completedRounds = rounds.filter((r) => r.status === 'completed');
  const nextRoundNumber = (currentRound?.round_number ?? 0) + (currentRound ? 0 : 1);
  const canStartNextRound = !currentRound && nextRoundNumber <= tournament.rounds;
  const allRoundsComplete = completedRounds.length >= tournament.rounds;

  const startNextRound = async () => {
    if (playerCount < 2) {
      toast.error('Need at least 2 players to start a round');
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    try {
      // Get registered players
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select('user_id')
        .eq('tournament_id', tournament.id)
        .eq('status', 'registered');

      if (regError) throw regError;

      const playerIds = registrations?.map((r) => r.user_id) || [];

      // Get all previous matches for this tournament
      const { data: allMatches, error: matchError } = await supabase
        .from('matches')
        .select('*, round:rounds!inner(tournament_id)')
        .eq('round.tournament_id', tournament.id);

      if (matchError) throw matchError;

      // Generate pairings
      let pairings;

      if (nextRoundNumber === 1) {
        // Round 1: random pairings
        pairings = generateRound1Pairings(playerIds);
      } else {
        // Subsequent rounds: Swiss pairings based on standings
        const playerStats = buildPlayerStats(playerIds, allMatches || []);
        pairings = generateSwissPairings(playerStats);
      }

      // Create round
      const { data: newRound, error: roundError } = await supabase
        .from('rounds')
        .insert({
          tournament_id: tournament.id,
          round_number: nextRoundNumber,
          status: 'active',
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Create matches
      const matchInserts = pairings.map((pairing) => ({
        round_id: newRound.id,
        player1_id: pairing.player1_id,
        player2_id: pairing.player2_id,
        table_number: pairing.table_number || 1,
        is_bye: pairing.is_bye,
        // Auto-complete bye matches
        ...(pairing.is_bye
          ? {
              player1_op: tournament.settings?.bye_op ?? 10,
              player1_vp: tournament.settings?.bye_vp ?? 0,
              player1_ap: tournament.settings?.bye_ap ?? 0,
              confirmed_by_p1: true,
              confirmed_by_p2: true,
              confirmation_status: 'completed',
            }
          : {}),
      }));

      const { error: matchInsertError } = await supabase
        .from('matches')
        .insert(matchInserts);

      if (matchInsertError) throw matchInsertError;

      toast.success(`Round ${nextRoundNumber} started!`);
      router.refresh();
    } catch (error) {
      console.error('Error starting round:', error);
      toast.error('Failed to start round');
    } finally {
      setIsLoading(false);
    }
  };

  const completeRound = async (roundId: string) => {
    setIsLoading(true);

    const supabase = createClient();

    // Check if all matches are confirmed
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('round_id', roundId);

    if (matchError) {
      toast.error('Failed to check matches');
      setIsLoading(false);
      return;
    }

    const incompleteMatches = matches?.filter(
      (m) => m.confirmation_status !== 'completed' && m.confirmation_status !== 'confirmed'
    );

    if (incompleteMatches && incompleteMatches.length > 0) {
      toast.error(
        `${incompleteMatches.length} match(es) still need scores or confirmation`
      );
      setIsLoading(false);
      return;
    }

    // Update round status
    const { error: updateError } = await supabase
      .from('rounds')
      .update({ status: 'completed' })
      .eq('id', roundId);

    setIsLoading(false);

    if (updateError) {
      toast.error('Failed to complete round');
      return;
    }

    toast.success('Round completed!');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Round Status & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Round Management</CardTitle>
          <CardDescription>
            {allRoundsComplete
              ? 'All rounds completed'
              : currentRound
                ? `Round ${currentRound.round_number} in progress`
                : `Ready for Round ${nextRoundNumber}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {canStartNextRound && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isLoading}>
                    {isLoading ? 'Starting...' : `Start Round ${nextRoundNumber}`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start Round {nextRoundNumber}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will generate pairings for {playerCount} players.
                      {nextRoundNumber === 1
                        ? ' Pairings will be random for the first round.'
                        : ' Pairings will be based on current standings.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={startNextRound}>
                      Start Round
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {currentRound && currentRound.status === 'active' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Complete Round'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete Round {currentRound.round_number}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Make sure all matches have scores entered and confirmed
                      before completing the round.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => completeRound(currentRound.id)}
                    >
                      Complete Round
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Round Pairings */}
      {currentRound && (
        <Card>
          <CardHeader>
            <CardTitle>Round {currentRound.round_number} Pairings</CardTitle>
          </CardHeader>
          <CardContent>
            <RoundPairingsTable
              roundId={currentRound.id}
              matches={currentRound.matches}
            />
          </CardContent>
        </Card>
      )}

      {/* Previous Rounds */}
      {completedRounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Rounds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedRounds.map((round) => (
              <div key={round.id}>
                <h4 className="font-medium mb-2">Round {round.round_number}</h4>
                <RoundPairingsTable
                  roundId={round.id}
                  matches={round.matches}
                  collapsed
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface RoundPairingsTableProps {
  roundId: string;
  matches: Match[];
  collapsed?: boolean;
}

function RoundPairingsTable({ matches, collapsed }: RoundPairingsTableProps) {
  const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map());

  // Fetch player names on mount
  useState(() => {
    const fetchNames = async () => {
      const supabase = createClient();
      const playerIds = new Set<string>();

      matches.forEach((m) => {
        playerIds.add(m.player1_id);
        if (m.player2_id) playerIds.add(m.player2_id);
      });

      const { data } = await supabase
        .from('users')
        .select('id, name')
        .in('id', Array.from(playerIds));

      if (data) {
        const names = new Map<string, string>();
        data.forEach((u) => names.set(u.id, u.name));
        setPlayerNames(names);
      }
    };

    fetchNames();
  });

  if (matches.length === 0) {
    return <p className="text-muted-foreground">No matches</p>;
  }

  const sortedMatches = [...matches].sort(
    (a, b) => a.table_number - b.table_number
  );

  if (collapsed) {
    return (
      <div className="text-sm text-muted-foreground">
        {matches.length} match{matches.length !== 1 ? 'es' : ''}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Table</TableHead>
          <TableHead>Player 1</TableHead>
          <TableHead className="text-center">vs</TableHead>
          <TableHead>Player 2</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedMatches.map((match) => (
          <TableRow key={match.id}>
            <TableCell className="font-medium">{match.table_number}</TableCell>
            <TableCell>
              {playerNames.get(match.player1_id) || 'Loading...'}
            </TableCell>
            <TableCell className="text-center text-muted-foreground">
              vs
            </TableCell>
            <TableCell>
              {match.is_bye ? (
                <span className="text-muted-foreground italic">BYE</span>
              ) : (
                playerNames.get(match.player2_id!) || 'Loading...'
              )}
            </TableCell>
            <TableCell>
              {match.player1_op !== null ? (
                <span>
                  {match.player1_op}-{match.player2_op ?? 0}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  match.confirmation_status === 'completed' ||
                  match.confirmation_status === 'confirmed'
                    ? 'default'
                    : match.confirmation_status === 'disputed'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {match.confirmation_status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
