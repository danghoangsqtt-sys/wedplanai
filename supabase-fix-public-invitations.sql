-- ============================================================
-- WedPlan AI — Fix: public_invitations for no-auth single-user mode
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================
-- 
-- Problem: public_invitations.uid has FK → auth.users(id)
-- This blocks INSERT/UPSERT when the owner has no Supabase Auth session
-- (single-user app with hardcoded OWNER_UID, no login required)
--
-- Fix:
--   1. Drop FK constraint so UID doesn't need to be in auth.users
--   2. Update RLS to allow anon upsert (so owner can save without auth)
--   3. Keep public SELECT open (anyone with link can view)
-- ============================================================

-- Step 1: Drop and recreate public_invitations without FK
DROP TABLE IF EXISTS public_invitations;

CREATE TABLE public_invitations (
  uid TEXT PRIMARY KEY,                        -- TEXT, no FK to auth.users
  invitation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE public_invitations ENABLE ROW LEVEL SECURITY;

-- Step 3: Allow anyone to read (view invitation)
CREATE POLICY "Public read invitations"
  ON public_invitations FOR SELECT
  USING (true);

-- Step 4: Allow anon to insert/update (owner saves without auth)
CREATE POLICY "Anon upsert invitations"
  ON public_invitations FOR ALL
  TO anon
  WITH CHECK (true);

-- Also fix user_data to not require auth.users FK
-- (needed for saving guests, budget, etc.)
-- NOTE: This drops and recreates user_data WITHOUT the auth.users FK
ALTER TABLE user_data DROP CONSTRAINT IF EXISTS user_data_id_fkey;
ALTER TABLE user_data ALTER COLUMN id TYPE TEXT;

-- Drop old RLS policies and add anon-friendly ones
DROP POLICY IF EXISTS "Owner access user_data" ON user_data;
DROP POLICY IF EXISTS "Partner read user_data" ON user_data;
DROP POLICY IF EXISTS "Partner update user_data" ON user_data;

CREATE POLICY "Anon access user_data"
  ON user_data FOR ALL
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon read user_data"
  ON user_data FOR SELECT
  TO anon
  USING (true);

-- Also fix profiles table (needed as first step in saveUserDataToCloud)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

DROP POLICY IF EXISTS "Self update profiles" ON profiles;
DROP POLICY IF EXISTS "Self insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON profiles;

CREATE POLICY "Anon upsert profiles"
  ON profiles FOR ALL
  TO anon
  WITH CHECK (true);

-- ============================================================
-- DONE: Now the single-user app can save/load without auth
-- ============================================================
