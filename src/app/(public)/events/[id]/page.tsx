import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RegisterButton } from '@/components/tournament/register-button';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EventPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: tournament ? `${tournament.name} - ITM` : 'Event - ITM',
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
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

  // Get tournament details
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*, organizer:users(id, name)')
    .eq('id', id)
    .single();

  if (error || !tournament) {
    notFound();
  }

  // Only show draft tournaments to their organizers
  if (tournament.status === 'draft' && tournament.organizer_id !== authUser?.id) {
    notFound();
  }

  // Get registration count
  const { count: registeredCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id)
    .eq('status', 'registered');

  // Get user's registration if logged in
  let userRegistration = null;
  if (authUser) {
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('tournament_id', id)
      .eq('user_id', authUser.id)
      .single();
    userRegistration = data;
  }

  const isFull =
    tournament.max_capacity !== null &&
    (registeredCount || 0) >= tournament.max_capacity;

  const isRegistrationOpen = tournament.status === 'registration';
  const canRegister = isRegistrationOpen && !userRegistration && authUser;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    registration: 'bg-green-500',
    active: 'bg-blue-500',
    completed: 'bg-gray-400',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
              <Badge
                variant="secondary"
                className={`${statusColors[tournament.status]} text-white`}
              >
                {tournament.status === 'registration'
                  ? 'Registration Open'
                  : tournament.status.charAt(0).toUpperCase() +
                    tournament.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Organized by {tournament.organizer?.name}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {tournament.organizer_id === authUser?.id && (
              <Link href={`/to/${tournament.id}`}>
                <Button variant="outline">Manage</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {tournament.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{tournament.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Format Details */}
            <Card>
              <CardHeader>
                <CardTitle>Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="text-lg font-medium">
                      {tournament.point_limit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rounds</p>
                    <p className="text-lg font-medium">{tournament.rounds}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Round Time</p>
                    <p className="text-lg font-medium">
                      {tournament.time_limit} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scoring</p>
                    <p className="text-lg font-medium">ITS (OP/VP/AP)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Standings link for active/completed tournaments */}
            {(tournament.status === 'active' ||
              tournament.status === 'completed') && (
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/events/${tournament.id}/standings`}>
                    <Button className="w-full">View Standings</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Date & Location */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">When & Where</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(tournament.date_start).toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                  {tournament.date_end &&
                    tournament.date_end !== tournament.date_start && (
                      <p className="text-sm text-muted-foreground">
                        through{' '}
                        {new Date(tournament.date_end).toLocaleDateString(
                          'en-US',
                          {
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    )}
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{tournament.location}</p>
                </div>
              </CardContent>
            </Card>

            {/* Registration */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Registered</span>
                  <span className="font-medium">
                    {registeredCount || 0}
                    {tournament.max_capacity && ` / ${tournament.max_capacity}`}
                  </span>
                </div>

                {tournament.registration_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="text-sm">
                      {new Date(
                        tournament.registration_deadline
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {tournament.list_deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">List Due</span>
                    <span className="text-sm">
                      {new Date(tournament.list_deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <Separator />

                {/* Registration status/button */}
                {!authUser ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Sign in to register
                    </p>
                    <Link href={`/login?redirect=/events/${tournament.id}`}>
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  </div>
                ) : userRegistration ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant={
                          userRegistration.status === 'registered'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {userRegistration.status === 'registered'
                          ? 'Registered'
                          : userRegistration.status === 'waitlist'
                            ? 'On Waitlist'
                            : 'Dropped'}
                      </Badge>
                    </div>
                    {userRegistration.status === 'registered' &&
                      !userRegistration.army_list_code && (
                        <Link
                          href={`/dashboard/events/${tournament.id}/list`}
                        >
                          <Button variant="outline" className="w-full">
                            Submit Army List
                          </Button>
                        </Link>
                      )}
                    {userRegistration.status === 'registered' &&
                      userRegistration.army_list_code && (
                        <p className="text-sm text-center text-green-600">
                          Army list submitted
                        </p>
                      )}
                  </div>
                ) : canRegister ? (
                  <RegisterButton
                    tournamentId={tournament.id}
                    isFull={isFull}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    {tournament.status === 'draft'
                      ? 'Registration not yet open'
                      : tournament.status === 'active'
                        ? 'Tournament in progress'
                        : 'Tournament completed'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
