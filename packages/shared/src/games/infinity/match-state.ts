/**
 * Match State Types for Hidden Information Tracking
 *
 * These types define the structure of match_state JSONB column for tracking
 * classified objectives, hidden deployment, data tracker, and lieutenant.
 */

// ============================================================================
// State Change Actions
// ============================================================================

export type StateAction = 'set' | 'reveal' | 'lock' | 'edit' | 'add' | 'remove';

// ============================================================================
// State History Entry
// ============================================================================

/**
 * Immutable log entry for state changes
 */
export interface StateHistoryEntry {
  /** ISO timestamp of the change */
  timestamp: string;
  /** ID of the player who made the change */
  player_id: string;
  /** Type of action performed */
  action: StateAction;
  /** Field path that was changed (e.g., 'classifieds.selected', 'hidden_deployment.units') */
  field: string;
  /** Previous value before change */
  old_value: unknown;
  /** New value after change */
  new_value: unknown;
  /** If a TO made this change, their user ID */
  edited_by?: string;
}

// ============================================================================
// Classified Objectives State
// ============================================================================

export interface ClassifiedState {
  /** IDs of selected classified objectives (max 2 by default) */
  selected: string[];
  /** ISO timestamp when selections were locked (null if not locked) */
  locked_at: string | null;
  /** IDs of classifieds that have been revealed/completed */
  revealed: string[];
  /** Map of classified ID to ISO timestamp when it was revealed */
  reveal_times: Record<string, string>;
}

// ============================================================================
// Hidden Deployment State
// ============================================================================

export interface HiddenDeploymentState {
  /** Free-form descriptions of hidden deployment units */
  units: string[];
  /** Descriptions of units that have been revealed */
  revealed: string[];
  /** Map of unit description to ISO timestamp when revealed */
  reveal_times: Record<string, string>;
}

// ============================================================================
// Data Tracker State
// ============================================================================

export interface DataTrackerState {
  /** Name/description of the designated data tracker unit */
  unit: string | null;
  /** ISO timestamp when the unit was designated */
  designated_at: string | null;
}

// ============================================================================
// Lieutenant State
// ============================================================================

export interface LieutenantState {
  /** Name/description of the lieutenant unit */
  unit: string | null;
  /** ISO timestamp when the lieutenant was revealed (death, LoL, etc.) */
  revealed_at: string | null;
}

// ============================================================================
// Player Hidden State
// ============================================================================

/**
 * Complete hidden state for a single player
 */
export interface PlayerHiddenState {
  /** Classified objectives tracking */
  classifieds: ClassifiedState;
  /** Hidden deployment units tracking */
  hidden_deployment: HiddenDeploymentState;
  /** Data tracker designation */
  data_tracker: DataTrackerState;
  /** Lieutenant tracking */
  lieutenant: LieutenantState;
}

// ============================================================================
// Match State
// ============================================================================

/**
 * Complete match state stored in match_state JSONB column
 */
export interface MatchState {
  /** Player 1's hidden state */
  player1: PlayerHiddenState;
  /** Player 2's hidden state */
  player2: PlayerHiddenState;
  /** Immutable audit log of all state changes */
  history: StateHistoryEntry[];
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an empty PlayerHiddenState
 */
export function createEmptyPlayerState(): PlayerHiddenState {
  return {
    classifieds: {
      selected: [],
      locked_at: null,
      revealed: [],
      reveal_times: {},
    },
    hidden_deployment: {
      units: [],
      revealed: [],
      reveal_times: {},
    },
    data_tracker: {
      unit: null,
      designated_at: null,
    },
    lieutenant: {
      unit: null,
      revealed_at: null,
    },
  };
}

/**
 * Create an empty MatchState
 */
export function createEmptyMatchState(): MatchState {
  return {
    player1: createEmptyPlayerState(),
    player2: createEmptyPlayerState(),
    history: [],
  };
}

// ============================================================================
// State Update Helpers
// ============================================================================

/**
 * Create a state history entry
 */
export function createHistoryEntry(
  playerId: string,
  action: StateAction,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  editedBy?: string
): StateHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    player_id: playerId,
    action,
    field,
    old_value: oldValue,
    new_value: newValue,
    ...(editedBy && { edited_by: editedBy }),
  };
}

/**
 * Add a history entry to match state and return new state (immutable)
 */
export function appendHistory(
  state: MatchState,
  entry: StateHistoryEntry
): MatchState {
  return {
    ...state,
    history: [...state.history, entry],
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a valid MatchState
 */
export function isMatchState(value: unknown): value is MatchState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return (
    'player1' in state &&
    'player2' in state &&
    'history' in state &&
    Array.isArray(state.history)
  );
}

/**
 * Parse and validate match_state from database
 * Returns empty state if invalid or null
 */
export function parseMatchState(value: unknown): MatchState {
  if (isMatchState(value)) {
    return value;
  }
  return createEmptyMatchState();
}
