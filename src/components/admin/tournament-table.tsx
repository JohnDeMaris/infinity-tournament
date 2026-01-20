'use client';

import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteTournament } from '@/lib/admin/actions';
import type { TournamentStatus } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TournamentRow {
  id: string;
  name: string;
  date_start: string;
  status: TournamentStatus;
  organizer_name: string;
  player_count: number;
}

interface TournamentTableProps {
  tournaments: TournamentRow[];
}

const statusOptions: { value: TournamentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'registration', label: 'Registration' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

function getStatusBadgeVariant(status: TournamentStatus) {
  switch (status) {
    case 'draft':
      return 'secondary';
    case 'registration':
      return 'default';
    case 'active':
      return 'default';
    case 'completed':
      return 'outline';
    default:
      return 'secondary';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TournamentTable({ tournaments }: TournamentTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      // Filter by search query
      const matchesSearch = tournament.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter by status
      const matchesStatus =
        statusFilter === 'all' || tournament.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tournaments, searchQuery, statusFilter]);

  const handleDelete = async (tournamentId: string) => {
    setDeletingId(tournamentId);
    startTransition(async () => {
      const result = await deleteTournament(tournamentId);
      if (result.success) {
        router.refresh();
      } else {
        console.error('Failed to delete tournament:', result.error);
        // Could add toast notification here
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search tournaments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as TournamentStatus | 'all')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Players</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTournaments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No tournaments found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTournaments.map((tournament) => (
                <TableRow key={tournament.id}>
                  <TableCell className="font-medium">{tournament.name}</TableCell>
                  <TableCell>{tournament.organizer_name}</TableCell>
                  <TableCell>
                    {formatDate(tournament.date_start)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(tournament.status)}>
                      {tournament.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {tournament.player_count}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/events/${tournament.id}`}>View</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isPending && deletingId === tournament.id}
                          >
                            {isPending && deletingId === tournament.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{tournament.name}&quot;?
                              This action cannot be undone. All registrations, rounds,
                              and matches associated with this tournament will be
                              permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(tournament.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredTournaments.length} of {tournaments.length} tournaments
      </p>
    </div>
  );
}
