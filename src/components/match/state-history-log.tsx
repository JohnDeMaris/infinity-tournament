'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StateHistoryEntry } from '@infinity-tournament/shared/games';

interface StateHistoryLogProps {
  history: StateHistoryEntry[];
  player1Name: string;
  player2Name: string;
}

/**
 * Audit log component showing all state changes with timestamps
 * For TO dispute resolution
 */
export function StateHistoryLog({
  history,
  player1Name,
  player2Name,
}: StateHistoryLogProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>State History</CardTitle>
          <CardDescription>No changes recorded yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Sort history by timestamp (most recent first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>State History</CardTitle>
        <CardDescription>
          Audit log of all hidden information changes ({history.length} entries)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedHistory.map((entry, idx) => (
            <HistoryEntryRow
              key={`${entry.timestamp}-${idx}`}
              entry={entry}
              player1Name={player1Name}
              player2Name={player2Name}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface HistoryEntryRowProps {
  entry: StateHistoryEntry;
  player1Name: string;
  player2Name: string;
}

function HistoryEntryRow({
  entry,
  player1Name,
  player2Name,
}: HistoryEntryRowProps) {
  const playerName = entry.player_id === 'player1' ? player1Name : player2Name;
  const timestamp = new Date(entry.timestamp);

  // Format action for display
  const actionLabel = {
    set: 'Set',
    reveal: 'Revealed',
    lock: 'Locked',
    edit: 'Edited',
    add: 'Added',
    remove: 'Removed',
  }[entry.action] || entry.action;

  // Format field name for display
  const fieldLabel = formatFieldName(entry.field);

  // Format values for display
  const oldValueDisplay = formatValue(entry.old_value);
  const newValueDisplay = formatValue(entry.new_value);

  return (
    <div className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 text-sm">
      {/* Timestamp */}
      <div className="flex-shrink-0 w-20 text-xs text-muted-foreground">
        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        <br />
        {timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </div>

      {/* Action Badge */}
      <Badge
        variant={entry.action === 'edit' ? 'destructive' : 'secondary'}
        className="flex-shrink-0 text-xs"
      >
        {actionLabel}
      </Badge>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-medium">{playerName}</span>
          <span className="text-muted-foreground">{fieldLabel}</span>
        </div>
        {(oldValueDisplay || newValueDisplay) && (
          <div className="text-xs text-muted-foreground mt-1">
            {oldValueDisplay && newValueDisplay ? (
              <>
                <span className="line-through">{oldValueDisplay}</span>
                {' → '}
                <span>{newValueDisplay}</span>
              </>
            ) : newValueDisplay ? (
              <span>{newValueDisplay}</span>
            ) : (
              <span className="line-through">{oldValueDisplay}</span>
            )}
          </div>
        )}

        {/* TO Edit Attribution */}
        {entry.edited_by && (
          <div className="text-xs text-orange-600 mt-1">
            Edited by TO
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format field path for human-readable display
 */
function formatFieldName(field: string): string {
  const mappings: Record<string, string> = {
    'classifieds.selected': 'classified objective',
    'classifieds.revealed': 'classified',
    'classifieds': 'classifieds',
    'hidden_deployment.units': 'hidden deployment',
    'hidden_deployment.revealed': 'hidden unit',
    'data_tracker.unit': 'data tracker',
    'lieutenant.unit': 'lieutenant',
    'lieutenant.revealed_at': 'lieutenant revealed',
  };

  // Check for exact match
  if (mappings[field]) {
    return mappings[field];
  }

  // Check for partial match (handles indexed fields like classifieds.selected[0])
  for (const [pattern, label] of Object.entries(mappings)) {
    if (field.startsWith(pattern)) {
      return label;
    }
  }

  // Fallback: humanize the field name
  return field
    .replace(/_/g, ' ')
    .replace(/\./g, ' ')
    .replace(/\[\d+\]/g, '');
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
