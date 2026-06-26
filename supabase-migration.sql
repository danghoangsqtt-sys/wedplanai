-- ============================================================
-- WedPlan AI — Supabase Migration Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. PROFILES (replaces Appwrite public_profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  photo_url TEXT,
  partner_name TEXT,
  phone_number TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER', 'GUEST')),
  is_active BOOLEAN DEFAULT FALSE,
  allow_custom_api_key BOOLEAN DEFAULT FALSE,
  enable_cloud_storage BOOLEAN DEFAULT TRUE,
  wedding_date DATE,
  show_countdown BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Self update profiles" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 2. USER_DATA (replaces Appwrite user_data — now JSONB instead of JSON strings)
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  guests JSONB DEFAULT '[]'::jsonb,
  budget_items JSONB DEFAULT '[]'::jsonb,
  procedures JSONB DEFAULT '{}'::jsonb,
  fengshui_profile JSONB,
  fengshui_results JSONB DEFAULT '{"harmony": null, "dates": []}'::jsonb,
  invitation JSONB,
  wedding_date DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access user_data" ON user_data FOR ALL USING (auth.uid() = id);
CREATE POLICY "Partner read user_data" ON user_data FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM plan_shares
    WHERE status = 'active' AND owner_uid = user_data.id AND partner_uid = auth.uid()
  )
);
CREATE POLICY "Partner update user_data" ON user_data FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM plan_shares
    WHERE status = 'active' AND owner_uid = user_data.id AND partner_uid = auth.uid()
  )
);

-- 3. PLAN_SHARES (replaces Appwrite plan_shares)
CREATE TABLE IF NOT EXISTS plan_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL REFERENCES auth.users(id),
  owner_email TEXT,
  owner_name TEXT,
  partner_uid UUID REFERENCES auth.users(id),
  partner_email TEXT,
  share_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plan_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manage plan_shares" ON plan_shares FOR ALL USING (auth.uid() = owner_uid);
CREATE POLICY "Partner read plan_shares" ON plan_shares FOR SELECT USING (auth.uid() = partner_uid);
CREATE POLICY "Partner update plan_shares" ON plan_shares FOR UPDATE USING (auth.uid() = partner_uid);
CREATE POLICY "Find by code plan_shares" ON plan_shares FOR SELECT USING (true);
CREATE POLICY "Self insert plan_shares" ON plan_shares FOR INSERT WITH CHECK (auth.uid() = owner_uid);

-- 4. PUBLIC_INVITATIONS (for shared wedding invitation viewing)
CREATE TABLE IF NOT EXISTS public_invitations (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read invitations" ON public_invitations FOR SELECT USING (true);
CREATE POLICY "Owner manage invitations" ON public_invitations FOR ALL USING (auth.uid() = uid);

-- 5. ANALYTICS_LOGS (replaces Appwrite analytics_logs)
CREATE TABLE IF NOT EXISTS analytics_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp BIGINT NOT NULL,
  uid TEXT DEFAULT 'guest',
  page TEXT,
  user_agent TEXT,
  ip TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read analytics" ON analytics_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone insert analytics" ON analytics_logs FOR INSERT WITH CHECK (true);

-- 6. GUEST_USAGE (replaces Appwrite guest_usage)
CREATE TABLE IF NOT EXISTS guest_usage (
  ip_id TEXT PRIMARY KEY,
  ip TEXT NOT NULL,
  feng_shui_count INT DEFAULT 0,
  ai_chat_count INT DEFAULT 0,
  speech_count INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guest_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access guest_usage" ON guest_usage FOR ALL USING (true);

-- ============================================================
-- STORAGE BUCKET (create via Dashboard or SQL)
-- ============================================================
-- Go to Supabase Dashboard > Storage > Create a new bucket:
--   Name: wedkho
--   Public: true
--   Allowed MIME: image/*
--   Max file size: 2MB

-- ============================================================
-- OPTIONAL: Auto-create profile on user signup (trigger function)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, photo_url, role, is_active, joined_at, last_seen)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'USER',
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    last_seen = NOW(),
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 7. INVITATION_RESPONSES (RSVP & Guestbook cloud collection)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invitation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('rsvp','wish')),
  name TEXT NOT NULL,
  phone TEXT,
  attending TEXT,
  guest_count INT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invitation_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert responses" ON public.invitation_responses
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "public read responses" ON public.invitation_responses
  FOR SELECT TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_inv_resp_uid ON public.invitation_responses (uid, kind, created_at DESC);
