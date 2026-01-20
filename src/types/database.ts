// Database types for Infinity Tournament Manager
// These types mirror the Supabase database schema

import type { MatchState as InfinityMatchState, ValidationResult } from '@infinity-tournament/shared/games';

export type UserRole = 'player' | 'to' | 'admin';

// Re-export MatchState type for convenience
export type { InfinityMatchState as MatchState };

export type TournamentStatus = 'draft' | 'registration' | 'active' | 'completed';

export type RegistrationStatus = 'registered' | 'waitlist' | 'dropped';

export type RoundStatus = 'pairing' | 'active' | 'completed';

export type MatchConfirmationStatus = 'pending' | 'partial' | 'disputed' | 'confirmed' | 'completed';

// Infinity factions
export const FACTIONS = [
  'PanOceania',
  'Yu Jing',
  'Ariadna',
  'Haqqislam',
  'Nomads',
  'Combined Army',
  'ALEPH',
  'Tohaa',
  'Non-Aligned Armies',
  'O-12',
  'NA2',
] as const;

export type Faction = (typeof FACTIONS)[number];

// Common point limits for ITS
export const POINT_LIMITS = [150, 200, 300, 400] as const;
export type PointLimit = (typeof POINT_LIMITS)[number] | number;

// ============================================================================
// Database Entity Types
// ============================================================================

export type UserStatus = 'active' | 'suspended';

export type AdminLogTargetType = 'user' | 'tournament' | 'match' | 'registration';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  faction_preference: Faction | null;
  is_admin: boolean;
  status: UserStatus;
  notification_prefs: NotificationPrefs;
  created_at: string;
  updated_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: AdminLogTargetType;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface NotificationPrefs {
  pairings: boolean;
  scores: boolean;
  deadlines: boolean;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  created_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  date_start: string; // ISO date
  date_end: string | null; // ISO date, for multi-day events
  location: string;
  organizer_id: string;
  point_limit: number;
  rounds: number;
  time_limit: number; // minutes per round
  max_capacity: number | null; // null = unlimited
  registration_deadline: string | null; // ISO datetime
  list_deadline: string | null; // ISO datetime
  status: TournamentStatus;
  settings: TournamentSettings;
  game_system_id: string; // Game system identifier (e.g., 'infinity', 'warhammer40k')
  created_at: string;
  updated_at: string;
}

export interface TournamentSettings {
  bye_op?: number; // Default: 10
  bye_vp?: number; // Default: 0
  bye_ap?: number; // Default: 0
  table_assignment?: 'sequential' | 'random';
}

// Generic scores structure for any game system
export interface MatchScores {
  player1: Record<string, number>;
  player2: Record<string, number>;
}

export interface Registration {
  id: string;
  tournament_id: string;
  user_id: string;
  army_list_code: string | null;
  army_faction: Faction | null;
  status: RegistrationStatus;
  list_validation_result: ValidationResult | null;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: string;
  tournament_id: string;
  round_number: number;
  status: RoundStatus;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  round_id: string;
  player1_id: string;
  player2_id: string | null; // null for bye
  table_number: number;
  // Player 1 scores (legacy - kept for backwards compatibility)
  player1_op: number | null;
  player1_vp: number | null;
  player1_ap: number | null;
  // Player 2 scores (legacy - null for bye matches)
  player2_op: number | null;
  player2_vp: number | null;
  player2_ap: number | null;
  // Generic scores (new - game-system agnostic)
  scores: MatchScores | null;
  // Match state for hidden information (classifieds, hidden deployment, etc.)
  match_state: InfinityMatchState | null;
  // Confirmation
  confirmed_by_p1: boolean;
  confirmed_by_p2: boolean;
  confirmation_status: MatchConfirmationStatus;
  // Result
  winner_id: string | null; // null for draw or bye
  is_bye: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Computed/Derived Types
// ============================================================================

export interface Standing {
  rank: number;
  user_id: string;
  player_name: string;
  faction: Faction | null;
  // Legacy score fields (backwards compatibility)
  total_op: number;
  total_vp: number;
  total_ap: number;
  // Generic scores from game system
  scores?: Record<string, number>;
  wins: number;
  losses: number;
  draws: number;
  sos: number; // Strength of Schedule
  matches_played: number;
}

export interface Pairing {
  player1_id: string;
  player2_id: string | null;
  is_bye: boolean;
  table_number?: number;
}

export interface PlayerStats {
  user_id: string;
  total_op: number;
  total_vp: number;
  total_ap: number;
  opponents: string[];
  received_bye: boolean;
}

// ============================================================================
// Join Types (for queries with relations)
// ============================================================================

export interface TournamentWithOrganizer extends Tournament {
  organizer: Pick<User, 'id' | 'name'>;
}

export interface RegistrationWithUser extends Registration {
  user: Pick<User, 'id' | 'name' | 'faction_preference'>;
}

export interface RegistrationWithTournament extends Registration {
  tournament: Pick<Tournament, 'id' | 'name' | 'date_start' | 'status' | 'point_limit'>;
}

export interface MatchWithPlayers extends Match {
  player1: Pick<User, 'id' | 'name'>;
  player2: Pick<User, 'id' | 'name'> | null;
  round: Pick<Round, 'id' | 'round_number' | 'tournament_id'>;
}

export interface RoundWithMatches extends Round {
  matches: Match[];
}

// ============================================================================
// Form/Input Types
// ============================================================================

export interface CreateTournamentInput {
  name: string;
  description?: string;
  date_start: string;
  date_end?: string;
  location: string;
  point_limit: number;
  rounds: number;
  time_limit: number;
  max_capacity?: number;
  registration_deadline?: string;
  list_deadline?: string;
  game_system_id?: string; // Defaults to 'infinity' if not specified
}

export interface UpdateTournamentInput extends Partial<CreateTournamentInput> {
  status?: TournamentStatus;
}

export interface ScoreInput {
  op: number;
  vp: number;
  ap: number;
}

export interface MatchScoreInput {
  match_id: string;
  player1_scores?: ScoreInput;
  player2_scores?: ScoreInput;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// ============================================================================
// Achievements System
// ============================================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'participation' | 'performance' | 'faction' | 'community';
  icon: string;
  criteria_type: 'count' | 'boolean' | 'threshold';
  criteria_field: string | null;
  criteria_value: number | null;
  points: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
  achievement?: Achievement;
}
