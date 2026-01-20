import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerOverallStats } from '@/lib/stats/player-stats';

interface PlayerStatsCardProps {
  stats: PlayerOverallStats;
}

export function PlayerStatsCard({ stats }: PlayerStatsCardProps) {
  // Determine win rate color
  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return 'bg-green-500';
    if (winRate < 40) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const winRateColor = getWinRateColor(stats.winRate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tournaments Played</p>
            <p className="text-2xl font-bold">{stats.tournamentsPlayed}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Matches</p>
            <p className="text-2xl font-bold">{stats.matchesPlayed}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Overall Record</p>
          <p className="text-lg font-semibold">
            {stats.wins}W - {stats.losses}L - {stats.draws}D
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Win Rate</p>
          <div className="flex items-center gap-2">
            <Badge className={`${winRateColor} text-white`}>
              {stats.winRate.toFixed(1)}%
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Average OP Scored</p>
          <p className="text-2xl font-bold">{stats.avgOP.toFixed(1)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
