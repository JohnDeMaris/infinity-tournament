import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Tournament, TournamentWithOrganizer } from '@/types';

interface TournamentCardProps {
  tournament: TournamentWithOrganizer | Tournament & { organizer?: { id: string; name: string } };
  registeredCount?: number;
  showOrganizer?: boolean;
}

export function TournamentCard({
  tournament,
  registeredCount = 0,
  showOrganizer = true,
}: TournamentCardProps) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    registration: 'bg-green-500',
    active: 'bg-blue-500',
    completed: 'bg-gray-400',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    registration: 'Registration Open',
    active: 'In Progress',
    completed: 'Completed',
  };

  const capacityDisplay =
    tournament.max_capacity !== null
      ? `${registeredCount}/${tournament.max_capacity}`
      : `${registeredCount} registered`;

  const isFull =
    tournament.max_capacity !== null &&
    registeredCount >= tournament.max_capacity;

  return (
    <Link href={`/events/${tournament.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">
              {tournament.name}
            </CardTitle>
            <Badge
              variant="secondary"
              className={`${statusColors[tournament.status]} text-white shrink-0`}
            >
              {statusLabels[tournament.status]}
            </Badge>
          </div>
          <CardDescription>
            {new Date(tournament.date_start).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-muted-foreground shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-muted-foreground line-clamp-1">
                {tournament.location}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="font-medium">{tournament.point_limit}</span>
                <span className="text-muted-foreground">pts</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{tournament.rounds}</span>
                <span className="text-muted-foreground">rounds</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span
                className={`text-sm ${isFull ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
              >
                {isFull ? 'FULL' : capacityDisplay}
              </span>
              {showOrganizer && 'organizer' in tournament && tournament.organizer && (
                <span className="text-xs text-muted-foreground">
                  by {tournament.organizer.name}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
