import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SuspendUserButton } from './suspend-button';

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

interface UserDetails {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
}

interface TournamentSummary {
  id: string;
  name: string;
  date_start: string;
  status: string;
}

async function getUserDetails(userId: string) {
  const supabase = await createClient();

  // Fetch user details
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, display_name, is_admin, is_suspended, created_at')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return null;
  }

  // Fetch tournaments organized by this user
  const { data: organizedTournaments } = await supabase
    .from('tournaments')
    .select('id, name, date_start, status')
    .eq('organizer_id', userId)
    .order('date_start', { ascending: false })
    .limit(10);

  // Fetch tournaments the user has participated in (via registrations)
  const { data: registrations } = await supabase
    .from('registrations')
    .select('tournament:tournaments(id, name, date_start, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const participatedTournaments: TournamentSummary[] = (registrations || [])
    .map((reg) => reg.tournament as unknown as TournamentSummary)
    .filter((t): t is TournamentSummary => t !== null);

  return {
    user: user as UserDetails,
    organizedTournaments: (organizedTournaments || []) as TournamentSummary[],
    participatedTournaments,
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const data = await getUserDetails(id);

  if (!data) {
    notFound();
  }

  const { user, organizedTournaments, participatedTournaments } = data;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'registration':
        return <Badge variant="outline">Registration</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">Back to Users</Link>
            </Button>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {user.display_name || 'Unknown User'}
          </h1>
        </div>
        <SuspendUserButton
          userId={user.id}
          isSuspended={user.is_suspended}
          isAdmin={user.is_admin}
        />
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="mt-1 flex items-center gap-2">
                {user.display_name || 'Not set'}
                {user.is_admin && (
                  <Badge variant="secondary">Admin</Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Registered</dt>
              <dd className="mt-1">{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">
                {user.is_suspended ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="outline">Active</Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Tournaments Organized */}
      <Card>
        <CardHeader>
          <CardTitle>Tournaments Organized ({organizedTournaments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {organizedTournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This user has not organized any tournaments.
            </p>
          ) : (
            <ul className="space-y-3">
              {organizedTournaments.map((tournament) => (
                <li
                  key={tournament.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(tournament.date_start)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(tournament.status)}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/tournaments/${tournament.id}`}>View</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Tournaments Participated */}
      <Card>
        <CardHeader>
          <CardTitle>Tournaments Participated ({participatedTournaments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {participatedTournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This user has not participated in any tournaments.
            </p>
          ) : (
            <ul className="space-y-3">
              {participatedTournaments.map((tournament) => (
                <li
                  key={tournament.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{tournament.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(tournament.date_start)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(tournament.status)}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${tournament.id}`}>View</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
