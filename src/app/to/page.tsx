import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Tournament Organizer - ITM',
  description: 'Manage your tournaments',
};

export default async function TODashboardPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Get all tournaments organized by this user
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .eq('organizer_id', authUser!.id)
    .order('date_start', { ascending: false });

  const activeTournaments =
    tournaments?.filter((t) => t.status === 'active') || [];
  const upcomingTournaments =
    tournaments?.filter(
      (t) => t.status === 'draft' || t.status === 'registration'
    ) || [];
  const pastTournaments =
    tournaments?.filter((t) => t.status === 'completed') || [];

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    registration: 'bg-green-500',
    active: 'bg-blue-500',
    completed: 'bg-gray-400',
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tournament Organizer</h1>
          <p className="text-muted-foreground">
            Create and manage your tournaments
          </p>
        </div>
        <Link href="/to/create">
          <Button>Create Tournament</Button>
        </Link>
      </div>

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Now</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTournaments.map((tournament) => (
              <Link key={tournament.id} href={`/to/${tournament.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-500/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      <Badge className={`${statusColors[tournament.status]} text-white`}>
                        Active
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(tournament.date_start).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tournament.location}
                    </p>
                    <p className="text-sm mt-2">
                      {tournament.point_limit} pts / {tournament.rounds} rounds
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Tournaments */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
        {upcomingTournaments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No upcoming tournaments. Create one to get started!
              </p>
              <Link href="/to/create">
                <Button>Create Tournament</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTournaments.map((tournament) => (
              <Link key={tournament.id} href={`/to/${tournament.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      <Badge className={`${statusColors[tournament.status]} text-white`}>
                        {tournament.status === 'draft' ? 'Draft' : 'Registration'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(tournament.date_start).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tournament.location}
                    </p>
                    <p className="text-sm mt-2">
                      {tournament.point_limit} pts / {tournament.rounds} rounds
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Past Tournaments */}
      {pastTournaments.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Past</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastTournaments.map((tournament) => (
              <Link key={tournament.id} href={`/to/${tournament.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      <Badge className={`${statusColors[tournament.status]} text-white`}>
                        Completed
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(tournament.date_start).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tournament.location}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
