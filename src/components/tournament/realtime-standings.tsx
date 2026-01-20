'use client';

import { useRealtimeStandings } from '@/hooks/use-realtime-standings';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

interface RealtimeStandingsProps {
  tournamentId: string;
  roundIds: string[];
  players: PlayerData[];
  initialMatches: MatchData[];
  initialStandings: Standing[];
  currentUserId?: string;
  gameSystemId?: string;
}

/**
 * Client component that displays standings with real-time updates
 */
export function RealtimeStandings({
  tournamentId,
  roundIds,
  players,
  initialMatches,
  currentUserId,
  gameSystemId = 'infinity',
}: RealtimeStandingsProps) {
  const { standings, isConnected, lastUpdate } = useRealtimeStandings({
    tournamentId,
    roundIds,
    players,
    initialMatches,
    gameSystemId,
  });

  return (
    <div>
      {/* Connection status */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <span
          className={`h-2 w-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        <span>{isConnected ? 'Live' : 'Connecting...'}</span>
        {lastUpdate && (
          <span className="ml-2">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {standings.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No completed matches yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Faction</TableHead>
                <TableHead className="text-right">OP</TableHead>
                <TableHead className="text-right">VP</TableHead>
                <TableHead className="text-right">AP</TableHead>
                <TableHead className="text-center">W-L-D</TableHead>
                <TableHead className="text-right">SoS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((standing) => (
                <TableRow
                  key={standing.user_id}
                  className={
                    standing.user_id === currentUserId
                      ? 'bg-primary/5'
                      : undefined
                  }
                >
                  <TableCell className="font-bold">{standing.rank}</TableCell>
                  <TableCell className="font-medium">
                    {standing.player_name}
                    {standing.user_id === currentUserId && (
                      <Badge variant="secondary" className="ml-2">
                        You
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {standing.faction || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {standing.total_op}
                  </TableCell>
                  <TableCell className="text-right">{standing.total_vp}</TableCell>
                  <TableCell className="text-right">{standing.total_ap}</TableCell>
                  <TableCell className="text-center">
                    {standing.wins}-{standing.losses}-{standing.draws}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {standing.sos}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
