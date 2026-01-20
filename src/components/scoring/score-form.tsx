'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Match, User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getGameSystem, parseMatchState, type MatchState } from '@infinity-tournament/shared/games';
import { GameScoreField, validateScoreField } from './game-score-field';
import { HiddenInfoPanel } from '@/components/match/hidden-info-panel';
import { CsrfInput } from '@/components/ui/csrf-input';

type SubmitStatus = 'idle' | 'submitting' | 'syncing' | 'success' | 'error';

interface ScoreFormProps {
  match: Match;
  currentUserId: string;
  player1: Pick<User, 'id' | 'name'>;
  player2: Pick<User, 'id' | 'name'> | null;
  tournamentPointLimit: number;
  gameSystemId?: string;
}

export function ScoreForm({
  match,
  currentUserId,
  player1,
  player2,
  tournamentPointLimit,
  gameSystemId = 'infinity',
}: ScoreFormProps) {
  const router = useRouter();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Track optimistic state for immediate UI feedback
  const [optimisticConfirmed, setOptimisticConfirmed] = useState(false);

  // Track hidden info state locally
  const [localMatchState, setLocalMatchState] = useState<MatchState>(() =>
    parseMatchState(match.match_state)
  );

  const isLoading = submitStatus === 'submitting' || submitStatus === 'syncing';

  // Get game system configuration
  const gameSystem = useMemo(() => getGameSystem(gameSystemId), [gameSystemId]);
  const scoreFields = gameSystem.scoring.fields;

  const isPlayer1 = currentUserId === player1.id;
  const isPlayer2 = currentUserId === player2?.id;

  // Initialize scores from existing data (generic scores or legacy fields)
  const getInitialScores = (): Record<string, string> => {
    const initial: Record<string, string> = {};
    const existingScores = isPlayer1
      ? match.scores?.player1
      : match.scores?.player2;

    scoreFields.forEach((field) => {
      if (existingScores?.[field.name] !== undefined) {
        initial[field.name] = existingScores[field.name].toString();
      } else {
        // Fallback to legacy fields for Infinity
        const legacyValue = isPlayer1
          ? getLegacyValue(match, field.name, 'player1')
          : getLegacyValue(match, field.name, 'player2');
        initial[field.name] = legacyValue?.toString() || '';
      }
    });
    return initial;
  };

  const [myScores, setMyScores] = useState<Record<string, string>>(getInitialScores);

  // Get opponent's scores
  const getOpponentScores = () => {
    const scores = isPlayer1 ? match.scores?.player2 : match.scores?.player1;
    if (scores && Object.keys(scores).length > 0) {
      return {
        scores,
        confirmed: isPlayer1 ? match.confirmed_by_p2 : match.confirmed_by_p1,
      };
    }
    // Fallback to legacy fields
    const legacyScores: Record<string, number> = {};
    scoreFields.forEach((field) => {
      const val = isPlayer1
        ? getLegacyValue(match, field.name, 'player2')
        : getLegacyValue(match, field.name, 'player1');
      if (val !== null) legacyScores[field.name] = val;
    });
    if (Object.keys(legacyScores).length > 0) {
      return {
        scores: legacyScores,
        confirmed: isPlayer1 ? match.confirmed_by_p2 : match.confirmed_by_p1,
      };
    }
    return null;
  };

  const opponentData = getOpponentScores();
  // Include optimistic state in confirmed check
  const myConfirmed = optimisticConfirmed || (isPlayer1 ? match.confirmed_by_p1 : match.confirmed_by_p2);
  const matchCompleted =
    match.confirmation_status === 'completed' ||
    match.confirmation_status === 'confirmed';

  const updateScore = (fieldName: string, value: string) => {
    setMyScores((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Handle hidden info state changes
  const handleMatchStateChange = useCallback(
    async (newState: MatchState) => {
      // Update local state immediately
      setLocalMatchState(newState);

      // Save to database in background
      const supabase = createClient();
      try {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ match_state: newState })
          .eq('id', match.id);

        if (updateError) {
          console.error('Failed to save hidden info:', updateError);
          toast.error('Failed to save hidden info');
        }
      } catch (err) {
        console.error('Network error saving hidden info:', err);
        // State saved locally, will sync when online
      }
    },
    [match.id]
  );

  const validateAllScores = (): string | null => {
    for (const field of scoreFields) {
      const validationError = validateScoreField(
        field,
        myScores[field.name] || '',
        tournamentPointLimit
      );
      if (validationError) return validationError;
    }
    return null;
  };

  const handleSubmitScores = async () => {
    setError(null);

    // Validate all fields
    const validationError = validateAllScores();
    if (validationError) {
      setError(validationError);
      return;
    }

    // OPTIMISTIC UPDATE: Show success immediately
    setSubmitStatus('syncing');
    setOptimisticConfirmed(true);

    // Show optimistic toast
    const toastId = toast.loading('Saving scores...');

    // Build numeric scores object
    const numericScores: Record<string, number> = {};
    scoreFields.forEach((field) => {
      numericScores[field.name] = parseInt(myScores[field.name]) || 0;
    });

    try {
      // Use server action with rate limiting
      const { submitScores } = await import('@/lib/matches/actions');
      const result = await submitScores({
        matchId: match.id,
        scores: numericScores,
        isPlayer1,
        gameSystemId,
      });

      if (!result.success) {
        // ROLLBACK: Revert optimistic state on error
        setOptimisticConfirmed(false);
        setSubmitStatus('error');

        if (result.rateLimitExceeded) {
          setError('Too many score submissions. Please wait a moment and try again.');
          toast.error('Rate limit exceeded. Please wait and try again.', { id: toastId });
        } else {
          setError(result.error || 'Failed to save scores');
          toast.error(result.error || 'Failed to save scores. Please try again.', { id: toastId });
        }
        return;
      }

      setSubmitStatus('success');
      toast.success('Scores submitted!', { id: toastId });
      router.refresh();
    } catch (err) {
      // ROLLBACK: Revert optimistic state on error
      setOptimisticConfirmed(false);
      setSubmitStatus('error');
      setError('Network error. Your scores will sync when connection is restored.');
      toast.error('Connection error. Scores saved locally.', { id: toastId });
    }
  };

  const handleConfirm = async () => {
    setSubmitStatus('syncing');
    const toastId = toast.loading('Confirming match...');

    try {
      // Use server action with rate limiting
      const { confirmMatch } = await import('@/lib/matches/actions');
      const result = await confirmMatch({
        matchId: match.id,
        gameSystemId,
      });

      if (!result.success) {
        setSubmitStatus('error');

        if (result.rateLimitExceeded) {
          setError('Too many requests. Please wait a moment and try again.');
          toast.error('Rate limit exceeded. Please wait and try again.', { id: toastId });
        } else {
          setError(result.error || 'Failed to confirm match');
          toast.error(result.error || 'Failed to confirm match', { id: toastId });
        }
        return;
      }

      setSubmitStatus('success');
      toast.success('Match confirmed!', { id: toastId });
      router.refresh();
    } catch (err) {
      setSubmitStatus('error');
      setError('Network error. Please try again.');
      toast.error('Connection error', { id: toastId });
    }
  };

  // Check if all required fields have values
  const allRequiredFilled = scoreFields
    .filter((f) => f.required)
    .every((f) => myScores[f.name] && myScores[f.name] !== '');

  if (match.is_bye) {
    const byeScores = gameSystem.scoring.byeScores;
    return (
      <Card>
        <CardHeader>
          <CardTitle>BYE Round</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You have a bye this round. You receive{' '}
            {scoreFields.map((f) => `${byeScores[f.name] || 0} ${f.shortLabel || f.label}`).join(', ')}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Scores</CardTitle>
        <CardDescription>
          Table {match.table_number} vs.{' '}
          {isPlayer1 ? player2?.name : player1.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CsrfInput />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {matchCompleted ? (
          <div className="space-y-4">
            <Badge className="text-lg">Match Complete</Badge>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{player1.name}</p>
                <p className="text-2xl font-bold">
                  {match.scores?.player1?.[scoreFields[0]?.name] ?? match.player1_op} {scoreFields[0]?.shortLabel || 'OP'}
                </p>
                <p className="text-sm">
                  {scoreFields.slice(1).map((f) => (
                    `${match.scores?.player1?.[f.name] ?? getLegacyValue(match, f.name, 'player1') ?? 0} ${f.shortLabel || f.label}`
                  )).join(' / ')}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{player2?.name}</p>
                <p className="text-2xl font-bold">
                  {match.scores?.player2?.[scoreFields[0]?.name] ?? match.player2_op} {scoreFields[0]?.shortLabel || 'OP'}
                </p>
                <p className="text-sm">
                  {scoreFields.slice(1).map((f) => (
                    `${match.scores?.player2?.[f.name] ?? getLegacyValue(match, f.name, 'player2') ?? 0} ${f.shortLabel || f.label}`
                  )).join(' / ')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* My Scores - Dynamic fields */}
            <div>
              <h3 className="font-medium mb-3">Your Scores</h3>
              <div className={`grid gap-4 grid-cols-${Math.min(scoreFields.length, 3)}`}>
                {scoreFields.map((field) => (
                  <GameScoreField
                    key={field.name}
                    field={field}
                    value={myScores[field.name] || ''}
                    onChange={(value) => updateScore(field.name, value)}
                    disabled={myConfirmed}
                    tournamentPointLimit={tournamentPointLimit}
                  />
                ))}
              </div>
            </div>

            {/* Opponent's Scores */}
            {opponentData && (
              <div>
                <h3 className="font-medium mb-3">
                  Opponent&apos;s Scores
                  {opponentData.confirmed && (
                    <Badge variant="outline" className="ml-2">
                      Confirmed
                    </Badge>
                  )}
                </h3>
                <div className={`grid gap-4 grid-cols-${Math.min(scoreFields.length, 3)}`}>
                  {scoreFields.map((field) => (
                    <div key={field.name} className="p-3 bg-muted rounded text-center">
                      <p className="text-sm text-muted-foreground">
                        {field.shortLabel || field.label}
                      </p>
                      <p className="text-xl font-bold">
                        {opponentData.scores[field.name] ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Information Panel (Infinity only) */}
            {gameSystem.hiddenInfo && (
              <HiddenInfoPanel
                playerNumber={isPlayer1 ? 1 : 2}
                playerName={isPlayer1 ? player1.name : (player2?.name || 'Player 2')}
                matchState={localMatchState}
                onStateChange={handleMatchStateChange}
                isMatchComplete={matchCompleted}
              />
            )}
          </>
        )}
      </CardContent>

      {!matchCompleted && (
        <CardFooter className="flex flex-col gap-2">
          {/* Sync status indicator */}
          {submitStatus === 'syncing' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground w-full justify-center mb-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Syncing with server...</span>
            </div>
          )}

          {!myConfirmed ? (
            <Button
              onClick={handleSubmitScores}
              disabled={submitStatus === 'submitting' || !allRequiredFilled}
              className="flex-1 w-full"
            >
              {submitStatus === 'submitting'
                ? 'Submitting...'
                : submitStatus === 'syncing'
                  ? 'Saving...'
                  : 'Submit Scores'}
            </Button>
          ) : opponentData && !matchCompleted ? (
            <Button
              onClick={handleConfirm}
              disabled={submitStatus === 'submitting' || submitStatus === 'syncing'}
              className="flex-1 w-full"
            >
              {submitStatus === 'syncing'
                ? 'Confirming...'
                : 'Confirm Match Result'}
            </Button>
          ) : (
            <p className="text-muted-foreground text-center flex-1">
              Waiting for opponent to submit scores...
            </p>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// Helper to get legacy field values for backwards compatibility
function getLegacyValue(
  match: Match,
  fieldName: string,
  player: 'player1' | 'player2'
): number | null {
  const key = `${player}_${fieldName}` as keyof Match;
  const value = match[key];
  return typeof value === 'number' ? value : null;
}
