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
import { ValidationTable } from '@/components/tournament/validation-table';

interface ValidateListsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ValidateListsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: tournament ? `Validate Lists - ${tournament.name} - ITM` : 'Validate Lists - ITM',
  };
}

export default async function ValidateListsPage({
  params,
}: ValidateListsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

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
  if (tournament.organizer_id !== authUser.id) {
    redirect('/to');
  }

  // Get all registrations with user data
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      user_id,
      army_list_code,
      army_faction,
      list_validation_result,
      status,
      users!inner(id, name)
    `)
    .eq('tournament_id', id)
    .eq('status', 'registered')
    .order('created_at', { ascending: true });

  // Transform registrations to include user name at top level
  const registrationsWithNames = registrations?.map(reg => {
    const user = Array.isArray(reg.users) ? reg.users[0] : reg.users;
    return {
      id: reg.id,
      user_id: reg.user_id,
      user_name: user?.name || 'Unknown',
      army_list_code: reg.army_list_code,
      army_faction: reg.army_faction,
      list_validation_result: reg.list_validation_result,
    };
  }) || [];

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/to/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to {tournament.name}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2">Validate Army Lists</h1>
            <p className="text-muted-foreground">
              Review and validate all submitted army lists for this tournament
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Badge variant="outline" className="text-base">
            {tournament.point_limit} points
          </Badge>
          <Badge variant="outline" className="text-base">
            {registrationsWithNames.length} registered players
          </Badge>
        </div>
      </div>

      {/* Validation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Army Lists</CardTitle>
          <CardDescription>
            Validate all submitted lists against the tournament point limit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ValidationTable
            registrations={registrationsWithNames}
            pointLimit={tournament.point_limit}
            tournamentId={id}
            tournamentName={tournament.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}
