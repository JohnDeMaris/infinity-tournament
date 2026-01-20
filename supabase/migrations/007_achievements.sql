-- Achievements System
-- Defines achievements and tracks user progress

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('participation', 'performance', 'faction', 'community')),
  icon TEXT NOT NULL DEFAULT 'trophy',
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('count', 'boolean', 'threshold')),
  criteria_field TEXT, -- e.g., 'tournaments_played', 'wins', 'faction'
  criteria_value INTEGER, -- e.g., 10 for "play 10 tournaments"
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User achievements (unlocked achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- RLS Policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can read achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

-- Only admins can modify achievements
CREATE POLICY "Only admins can insert achievements"
  ON achievements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update achievements"
  ON achievements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Users can read their own achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view other users' achievements (public profiles)
CREATE POLICY "Anyone can view user achievements"
  ON user_achievements FOR SELECT
  USING (true);

-- System can insert achievements (via service role)
CREATE POLICY "Service role can insert user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
