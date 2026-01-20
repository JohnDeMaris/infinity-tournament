-- Infinity Tournament Manager - Initial Schema
-- Run this migration in Supabase SQL Editor or via CLI

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('player', 'to', 'admin');
CREATE TYPE tournament_status AS ENUM ('draft', 'registration', 'active', 'completed');
CREATE TYPE registration_status AS ENUM ('registered', 'waitlist', 'dropped');
CREATE TYPE round_status AS ENUM ('pairing', 'active', 'completed');
CREATE TYPE match_confirmation_status AS ENUM ('pending', 'partial', 'disputed', 'confirmed', 'completed');

-- ============================================================================
-- USERS TABLE (extends auth.users)
-- ============================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'player',
  faction_preference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================================================
-- TOURNAMENTS TABLE
-- ============================================================================

CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  date_start DATE NOT NULL,
  date_end DATE,
  location TEXT NOT NULL,
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  point_limit INTEGER NOT NULL DEFAULT 300,
  rounds INTEGER NOT NULL DEFAULT 3,
  time_limit INTEGER NOT NULL DEFAULT 90, -- minutes
  max_capacity INTEGER, -- NULL = unlimited
  registration_deadline TIMESTAMPTZ,
  list_deadline TIMESTAMPTZ,
  status tournament_status NOT NULL DEFAULT 'draft',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_date_start ON public.tournaments(date_start);
CREATE INDEX idx_tournaments_organizer ON public.tournaments(organizer_id);

-- ============================================================================
-- REGISTRATIONS TABLE
-- ============================================================================

CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  army_list_code TEXT,
  army_faction TEXT,
  status registration_status NOT NULL DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One registration per user per tournament
  UNIQUE(tournament_id, user_id)
);

-- Indexes
CREATE INDEX idx_registrations_tournament ON public.registrations(tournament_id);
CREATE INDEX idx_registrations_user ON public.registrations(user_id);
CREATE INDEX idx_registrations_status ON public.registrations(status);

-- ============================================================================
-- ROUNDS TABLE
-- ============================================================================

CREATE TABLE public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  status round_status NOT NULL DEFAULT 'pairing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One round number per tournament
  UNIQUE(tournament_id, round_number)
);

-- Indexes
CREATE INDEX idx_rounds_tournament ON public.rounds(tournament_id);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  player2_id UUID REFERENCES public.users(id) ON DELETE RESTRICT, -- NULL for bye
  table_number INTEGER NOT NULL,

  -- Player 1 scores
  player1_op INTEGER CHECK (player1_op IS NULL OR (player1_op >= 0 AND player1_op <= 10)),
  player1_vp INTEGER CHECK (player1_vp IS NULL OR player1_vp >= 0),
  player1_ap INTEGER CHECK (player1_ap IS NULL OR player1_ap >= 0),

  -- Player 2 scores (NULL for bye matches)
  player2_op INTEGER CHECK (player2_op IS NULL OR (player2_op >= 0 AND player2_op <= 10)),
  player2_vp INTEGER CHECK (player2_vp IS NULL OR player2_vp >= 0),
  player2_ap INTEGER CHECK (player2_ap IS NULL OR player2_ap >= 0),

  -- Confirmation
  confirmed_by_p1 BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_by_p2 BOOLEAN NOT NULL DEFAULT FALSE,
  confirmation_status match_confirmation_status NOT NULL DEFAULT 'pending',

  -- Result
  winner_id UUID REFERENCES public.users(id),
  is_bye BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_matches_round ON public.matches(round_id);
CREATE INDEX idx_matches_player1 ON public.matches(player1_id);
CREATE INDEX idx_matches_player2 ON public.matches(player2_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

-- Anyone can read users (for displaying names)
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users are created via trigger (see below)

-- ============================================================================
-- TOURNAMENTS POLICIES
-- ============================================================================

-- Public tournaments (registration, active, completed) are viewable by all
CREATE POLICY "Public tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (status != 'draft' OR organizer_id = auth.uid());

-- TOs can create tournaments
CREATE POLICY "TOs can create tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('to', 'admin')
    )
  );

-- Organizers can update their own tournaments
CREATE POLICY "Organizers can update own tournaments"
  ON public.tournaments FOR UPDATE
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- Organizers can delete their own draft tournaments
CREATE POLICY "Organizers can delete own draft tournaments"
  ON public.tournaments FOR DELETE
  USING (organizer_id = auth.uid() AND status = 'draft');

-- ============================================================================
-- REGISTRATIONS POLICIES
-- ============================================================================

-- Anyone can view registrations for public tournaments
CREATE POLICY "Registrations are viewable for public tournaments"
  ON public.registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
      AND (t.status != 'draft' OR t.organizer_id = auth.uid())
    )
  );

-- Authenticated users can register for tournaments
CREATE POLICY "Users can create own registration"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registration (list submission, withdrawal)
CREATE POLICY "Users can update own registration"
  ON public.registrations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Organizers can update registrations in their tournaments
CREATE POLICY "Organizers can update registrations"
  ON public.registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
      AND t.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- ROUNDS POLICIES
-- ============================================================================

