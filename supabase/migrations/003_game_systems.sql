-- Migration: Add game system support
-- This migration adds support for multiple game systems beyond Infinity

-- ============================================================================
-- TOURNAMENTS: Add game_system_id column
-- ============================================================================

-- Add game_system_id to tournaments (defaults to 'infinity' for existing tournaments)
ALTER TABLE public.tournaments
  ADD COLUMN game_system_id TEXT NOT NULL DEFAULT 'infinity';

-- Index for filtering by game system
CREATE INDEX idx_tournaments_game_system ON public.tournaments(game_system_id);

-- ============================================================================
-- MATCHES: Add generic scores and match state columns
-- ============================================================================

-- Add generic scores JSONB column
-- Structure: {"player1": {"op": 8, "vp": 150, "ap": 250}, "player2": {"op": 5, "vp": 100, "ap": 180}}
ALTER TABLE public.matches
  ADD COLUMN scores JSONB;

-- Add match_state for hidden information tracking (classifieds, hidden deployment, etc.)
-- Structure: {"classifieds": {...}, "hidden_deployment": [...], "data_tracker": {...}}
ALTER TABLE public.matches
  ADD COLUMN match_state JSONB DEFAULT '{}';

-- ============================================================================
-- COMMENT: Migration notes for existing data
-- ============================================================================

-- Existing tournaments will have game_system_id = 'infinity' by default
-- Existing matches keep their player1_op, player2_op, etc. columns for backwards compatibility
-- New code should write to both the legacy columns AND the scores JSONB
-- Future migration can remove legacy columns once all data is migrated

COMMENT ON COLUMN public.tournaments.game_system_id IS 'Game system identifier (e.g., infinity, warhammer40k). Defaults to infinity.';
COMMENT ON COLUMN public.matches.scores IS 'Generic scores as JSONB. Structure: {player1: {field: value}, player2: {field: value}}';
COMMENT ON COLUMN public.matches.match_state IS 'Hidden game state (classifieds, hidden deployment, etc.). Structure varies by game system.';
