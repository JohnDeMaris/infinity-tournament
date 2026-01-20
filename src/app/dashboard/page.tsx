import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
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
  title: 'Dashboard - Infinity Tournament Manager',
  description: 'Your tournament dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Get user's registrations with tournament details
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      *,
      tournament:tournaments(
        id,
        name,
        date_start,
        location,
        point_limit,
        status
      )
    `)
    .eq('user_id', authUser!.id)
    .neq('status', 'dropped')
    .order('created_at', { ascending: false });

  const upcomingEvents = registrations?.filter(
    (r) =>
      r.tournament?.status === 'registration' ||
      r.tournament?.status === 'active'
  ) || [];

  const pastEvents = registrations?.filter(
    (r) => r.tournament?.status === 'completed'
  ) || [];

  // Check for active match
  const activeTournaments = upcomingEvents.filter(
    (r) => r.tournament?.status === 'active'
  );

  let activeMatch = null;
  let activeMatchTournament = null;

  if (activeTournaments.length > 0) {
    for (const reg of activeTournaments) {
      // Get current active round
      const { data: activeRound } = await supabase
        .from('rounds')
        .select('id')
        .eq('tournament_id', reg.tournament!.id)
        .eq('status', 'active')
        .single();

      if (activeRound) {
        // Check if user has a match in this round
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .eq('round_id', activeRound.id)
          .or(`player1_id.eq.${authUser!.id},player2_id.eq.${authUser!.id}`)
          .single();

        if (match) {
          activeMatch = match;
          activeMatchTournament = reg.tournament;
          break;
        }
      }
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your tournaments.
          </p>
        </div>
        <Link href="/events">
          <Button>Find Events</Button>
        </Link>
      </div>

      {/* Active Match Alert */}
      {activeMatch && activeMatchTournament && (
        <section className="mb-8">
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                Active Match
              </CardTitle>
              <CardDescription>{activeMatchTournament.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Table {activeMatch.table_number}
                {activeMatch.is_bye && ' - BYE'}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/events/${activeMatchTournament.id}/match/${activeMatch.id}`}
                  className="flex-1"
                >
                  <Button className="w-full">
                    {activeMatch.player1_op !== null ||
                    activeMatch.player2_op !== null
                      ? 'View/Confirm Scores'
                      : 'Enter Scores'}
                  </Button>
                </Link>
                <Link href={`/events/${activeMatchTournament.id}/standings`}>
                  <Button variant="outline">Standings</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">My Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                You&apos;re not registered for any upcoming events.
              </p>
              <Link href="/events">
                <Button variant="outline">Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((reg) => (
              <Card key={reg.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {reg.tournament?.name}
                    </CardTitle>
                    <Badge
                      variant={
                        reg.tournament?.status === 'active'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {reg.tournament?.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(reg.tournament?.date_start || '').toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Location:</span>{' '}
                      {reg.tournament?.location}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Points:</span>{' '}
                      {reg.tournament?.point_limit}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">List:</span>
                      {reg.army_list_code ? (
                        <Badge variant="outline" className="text-green-600">
                          Submitted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">
                          Not submitted
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/events/${reg.tournament?.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        View Event
                      </Button>
                    </Link>
                    {!reg.army_list_code && (
                      <Link
                        href={`/dashboard/events/${reg.tournament?.id}/list`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full">
                          Submit List
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Past Events</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastEvents.map((reg) => (
              <Card key={reg.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {reg.tournament?.name}
                  </CardTitle>
                  <CardDescription>
                    {new Date(reg.tournament?.date_start || '').toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {reg.tournament?.location}
                  </p>
                  <Link href={`/events/${reg.tournament?.id}`}>
                    <Button variant="ghost" size="sm" className="mt-2 p-0">
                      View Results
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