-- Rounds are viewable for public tournaments
CREATE POLICY "Rounds are viewable for public tournaments"
  ON public.rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
      AND (t.status != 'draft' OR t.organizer_id = auth.uid())
    )
  );

-- Only organizers can create/update rounds
CREATE POLICY "Organizers can manage rounds"
  ON public.rounds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id
      AND t.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- MATCHES POLICIES
-- ============================================================================

-- Matches are viewable for public tournaments
CREATE POLICY "Matches are viewable for public tournaments"
  ON public.matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rounds r
      JOIN public.tournaments t ON t.id = r.tournament_id
      WHERE r.id = round_id
      AND (t.status != 'draft' OR t.organizer_id = auth.uid())
    )
  );

-- Players can update their own match scores
CREATE POLICY "Players can update own match scores"
  ON public.matches FOR UPDATE
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

-- Organizers can manage matches
CREATE POLICY "Organizers can manage matches"
  ON public.matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rounds r
      JOIN public.tournaments t ON t.id = r.tournament_id
      WHERE r.id = round_id
      AND t.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTION: Create user profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'player'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- FUNCTION: Promote from waitlist
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  next_waitlist UUID;
  tournament_capacity INTEGER;
  current_registered INTEGER;
BEGIN
  -- Only run when a registration is dropped
  IF NEW.status = 'dropped' AND OLD.status = 'registered' THEN
    -- Get tournament capacity
    SELECT max_capacity INTO tournament_capacity
    FROM public.tournaments
    WHERE id = NEW.tournament_id;

    -- Count current registered
    SELECT COUNT(*) INTO current_registered
    FROM public.registrations
    WHERE tournament_id = NEW.tournament_id
    AND status = 'registered';

    -- If there's capacity and waitlist exists, promote next
    IF tournament_capacity IS NULL OR current_registered < tournament_capacity THEN
      SELECT id INTO next_waitlist
      FROM public.registrations
      WHERE tournament_id = NEW.tournament_id
      AND status = 'waitlist'
      ORDER BY created_at ASC
      LIMIT 1;

      IF next_waitlist IS NOT NULL THEN
        UPDATE public.registrations
        SET status = 'registered'
        WHERE id = next_waitlist;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_registration_dropped
  AFTER UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION promote_from_waitlist();

-- ============================================================================
-- VIEW: Tournament standings (for easier querying)
-- ============================================================================

CREATE OR REPLACE VIEW public.tournament_standings AS
WITH player_stats AS (
  SELECT
    r.tournament_id,
    m.player1_id AS player_id,
    COALESCE(m.player1_op, 0) AS op,
    COALESCE(m.player1_vp, 0) AS vp,
    COALESCE(m.player1_ap, 0) AS ap,
    CASE
      WHEN m.winner_id = m.player1_id THEN 1
      ELSE 0
    END AS wins,
    CASE
      WHEN m.winner_id IS NOT NULL AND m.winner_id != m.player1_id THEN 1
      ELSE 0
    END AS losses,
    CASE
      WHEN m.winner_id IS NULL AND m.is_bye = FALSE AND m.confirmation_status = 'completed' THEN 1
      ELSE 0
    END AS draws,
    m.player2_id AS opponent_id
  FROM public.matches m
  JOIN public.rounds r ON r.id = m.round_id
  WHERE m.confirmation_status IN ('confirmed', 'completed')

  UNION ALL

  SELECT
    r.tournament_id,
    m.player2_id AS player_id,
    COALESCE(m.player2_op, 0) AS op,
    COALESCE(m.player2_vp, 0) AS vp,
    COALESCE(m.player2_ap, 0) AS ap,
    CASE
      WHEN m.winner_id = m.player2_id THEN 1
      ELSE 0
    END AS wins,
    CASE
      WHEN m.winner_id IS NOT NULL AND m.winner_id != m.player2_id THEN 1
      ELSE 0
    END AS losses,
    CASE
      WHEN m.winner_id IS NULL AND m.is_bye = FALSE AND m.confirmation_status = 'completed' THEN 1
      ELSE 0
    END AS draws,
    m.player1_id AS opponent_id
  FROM public.matches m
  JOIN public.rounds r ON r.id = m.round_id
  WHERE m.player2_id IS NOT NULL
  AND m.confirmation_status IN ('confirmed', 'completed')
),
aggregated AS (
  SELECT
    tournament_id,
    player_id,
    SUM(op) AS total_op,
    SUM(vp) AS total_vp,
    SUM(ap) AS total_ap,
    SUM(wins) AS wins,
    SUM(losses) AS losses,
    SUM(draws) AS draws,
    COUNT(*) AS matches_played,
    ARRAY_AGG(DISTINCT opponent_id) FILTER (WHERE opponent_id IS NOT NULL) AS opponents
  FROM player_stats
  GROUP BY tournament_id, player_id
)
SELECT
  a.*,
  u.name AS player_name,
  reg.army_faction AS faction
FROM aggregated a
JOIN public.users u ON u.id = a.player_id
LEFT JOIN public.registrations reg ON reg.tournament_id = a.tournament_id AND reg.user_id = a.player_id;

-- Grant select on view
GRANT SELECT ON public.tournament_standings TO authenticated;
GRANT SELECT ON public.tournament_standings TO anon;
