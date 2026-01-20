import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TournamentResult } from '@/lib/stats/player-stats';

interface TournamentHistoryListProps {
  history: TournamentResult[];
}

export function TournamentHistoryList({ history }: TournamentHistoryListProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tournament history available
      </div>
    );
  }

  // Sort by date descending (most recent first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-3">
      {sortedHistory.map((tournament) => {
        const placementText = tournament.placement
          ? `${tournament.placement}${getOrdinalSuffix(tournament.placement)} of ${tournament.totalPlayers}`
          : `${tournament.totalPlayers} players`;

        const matchRecord = `${tournament.matchesWon}-${tournament.matchesLost}-${tournament.matchesDrawn}`;
        const totalMatches = tournament.matchesWon + tournament.matchesLost + tournament.matchesDrawn;

        return (
          <Link
            key={tournament.tournamentId}
            href={`/events/${tournament.tournamentId}`}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Tournament info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1 line-clamp-1">
                      {tournament.tournamentName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>
                        {new Date(tournament.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs">•</span>
                      <span className="line-clamp-1">{tournament.location}</span>
                    </div>

                    {/* Placement */}
                    <div className="mb-2">
                      <span className="text-sm font-medium">
                        {placementText}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {/* Faction */}
                      {tournament.faction && (
                        <Badge variant="secondary" className="font-normal">
                          {tournament.faction}
                        </Badge>
                      )}

                      {/* Match Record */}
                      {totalMatches > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Record:</span>
                          <span className="font-medium">
                            <span className="text-green-600 dark:text-green-400">
                              {tournament.matchesWon}
                            </span>
                            -
                            <span className="text-red-600 dark:text-red-400">
                              {tournament.matchesLost}
                            </span>
                            -
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {tournament.matchesDrawn}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Points */}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-xs">
                          OP: <span className="font-medium text-foreground">{tournament.totalOP}</span>
                        </span>
                        <span className="text-xs">
                          VP: <span className="font-medium text-foreground">{tournament.totalVP}</span>
                        </span>
                        <span className="text-xs">
                          AP: <span className="font-medium text-foreground">{tournament.totalAP}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Placement badge for top finishes */}
                  {tournament.placement && tournament.placement <= 3 && (
                    <div className="shrink-0">
                      <Badge
                        className={`${getPlacementColor(tournament.placement)} text-white text-lg px-3 py-1`}
                      >
                        {tournament.placement === 1 && '🥇'}
                        {tournament.placement === 2 && '🥈'}
                        {tournament.placement === 3 && '🥉'}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Get ordinal suffix for placement numbers (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}

/**
 * Get color for top 3 placement badges
 */
function getPlacementColor(placement: number): string {
  switch (placement) {
    case 1:
      return 'bg-yellow-500';
    case 2:
      return 'bg-gray-400';
    case 3:
      return 'bg-orange-600';
    default:
      return 'bg-gray-500';
  }
}
