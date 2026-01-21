import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { TournamentCard } from '@/components/tournament/tournament-card';

export const metadata = {
  title: 'Infinity Tournament Manager',
  description: 'Manage and participate in Infinity the Game tournaments',
};

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let user = null;
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    user = data;
  }

  // Get upcoming tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, organizer:users(id, name)')
    .in('status', ['registration', 'active'])
    .gte('date_start', new Date().toISOString().split('T')[0])
    .order('date_start', { ascending: true })
    .limit(6);

  // Get registration counts for each tournament
  const tournamentsWithCounts = await Promise.all(
    (tournaments || []).map(async (tournament) => {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournament.id)
        .eq('status', 'registered');
      return { ...tournament, registered_count: count || 0 };
    })
  );

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header user={user} />

      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Infinity Tournament Manager
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The complete platform for organizing and participating in Infinity
            the Game tournaments. Swiss pairings, ITS scoring, and real-time
            standings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-6 w-full sm:w-auto"
            >
              Browse Events
            </Link>
            {!user && (
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium border bg-background hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-6 w-full sm:w-auto"
              >
                Create Account
              </Link>
            )}
            {user && (user.role === 'to' || user.role === 'admin') && (
              <Link
                href="/to/create"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium border bg-background hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-6 w-full sm:w-auto"
              >
                Create Tournament
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Everything you need to run a tournament
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Swiss Pairings</h3>
              <p className="text-sm text-muted-foreground">
                Automatic Swiss-system pairings that avoid repeat matchups and
                handle byes intelligently.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">ITS Scoring</h3>
              <p className="text-sm text-muted-foreground">
                Full support for Objective Points, Victory Points, and Army
                Points with proper tiebreakers.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Real-time Updates</h3>
              <p className="text-sm text-muted-foreground">
                Live standings that update as scores are entered. No more
                waiting for the TO to post results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {tournamentsWithCounts.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              <Button asChild variant="ghost">
                <Link href="/events">View all</Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournamentsWithCounts.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  registeredCount={tournament.registered_count}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 border-t mt-auto">
        <div className="container max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>Infinity Tournament Manager - Built for the Infinity community</p>
        </div>
      </footer>
    </div>
  );
}
