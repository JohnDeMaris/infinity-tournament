'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  parseMatchState,
  createHistoryEntry,
  appendHistory,
  CLASSIFIED_OBJECTIVES,
  type MatchState,
  type PlayerHiddenState,
} from '@infinity-tournament/shared/games';
import { StateHistoryLog } from './state-history-log';

interface PlayerInfo {
  id: string;
  name: string;
}

interface TOHiddenInfoViewerProps {
  matchId: string;
  matchState: MatchState | null;
  player1: PlayerInfo;
  player2: PlayerInfo;
  toUserId: string;
}

/**
 * TO-specific viewer for hidden information
 * Shows both players' hidden state side by side with edit capability
 */
export function TOHiddenInfoViewer({
  matchId,
  matchState: rawMatchState,
  player1,
  player2,
  toUserId,
}: TOHiddenInfoViewerProps) {
  const router = useRouter();
  const [localState, setLocalState] = useState<MatchState>(() =>
    parseMatchState(rawMatchState)
  );
  const [isSaving, setIsSaving] = useState(false);

  // Handle TO edits
  const handleTOEdit = useCallback(
    async (
      playerKey: 'player1' | 'player2',
      field: string,
      oldValue: unknown,
      newValue: unknown,
      updater: (state: PlayerHiddenState) => PlayerHiddenState
    ) => {
      setIsSaving(true);

      // Create history entry with TO attribution
      const entry = createHistoryEntry(
        playerKey,
        'edit',
        field,
        oldValue,
        newValue,
        toUserId
      );

      const newPlayerState = updater(localState[playerKey]);
      const updatedState = appendHistory(
        {
          ...localState,
          [playerKey]: newPlayerState,
        },
        entry
      );

      setLocalState(updatedState);

      // Save to database
      const supabase = createClient();
      try {
        const { error } = await supabase
          .from('matches')
          .update({ match_state: updatedState })
          .eq('id', matchId);

        if (error) {
          toast.error('Failed to save edit');
          console.error('TO edit error:', error);
        } else {
          toast.success('Edit saved');
          router.refresh();
        }
      } catch (err) {
        toast.error('Network error');
        console.error('TO edit network error:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [localState, matchId, toUserId, router]
  );

  return (
    <div className="space-y-6">
      {/* Player Hidden States Side by Side */}
      <div className="grid md:grid-cols-2 gap-6">
        <PlayerHiddenStateCard
          title={`${player1.name}'s Hidden Info`}
          playerKey="player1"
          state={localState.player1}
          onTOEdit={(field, oldVal, newVal, updater) =>
            handleTOEdit('player1', field, oldVal, newVal, updater)
          }
          isSaving={isSaving}
        />
        <PlayerHiddenStateCard
          title={`${player2.name}'s Hidden Info`}
          playerKey="player2"
          state={localState.player2}
          onTOEdit={(field, oldVal, newVal, updater) =>
            handleTOEdit('player2', field, oldVal, newVal, updater)
          }
          isSaving={isSaving}
        />
      </div>

      {/* State History Log */}
      <StateHistoryLog
        history={localState.history}
        player1Name={player1.name}
        player2Name={player2.name}
      />
    </div>
  );
}

// ============================================================================
// Player Hidden State Card
// ============================================================================

interface PlayerHiddenStateCardProps {
  title: string;
  playerKey: 'player1' | 'player2';
  state: PlayerHiddenState;
  onTOEdit: (
    field: string,
    oldValue: unknown,
    newValue: unknown,
    updater: (state: PlayerHiddenState) => PlayerHiddenState
  ) => void;
  isSaving: boolean;
}

function PlayerHiddenStateCard({
  title,
  state,
  onTOEdit,
  isSaving,
}: PlayerHiddenStateCardProps) {
  const hasData =
    state.classifieds.selected.length > 0 ||
    state.hidden_deployment.units.length > 0 ||
    state.data_tracker.unit ||
    state.lieutenant.unit;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {hasData ? 'Hidden information recorded' : 'No hidden information recorded'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Classified Objectives */}
        <div>
          <h4 className="text-sm font-medium mb-2">Classified Objectives</h4>
          {state.classifieds.selected.length > 0 ? (
            <div className="space-y-1">
              {state.classifieds.selected.map((id) => {
                const classified = CLASSIFIED_OBJECTIVES.find((c) => c.id === id);
                const isRevealed = state.classifieds.revealed.includes(id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span>{classified?.name || id}</span>
                    <div className="flex items-center gap-2">
                      {isRevealed && (
                        <Badge variant="outline" className="text-xs">
                          Revealed
                        </Badge>
                      )}
                      {state.classifieds.locked_at && (
                        <Badge variant="secondary" className="text-xs">
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {state.classifieds.locked_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Locked at {new Date(state.classifieds.locked_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">None selected</p>
          )}
        </div>

        {/* Hidden Deployment */}
        <div>
          <h4 className="text-sm font-medium mb-2">Hidden Deployment</h4>
          {state.hidden_deployment.units.length > 0 ? (
            <div className="space-y-1">
              {state.hidden_deployment.units.map((unit, idx) => {
                const isRevealed = state.hidden_deployment.revealed.includes(unit);
                const revealTime = state.hidden_deployment.reveal_times[unit];
                return (
                  <div
                    key={`${unit}-${idx}`}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span>{unit}</span>
                    {isRevealed && (
                      <Badge variant="outline" className="text-xs">
                        Revealed {revealTime && new Date(revealTime).toLocaleTimeString()}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">None recorded</p>
          )}
        </div>

        {/* Data Tracker */}
        <div>
          <h4 className="text-sm font-medium mb-2">Data Tracker</h4>
          {state.data_tracker.unit ? (
            <div className="p-2 bg-muted rounded text-sm">
              {state.data_tracker.unit}
              {state.data_tracker.designated_at && (
                <span className="text-xs text-muted-foreground ml-2">
                  (designated {new Date(state.data_tracker.designated_at).toLocaleTimeString()})
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not designated</p>
          )}
        </div>

        {/* Lieutenant */}
        <div>
          <h4 className="text-sm font-medium mb-2">Lieutenant</h4>
          {state.lieutenant.unit ? (
            <div className="p-2 bg-muted rounded text-sm">
              {state.lieutenant.unit}
              {state.lieutenant.revealed_at && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Revealed {new Date(state.lieutenant.revealed_at).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not recorded</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
