import { CreateTournamentForm } from '@/components/tournament/create-tournament-form';

export const metadata = {
  title: 'Create Tournament - ITM',
  description: 'Create a new tournament',
};

export default function CreateTournamentPage() {
  return (
    <div className="container py-8">
      <CreateTournamentForm />
    </div>
  );
}
