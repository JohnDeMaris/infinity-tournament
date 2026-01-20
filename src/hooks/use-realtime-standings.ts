'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateStandings } from '@/lib/scoring/standings';
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
}

interface UseRealtimeStandingsOptions {
  tournamentId: string;
  roundIds: string[];
  players: PlayerData[];
  initialMatches: MatchData[];
  gameSystemId?: string;
}

/**
 * Hook for real-time standings updates via Supabase Realtime
 *
 * Subscribes to match changes for the tournament's rounds and
 * recalculates standings when matches are updated.
 */
export function useRealtimeStandings({
  tournamentId,
  roundIds,
  players,
  initialMatches,
  gameSystemId = 'infinity',
}: UseRealtimeStandingsOptions) {
  const [matches, setMatches] = useState<MatchData[]>(initialMatches);
  const [standings, setStandings] = useState<Standing[]>(() =>
    calculateStandings(players, initialMatches, gameSystemId)
  );
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Recalculate standings when matches change
  const recalculateStandings = useCallback(
    (updatedMatches: MatchData[]) => {
      const newStandings = calculateStandings(players, updatedMatches, gameSystemId);
      setStandings(newStandings);
      setLastUpdate(new Date());
    },
    [players, gameSystemId]
  );

  // Handle match updates from realtime
  const handleMatchChange = useCallback(
    (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: MatchData | null;
      old: { id: string } | null;
    }) => {
      setMatches((currentMatches) => {
        let updatedMatches: MatchData[];

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && roundIds.includes(payload.new.round_id)) {
              updatedMatches = [...currentMatches, payload.new];
            } else {
              return currentMatches;
            }
            break;

          case 'UPDATE':
            if (payload.new) {
              updatedMatches = currentMatches.map((m) =>
                m.id === payload.new!.id ? payload.new! : m
              );
            } else {
              return currentMatches;
            }
            break;

          case 'DELETE':
            if (payload.old) {
              updatedMatches = currentMatches.filter((m) => m.id !== payload.old!.id);
            } else {
              return currentMatches;
            }
            break;

          default:
            return currentMatches;
        }

        // Recalculate standings with new match data
        recalculateStandings(updatedMatches);
        return updatedMatches;
      });
    },
    [roundIds, recalculateStandings]
  );

  // Subscribe to realtime updates
  useEffect(() => {
    if (roundIds.length === 0) return;

    const supabase = createClient();

    // Create a unique channel name for this tournament
    const channelName = `standings:${tournamentId}`;

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
          console.log('[Realtime] Match change:', payload.eventType);
          handleMatchChange(payload as unknown as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            new: MatchData | null;
            old: { id: string } | null;
          });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[Realtime] Unsubscribing from', channelName);
      supabase.removeChannel(channel);
    };
  }, [tournamentId, roundIds, handleMatchChange]);

  // Recalculate if initial data changes (server-side refresh)
  useEffect(() => {
    setMatches(initialMatches);
    recalculateStandings(initialMatches);
  }, [initialMatches, recalculateStandings]);

  return {
    standings,
    isConnected,
    lastUpdate,
    matchCount: matches.length,
  };
}
