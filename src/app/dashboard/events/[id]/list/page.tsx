import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArmyListForm } from '@/components/tournament/army-list-form';

interface ArmyListPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Submit Army List - ITM',
};

export default async function ArmyListPage({ params }: ArmyListPageProps) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Get tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, name, point_limit, list_deadline, status')
    .eq('id', tournamentId)
    .single();

  if (tournamentError || !tournament) {
    notFound();
  }

  // Get user's registration
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('user_id', authUser.id)
    .single();

  if (regError || !registration) {
    redirect(`/events/${tournamentId}`);
  }

  // Check deadline
  const isPastDeadline =
    tournament.list_deadline &&
    new Date(tournament.list_deadline) < new Date();

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-2">Submit Army List</h1>
      <p className="text-muted-foreground mb-8">
        {tournament.name} ({tournament.point_limit} points)
      </p>

      {isPastDeadline && !registration.army_list_code ? (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          <p className="font-medium">Submission Deadline Passed</p>
          <p className="text-sm mt-1">
            The deadline for army list submission was{' '}
            {new Date(tournament.list_deadline!).toLocaleString()}
          </p>
        </div>
      ) : (
        <ArmyListForm
          tournamentId={tournamentId}
          registrationId={registration.id}
          existingCode={registration.army_list_code}
          existingFaction={registration.army_faction}
          isPastDeadline={isPastDeadline || false}
          pointLimit={tournament.point_limit}
        />
      )}
    </div>
  );
}
