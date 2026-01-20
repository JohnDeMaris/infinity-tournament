import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusControls } from '@/components/tournament/status-controls';
import { RoundControls } from '@/components/tournament/round-controls';

interface ManageTournamentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ManageTournamentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: tournament ? `Manage: ${tournament.name} - ITM` : 'Manage Tournament - ITM',
  };
}

export default async function ManageTournamentPage({
  params,
}: ManageTournamentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Get tournament details
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tournament) {
    notFound();
  }

  // Verify ownership
  if (tournament.organizer_id !== authUser?.id) {
    redirect('/to');
  }

  // Get registrations
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, user:users(id, name, faction_preference)')
    .eq('tournament_id', id)
    .order('created_at', { ascending: true });

  const registeredPlayers =
    registrations?.filter((r) => r.status === 'registered') || [];
  const waitlistPlayers =
    registrations?.filter((r) => r.status === 'waitlist') || [];

  // Get rounds
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*, matches(*)')
    .eq('tournament_id', id)
    .order('round_number', { ascending: true });

  const currentRound = rounds?.find((r) => r.status !== 'completed');
  const completedRounds = rounds?.filter((r) => r.status === 'completed').length || 0;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{tournament.name}</h1>
            <Badge variant="outline" className="capitalize">
              {tournament.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {new Date(tournament.date_start).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            &middot; {tournament.location}
          </p>
        </div>

        <div className="flex gap-2">
          <Link href={`/events/${tournament.id}`}>
            <Button variant="outline">View Public Page</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Registered</CardDescription>
            <CardTitle className="text-3xl">
              {registeredPlayers.length}
              {tournament.max_capacity && (
                <span className="text-lg text-muted-foreground">
                  /{tournament.max_capacity}
                </span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Waitlist</CardDescription>
            <CardTitle className="text-3xl">{waitlistPlayers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rounds</CardDescription>
            <CardTitle className="text-3xl">
              {completedRounds}/{tournament.rounds}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Format</CardDescription>
            <CardTitle className="text-xl">
              {tournament.point_limit} pts / {tournament.time_limit} min
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Status Controls */}
      <div className="mb-8">
        <StatusControls tournament={tournament} />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="players" className="space-y-4">
        <TabsList>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Players ({registeredPlayers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {registeredPlayers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No players registered yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Faction</TableHead>
                      <TableHead>Army List</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredPlayers.map((reg, idx) => (
                      <TableRow key={reg.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {reg.user?.name}
                        </TableCell>
                        <TableCell>
                          {reg.army_faction || reg.user?.faction_preference || '-'}
                        </TableCell>
                        <TableCell>
                          {reg.army_list_code ? (
                            <Badge variant="outline" className="text-green-600">
                              Submitted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {waitlistPlayers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Waitlist ({waitlistPlayers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Signed Up</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlistPlayers.map((reg, idx) => (
                      <TableRow key={reg.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {reg.user?.name}
                        </TableCell>
                        <TableCell>
                          {new Date(reg.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rounds Tab */}
        <TabsContent value="rounds" className="space-y-4">
          {tournament.status === 'active' && (
            <RoundControls
              tournament={tournament}
              rounds={rounds || []}
              playerCount={registeredPlayers.length}
            />
          )}

          {tournament.status !== 'active' && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {tournament.status === 'draft' || tournament.status === 'registration'
                    ? 'Start the tournament to manage rounds'
                    : 'Tournament has been completed'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Settings</CardTitle>
              <CardDescription>
                {tournament.status === 'draft'
                  ? 'You can edit these settings while in draft mode'
                  : 'Settings cannot be changed after registration opens'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Point Limit</p>
                  <p className="font-medium">{tournament.point_limit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rounds</p>
                  <p className="font-medium">{tournament.rounds}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Round Time</p>
                  <p className="font-medium">{tournament.time_limit} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Capacity</p>
                  <p className="font-medium">
                    {tournament.max_capacity || 'Unlimited'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
