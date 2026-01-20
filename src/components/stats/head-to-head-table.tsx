'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { HeadToHeadRecord } from '@/lib/stats/player-stats';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface HeadToHeadTableProps {
  records: HeadToHeadRecord[];
}

export function HeadToHeadTable({ records }: HeadToHeadTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) =>
        record.opponentName.toLowerCase().includes(query)
      );
    }

    // Sort by matches played (descending)
    return filtered.sort((a, b) => b.matchesPlayed - a.matchesPlayed);
  }, [records, searchQuery]);

  // Determine record color based on W/L ratio
  const getRecordColor = (record: HeadToHeadRecord): string => {
    if (record.wins > record.losses) {
      return 'text-green-600 dark:text-green-400';
    } else if (record.losses > record.wins) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-muted-foreground';
  };

  // Format win rate
  const formatWinRate = (record: HeadToHeadRecord): string => {
    if (record.matchesPlayed === 0) return '0%';
    const winRate = (record.wins / record.matchesPlayed) * 100;
    return `${winRate.toFixed(0)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search opponents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        {filteredRecords.length !== records.length && (
          <Badge variant="secondary">
            {filteredRecords.length} of {records.length}
          </Badge>
        )}
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery.trim()
            ? 'No opponents found matching your search.'
            : 'No head-to-head records yet.'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opponent</TableHead>
              <TableHead className="text-center">Matches</TableHead>
              <TableHead className="text-center">Record</TableHead>
              <TableHead className="text-center">Win Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.opponentId}>
                <TableCell>
                  <Link
                    href={`/players/${record.opponentId}`}
                    className="hover:underline font-medium"
                  >
                    {record.opponentName}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  {record.matchesPlayed}
                </TableCell>
                <TableCell className="text-center">
                  <span className={getRecordColor(record)}>
                    {record.wins}-{record.losses}-{record.draws}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      record.wins > record.losses
                        ? 'default'
                        : record.losses > record.wins
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {formatWinRate(record)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
