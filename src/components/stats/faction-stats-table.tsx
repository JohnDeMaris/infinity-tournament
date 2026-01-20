import { FactionStats } from '@/lib/stats/player-stats';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface FactionStatsTableProps {
  stats: FactionStats[];
}

export function FactionStatsTable({ stats }: FactionStatsTableProps) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No faction data available
      </div>
    );
  }

  // Sort by matches played (descending) - already sorted by the API but ensure it
  const sortedStats = [...stats].sort((a, b) => b.matchesPlayed - a.matchesPlayed);

  // Find most played faction (highest matches)
  const mostPlayedFaction = sortedStats[0]?.faction;

  // Find best performing faction (highest win rate with at least 3 matches)
  const eligibleFactions = sortedStats.filter(s => s.matchesPlayed >= 3);
  const bestPerformingFaction = eligibleFactions.length > 0
    ? eligibleFactions.reduce((best, current) =>
        current.winRate > best.winRate ? current : best
      ).faction
    : null;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Faction</TableHead>
            <TableHead className="text-right">Matches</TableHead>
            <TableHead className="text-right">W/L/D</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStats.map((stat) => {
            const isMostPlayed = stat.faction === mostPlayedFaction;
            const isBestPerforming = stat.faction === bestPerformingFaction;

            return (
              <TableRow key={stat.faction}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {stat.faction}
                    {isMostPlayed && (
                      <Badge variant="secondary" className="text-xs">
                        Most Played
                      </Badge>
                    )}
                    {isBestPerforming && (
                      <Badge variant="default" className="text-xs">
                        Best
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{stat.matchesPlayed}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">{stat.wins}</span>
                  {' / '}
                  <span className="text-red-600 dark:text-red-400">{stat.losses}</span>
                  {' / '}
                  <span className="text-yellow-600 dark:text-yellow-400">{stat.draws}</span>
                </TableCell>
                <TableCell className="text-right">
                  {stat.winRate.toFixed(1)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
