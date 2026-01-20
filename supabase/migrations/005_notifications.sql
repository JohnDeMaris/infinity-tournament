-- Notifications Schema Updates
-- Phase 5: Notifications

-- Push notification subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,  -- {p256dh: string, auth: string}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Index for querying subscriptions by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- RLS for push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read/manage their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON public.push_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions
  FOR DELETE
  USING (user_id = auth.uid());

-- Add notification preferences to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"pairings": true, "scores": true, "deadlines": true}';

-- Comments
COMMENT ON TABLE public.push_subscriptions IS 'Web Push notification subscriptions for users';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN public.push_subscriptions.keys IS 'p256dh and auth keys for encryption';
COMMENT ON COLUMN public.users.notification_prefs IS 'User notification preferences: {pairings, scores, deadlines}';
