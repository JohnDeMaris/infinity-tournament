'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlayerData {
  id: string;
  name: string;
}

interface TickerMatchData {
  id: string;
  round_id: string;
  player1_id: string;
  player2_id: string | null;
  player1_op: number | null;
  player1_vp: number | null;
  player2_op: number | null;
  player2_vp: number | null;
  winner_id: string | null;
  is_bye: boolean;
  confirmation_status: string;
  updated_at?: string;
  player1?: PlayerData;
  player2?: PlayerData | null;
  round?: {
    round_number: number;
  };
}

interface MatchTickerProps {
  tournamentId: string;
  roundIds: string[];
  initialMatches: TickerMatchData[];
  maxItems?: number;
}

/**
 * Match Ticker Component
 *
 * Displays a real-time feed of recently completed matches.
 * Subscribes to match updates and animates new results in.
 */
export function MatchTicker({
  tournamentId,
  roundIds,
  initialMatches,
  maxItems = 10,
}: MatchTickerProps) {
  const [matches, setMatches] = useState<TickerMatchData[]>(() =>
    getCompletedMatches(initialMatches, maxItems)
  );
  const [isConnected, setIsConnected] = useState(false);
  const [newMatchIds, setNewMatchIds] = useState<Set<string>>(new Set());
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter and sort completed matches
  function getCompletedMatches(allMatches: TickerMatchData[], limit: number): TickerMatchData[] {
    return allMatches
      .filter((m) => m.confirmation_status === 'confirmed' || m.confirmation_status === 'completed')
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
      .slice(0, limit);
  }

  // Handle match updates from realtime
  const handleMatchChange = useCallback(
    (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: TickerMatchData | null;
      old: { id: string } | null;
    }) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        const updatedMatch = payload.new;

        // Only care about completed matches
        if (updatedMatch.confirmation_status !== 'confirmed' &&
            updatedMatch.confirmation_status !== 'completed') {
          return;
        }

        // Check if this match belongs to our rounds
        if (!roundIds.includes(updatedMatch.round_id)) {
          return;
        }

        setMatches((currentMatches) => {
          // Check if this match is already in our list
          const existingIndex = currentMatches.findIndex((m) => m.id === updatedMatch.id);

          let updatedMatches: TickerMatchData[];

          if (existingIndex >= 0) {
            // Update existing match
            updatedMatches = [...currentMatches];
            updatedMatches[existingIndex] = updatedMatch;
          } else {
            // New completed match - add to front
            updatedMatches = [updatedMatch, ...currentMatches];

            // Trigger animation for new match
            setNewMatchIds((prev) => new Set(prev).add(updatedMatch.id));

            // Clear animation after delay
            if (animationTimeoutRef.current) {
              clearTimeout(animationTimeoutRef.current);
            }
            animationTimeoutRef.current = setTimeout(() => {
              setNewMatchIds((prev) => {
                const next = new Set(prev);
                next.delete(updatedMatch.id);
                return next;
              });
            }, 2000);
          }

          // Sort by updated_at and limit
          return updatedMatches
            .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
            .slice(0, maxItems);
        });
      }
    },
    [roundIds, maxItems]
  );

  // Subscribe to realtime updates
  useEffect(() => {
    if (roundIds.length === 0) return;

    const supabase = createClient();

    // Create a unique channel name for this ticker
    const channelName = `match-ticker:${tournamentId}`;

    // Subscribe to match changes for rounds in this tournament
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `round_id=in.(${roundIds.join(',')})`,
        },
        (payload) => {
          console.log('[MatchTicker] Match change:', payload.eventType);
          handleMatchChange(payload as unknown as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            new: TickerMatchData | null;
            old: { id: string } | null;
          });
        }
      )
      .subscribe((status) => {
        console.log('[MatchTicker] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[MatchTicker] Unsubscribing from', channelName);
      supabase.removeChannel(channel);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [tournamentId, roundIds, handleMatchChange]);

  // Update matches if initial data changes (server-side refresh)
  useEffect(() => {
    setMatches(getCompletedMatches(initialMatches, maxItems));
  }, [initialMatches, maxItems]);

  // Determine match result display
  const getMatchResult = (match: TickerMatchData): {
    player1Name: string;
    player2Name: string;
    player1Score: string;
    player2Score: string;
    winnerId: string | null;
  } => {
    const player1Name = match.player1?.name || 'Player 1';
    const player2Name = match.is_bye ? 'BYE' : (match.player2?.name || 'Player 2');

    const player1Score = match.player1_op !== null ? `${match.player1_op} OP` : '-';
    const player2Score = match.is_bye ? '-' : (match.player2_op !== null ? `${match.player2_op} OP` : '-');

    return {
      player1Name,
      player2Name,
      player1Score,
      player2Score,
      winnerId: match.winner_id,
    };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Results</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
            <span>{isConnected ? 'Live' : 'Connecting...'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            No completed matches yet
          </p>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const result = getMatchResult(match);
              const isNew = newMatchIds.has(match.id);

              return (
                <div
                  key={match.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border bg-card',
                    'transition-all duration-500 ease-out',
                    isNew && 'animate-ticker-slide-in bg-primary/5 border-primary/20'
                  )}
                >
                  {/* Round indicator */}
                  {match.round && (
                    <Badge variant="outline" className="mr-2 shrink-0">
                      R{match.round.round_number}
                    </Badge>
                  )}

                  {/* Match result */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {/* Player 1 */}
                    <div className={cn(
                      'flex-1 text-right truncate',
                      result.winnerId === match.player1_id && 'font-semibold'
                    )}>
                      <span className="text-sm">{result.player1Name}</span>
                      {result.winnerId === match.player1_id && (
                        <Badge variant="default" className="ml-1 text-[10px] px-1">
                          W
                        </Badge>
                      )}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <span className={cn(
                        result.winnerId === match.player1_id && 'text-foreground font-medium'
                      )}>
                        {result.player1Score}
                      </span>
                      <span>-</span>
                      <span className={cn(
                        result.winnerId === match.player2_id && 'text-foreground font-medium'
                      )}>
                        {result.player2Score}
                      </span>
                    </div>

                    {/* Player 2 */}
                    <div className={cn(
                      'flex-1 truncate',
                      result.winnerId === match.player2_id && 'font-semibold'
                    )}>
                      {result.winnerId === match.player2_id && (
                        <Badge variant="default" className="mr-1 text-[10px] px-1">
                          W
                        </Badge>
                      )}
                      <span className="text-sm">{result.player2Name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

    </Card>
  );
}
