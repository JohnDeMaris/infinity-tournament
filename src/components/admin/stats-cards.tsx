import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface PlatformStats {
  totalUsers: number;
  newUsersThisWeek: number;
  tournaments: {
    total: number;
    draft: number;
    registration: number;
    active: number;
    completed: number;
  };
  newTournamentsThisWeek: number;
  totalMatches: number;
}

interface StatsCardsProps {
  stats: PlatformStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Users Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-4xl">{stats.totalUsers.toLocaleString()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Registered platform users
          </p>
        </CardContent>
      </Card>

      {/* Tournaments Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Tournaments</CardDescription>
          <CardTitle className="text-4xl">{stats.tournaments.total.toLocaleString()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Draft</span>
              <span className="font-medium">{stats.tournaments.draft}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registration</span>
              <span className="font-medium">{stats.tournaments.registration}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active</span>
              <span className="font-medium text-green-600">{stats.tournaments.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium">{stats.tournaments.completed}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Played Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Matches Played</CardDescription>
          <CardTitle className="text-4xl">{stats.totalMatches.toLocaleString()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Total completed matches
          </p>
        </CardContent>
      </Card>

      {/* New This Week Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>New This Week</CardDescription>
          <CardTitle className="text-4xl">{stats.newUsersThisWeek + stats.newTournamentsThisWeek}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">New Users</span>
              <span className="font-medium text-blue-600">+{stats.newUsersThisWeek}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">New Tournaments</span>
              <span className="font-medium text-blue-600">+{stats.newTournamentsThisWeek}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
