'use client';

import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  parseMatchState,
  createHistoryEntry,
  appendHistory,
  type MatchState,
  type PlayerHiddenState,
  type StateAction,
} from '@infinity-tournament/shared/games';

interface HiddenInfoPanelProps {
  /** Current user's player number (1 or 2) */
  playerNumber: 1 | 2;
  /** Player's name for display */
  playerName: string;
  /** Current match state from database */
  matchState: MatchState | null;
  /** Callback when state changes - parent should save to database */
  onStateChange: (newState: MatchState) => void;
  /** Whether the match is complete (read-only mode) */
  isMatchComplete?: boolean;
  /** Whether this is a TO viewing (shows both players) */
  isTOView?: boolean;
}

/**
 * Collapsible panel for tracking hidden game information
 *
 * This panel allows players to:
 * - Select and lock classified objectives
 * - Track hidden deployment units
 * - Designate data tracker
 * - Record lieutenant info
 *
 * All changes are logged to an immutable history.
 */
export function HiddenInfoPanel({
  playerNumber,
  playerName,
  matchState: rawMatchState,
  onStateChange,
  isMatchComplete = false,
  isTOView = false,
}: HiddenInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse and ensure valid match state
  const matchState = useMemo(
    () => parseMatchState(rawMatchState),
    [rawMatchState]
  );

  // Get current player's state
  const playerKey = playerNumber === 1 ? 'player1' : 'player2';
  const playerState = matchState[playerKey];

  // Helper to update player state with history
  const updatePlayerState = useCallback(
    (
      action: StateAction,
      field: string,
      oldValue: unknown,
      newValue: unknown,
      updater: (state: PlayerHiddenState) => PlayerHiddenState
    ) => {
      const entry = createHistoryEntry(
        playerKey,
        action,
        field,
        oldValue,
        newValue
      );

      const newPlayerState = updater(playerState);
      const updatedState = appendHistory(
        {
          ...matchState,
          [playerKey]: newPlayerState,
        },
        entry
      );

      onStateChange(updatedState);
    },
    [matchState, playerKey, playerState, onStateChange]
  );

  // Count how many items are tracked
  const trackedCount = useMemo(() => {
    let count = 0;
    if (playerState.classifieds.selected.length > 0) count++;
    if (playerState.hidden_deployment.units.length > 0) count++;
    if (playerState.data_tracker.unit) count++;
    if (playerState.lieutenant.unit) count++;
    return count;
  }, [playerState]);

  const isLocked = !!playerState.classifieds.locked_at;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              <EyeOff className="inline-block h-4 w-4 mr-2" />
              Hidden Information
            </CardTitle>
            {trackedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {trackedCount} tracked
              </Badge>
            )}
            {isLocked && (
              <Badge variant="outline" className="text-xs">
                Locked
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!isExpanded && trackedCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Click to expand and manage your secret objectives and units
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-2">
          {isMatchComplete && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              Match complete - hidden info is now visible
            </div>
          )}

          {/* Classified Objectives Section */}
          <ClassifiedsSection
            state={playerState.classifieds}
            onChange={(classifieds, action, field, oldVal, newVal) => {
              updatePlayerState(action, field, oldVal, newVal, (s) => ({
                ...s,
                classifieds,
              }));
            }}
            disabled={isMatchComplete}
          />

          {/* Hidden Deployment Section */}
          <HiddenDeploymentSection
            state={playerState.hidden_deployment}
            onChange={(hidden_deployment, action, field, oldVal, newVal) => {
              updatePlayerState(action, field, oldVal, newVal, (s) => ({
                ...s,
                hidden_deployment,
              }));
            }}
            disabled={isMatchComplete}
          />

          {/* Data Tracker Section */}
          <DataTrackerSection
            state={playerState.data_tracker}
            onChange={(data_tracker, action, field, oldVal, newVal) => {
              updatePlayerState(action, field, oldVal, newVal, (s) => ({
                ...s,
                data_tracker,
              }));
            }}
            disabled={isMatchComplete}
          />

          {/* Lieutenant Section */}
          <LieutenantSection
            state={playerState.lieutenant}
            onChange={(lieutenant, action, field, oldVal, newVal) => {
              updatePlayerState(action, field, oldVal, newVal, (s) => ({
                ...s,
                lieutenant,
              }));
            }}
            disabled={isMatchComplete}
          />
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// Sub-sections (temporary inline - will be extracted to separate files)
// ============================================================================

import type {
  ClassifiedState,
  HiddenDeploymentState,
  DataTrackerState,
  LieutenantState,
} from '@infinity-tournament/shared/games';
import { CLASSIFIED_OBJECTIVES } from '@infinity-tournament/shared/games';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Classified Objectives Section
interface ClassifiedsSectionProps {
  state: ClassifiedState;
  onChange: (
    newState: ClassifiedState,
    action: StateAction,
    field: string,
    oldValue: unknown,
    newValue: unknown
  ) => void;
  disabled?: boolean;
}

function ClassifiedsSection({
  state,
  onChange,
  disabled,
}: ClassifiedsSectionProps) {
  const isLocked = !!state.locked_at;

  const handleSelectClassified = (index: number, value: string) => {
    const oldValue = state.selected[index];
    const newSelected = [...state.selected];
    if (value === '_remove') {
      newSelected.splice(index, 1);
    } else {
      newSelected[index] = value;
    }
    onChange(
      { ...state, selected: newSelected },
      'set',
      `classifieds.selected[${index}]`,
      oldValue,
      value === '_remove' ? null : value
    );
  };

  const handleAddClassified = (value: string) => {
    if (state.selected.length >= 2) return;
    onChange(
      { ...state, selected: [...state.selected, value] },
      'add',
      'classifieds.selected',
      null,
      value
    );
  };

  const handleLock = () => {
    if (state.selected.length === 0) return;
    const now = new Date().toISOString();
    onChange({ ...state, locked_at: now }, 'lock', 'classifieds', null, now);
  };

  const handleReveal = (classifiedId: string) => {
    if (state.revealed.includes(classifiedId)) return;
    const now = new Date().toISOString();
    onChange(
      {
        ...state,
        revealed: [...state.revealed, classifiedId],
        reveal_times: { ...state.reveal_times, [classifiedId]: now },
      },
      'reveal',
      `classifieds.revealed`,
      null,
      classifiedId
    );
  };

  // Filter out already selected classifieds from dropdown
  const availableClassifieds = CLASSIFIED_OBJECTIVES.filter(
    (c) => !state.selected.includes(c.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Classified Objectives</Label>
        {!isLocked && state.selected.length > 0 && !disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLock}
            className="h-7 text-xs"
          >
            Lock Selections
          </Button>
        )}
        {isLocked && (
          <span className="text-xs text-muted-foreground">
            Locked at {new Date(state.locked_at!).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {state.selected.map((classifiedId, index) => {
          const classified = CLASSIFIED_OBJECTIVES.find(
            (c) => c.id === classifiedId
          );
          const isRevealed = state.revealed.includes(classifiedId);
          const revealTime = state.reveal_times[classifiedId];

          return (
            <div
              key={`${classifiedId}-${index}`}
              className="flex items-center gap-2"
            >
              <div className="flex-1 p-2 bg-muted rounded text-sm">
                {classified?.name || classifiedId}
                {isRevealed && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Revealed {new Date(revealTime).toLocaleTimeString()}
                  </Badge>
                )}
              </div>
              {isLocked && !isRevealed && !disabled && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleReveal(classifiedId)}
                  className="h-7 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Reveal
                </Button>
              )}
              {!isLocked && !disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectClassified(index, '_remove')}
                  className="h-7 text-xs text-destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          );
        })}

        {!isLocked && state.selected.length < 2 && !disabled && (
          <Select onValueChange={handleAddClassified}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select a classified..." />
            </SelectTrigger>
            <SelectContent>
              {availableClassifieds.map((classified) => (
                <SelectItem key={classified.id} value={classified.id}>
                  {classified.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

// Hidden Deployment Section
interface HiddenDeploymentSectionProps {
  state: HiddenDeploymentState;
  onChange: (
    newState: HiddenDeploymentState,
    action: StateAction,
    field: string,
    oldValue: unknown,
    newValue: unknown
  ) => void;
  disabled?: boolean;
}

function HiddenDeploymentSection({
  state,
  onChange,
  disabled,
}: HiddenDeploymentSectionProps) {
  const [newUnit, setNewUnit] = useState('');

  const handleAddUnit = () => {
    if (!newUnit.trim()) return;
    onChange(
      { ...state, units: [...state.units, newUnit.trim()] },
      'add',
      'hidden_deployment.units',
      null,
      newUnit.trim()
    );
    setNewUnit('');
  };

  const handleRemoveUnit = (index: number) => {
    const unit = state.units[index];
    const newUnits = state.units.filter((_, i) => i !== index);
    onChange(
      { ...state, units: newUnits },
      'remove',
      'hidden_deployment.units',
      unit,
      null
    );
  };

  const handleRevealUnit = (unit: string) => {
    if (state.revealed.includes(unit)) return;
    const now = new Date().toISOString();
    onChange(
      {
        ...state,
        revealed: [...state.revealed, unit],
        reveal_times: { ...state.reveal_times, [unit]: now },
      },
      'reveal',
      'hidden_deployment.revealed',
      null,
      unit
    );
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Hidden Deployment</Label>

      <div className="space-y-2">
        {state.units.map((unit, index) => {
          const isRevealed = state.revealed.includes(unit);
          const revealTime = state.reveal_times[unit];

          return (
            <div key={`${unit}-${index}`} className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-muted rounded text-sm">
                {unit}
                {isRevealed && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Revealed {new Date(revealTime).toLocaleTimeString()}
                  </Badge>
                )}
              </div>
              {!isRevealed && !disabled && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRevealUnit(unit)}
                    className="h-7 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Reveal
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUnit(index)}
                    className="h-7 text-xs text-destructive"
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>
          );
        })}

        {!disabled && (
          <div className="flex gap-2">
            <Input
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Unit name (e.g., Spektr, Ninja)"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddUnit}
              disabled={!newUnit.trim()}
              className="h-8 text-xs"
            >
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Data Tracker Section
interface DataTrackerSectionProps {
  state: DataTrackerState;
  onChange: (
    newState: DataTrackerState,
    action: StateAction,
    field: string,
    oldValue: unknown,
    newValue: unknown
  ) => void;
  disabled?: boolean;
}

function DataTrackerSection({
  state,
  onChange,
  disabled,
}: DataTrackerSectionProps) {
  const [unit, setUnit] = useState(state.unit || '');

  const handleDesignate = () => {
    if (!unit.trim()) return;
    const now = new Date().toISOString();
    onChange(
      { unit: unit.trim(), designated_at: now },
      'set',
      'data_tracker.unit',
      state.unit,
      unit.trim()
    );
  };

  const handleClear = () => {
    onChange(
      { unit: null, designated_at: null },
      'remove',
      'data_tracker.unit',
      state.unit,
      null
    );
    setUnit('');
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Data Tracker</Label>

      {state.unit ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 p-2 bg-muted rounded text-sm">
            {state.unit}
            <span className="text-xs text-muted-foreground ml-2">
              Designated {new Date(state.designated_at!).toLocaleTimeString()}
            </span>
          </div>
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 text-xs text-destructive"
            >
              Clear
            </Button>
          )}
        </div>
      ) : (
        !disabled && (
          <div className="flex gap-2">
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Specialist unit name"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleDesignate()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDesignate}
              disabled={!unit.trim()}
              className="h-8 text-xs"
            >
              Designate
            </Button>
          </div>
        )
      )}
    </div>
  );
}

// Lieutenant Section
interface LieutenantSectionProps {
  state: LieutenantState;
  onChange: (
    newState: LieutenantState,
    action: StateAction,
    field: string,
    oldValue: unknown,
    newValue: unknown
  ) => void;
  disabled?: boolean;
}

function LieutenantSection({
  state,
  onChange,
  disabled,
}: LieutenantSectionProps) {
  const [unit, setUnit] = useState(state.unit || '');

  const handleSet = () => {
    if (!unit.trim()) return;
    onChange(
      { unit: unit.trim(), revealed_at: state.revealed_at },
      'set',
      'lieutenant.unit',
      state.unit,
      unit.trim()
    );
  };

  const handleReveal = () => {
    const now = new Date().toISOString();
    onChange(
      { ...state, revealed_at: now },
      'reveal',
      'lieutenant.revealed_at',
      null,
      now
    );
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Lieutenant</Label>

      {state.unit ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 p-2 bg-muted rounded text-sm">
            {state.unit}
            {state.revealed_at && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Revealed {new Date(state.revealed_at).toLocaleTimeString()}
              </Badge>
            )}
          </div>
          {!state.revealed_at && !disabled && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReveal}
              className="h-7 text-xs"
            >
              Mark Revealed
            </Button>
          )}
        </div>
      ) : (
        !disabled && (
          <div className="flex gap-2">
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Lieutenant unit name"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSet()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSet}
              disabled={!unit.trim()}
              className="h-8 text-xs"
            >
              Set
            </Button>
          </div>
        )
      )}
    </div>
  );
}
