/**
 * Game System Plugin Interface
 *
 * This defines the contract for adding new game systems to the tournament platform.
 * Each game (Infinity, Warhammer, Warmachine, etc.) implements this interface.
 */

// ============================================================================
// Scoring Configuration
// ============================================================================

export interface ScoreField {
  /** Unique identifier for this score field */
  name: string;
  /** Display label for UI */
  label: string;
  /** Short label for compact displays */
  shortLabel?: string;
  /** Minimum allowed value */
  min: number;
  /** Maximum allowed value (if static) */
  max?: number;
  /** If true, max is derived from tournament.pointLimit */
  maxFromTournament?: 'pointLimit';
  /** Is this field required for submission? */
  required: boolean;
  /** Description/help text */
  description?: string;
}

export interface MatchScores {
  player1Id: string;
  player2Id: string | null;
  player1: Record<string, number>;
  player2: Record<string, number> | null;
}

export interface ScoringConfig {
  /** Score fields to collect (e.g., OP, VP, AP for Infinity) */
  fields: ScoreField[];
  /** Tiebreaker field names in priority order */
  tiebreakers: string[];
  /** Default scores for bye matches */
  byeScores: Record<string, number>;
  /** Determine match winner from scores. Returns winner ID or null for draw */
  determineWinner: (scores: MatchScores) => string | null;
}

// ============================================================================
// Faction/Army Configuration
// ============================================================================

export interface Faction {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Aliases for parsing (e.g., "PanO" -> "PanOceania") */
  aliases?: string[];
  /** Parent faction for sectorials */
  parentId?: string;
  /** Is this a sectorial/subfaction? */
  isSectorial?: boolean;
  /** Logo/icon path */
  logo?: string;
}

export interface ParsedList {
  /** Raw input code */
  raw: string;
  /** Detected faction */
  faction: string | null;
  /** Total points */
  points: number | null;
  /** Parsed units (game-specific structure) */
  units?: unknown[];
  /** Parse errors/warnings */
  errors?: string[];
  warnings?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TournamentRules {
  pointLimit: number;
  [key: string]: unknown;
}

export interface ListConfig {
  /** Available factions for this game */
  factions: Faction[];
  /** Common point levels for organized play */
  pointLevels: number[];
  /** Parse army list code into structured data */
  parser?: (code: string) => ParsedList;
  /** Validate parsed list against tournament rules */
  validator?: (list: ParsedList, rules: TournamentRules) => ValidationResult;
}

// ============================================================================
// Hidden Information Tracking (Optional)
// ============================================================================

export interface HiddenInfoType {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Max items per player (null = unlimited) */
  maxPerPlayer: number | null;
  /** Options to choose from (e.g., classified objectives) */
  options?: { id: string; name: string }[];
}

export interface HiddenInfoConfig {
  /** Types of hidden information tracked */
  types: HiddenInfoType[];
}

// ============================================================================
// UI Customization
// ============================================================================

export interface UIConfig {
  /** Theme colors */
  colors: {
    primary: string;
    secondary: string;
  };
  /** Game logo path */
  logo?: string;
  /** Icon for compact displays */
  icon?: string;
}

// ============================================================================
// Main Game System Interface
// ============================================================================

export interface GameSystem {
  /** Unique identifier (e.g., 'infinity', 'warhammer40k') */
  id: string;
  /** Display name */
  name: string;
  /** Current rules version */
  version: string;
  /** Brief description */
  description?: string;

  /** Scoring configuration */
  scoring: ScoringConfig;

  /** Army/faction configuration */
  lists: ListConfig;

  /** Hidden information tracking (optional) */
  hiddenInfo?: HiddenInfoConfig;

  /** UI customization */
  ui: UIConfig;
}

// ============================================================================
// Game Registry Types
// ============================================================================

export interface GameRegistry {
  /** Get a game system by ID */
  get(id: string): GameSystem | undefined;
  /** Get all registered game systems */
  getAll(): GameSystem[];
  /** Register a new game system */
  register(game: GameSystem): void;
  /** Get the default game system */
  getDefault(): GameSystem;
}
