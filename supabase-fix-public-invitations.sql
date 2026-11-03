-- WedPlan 2.2.1: fresh install OR non-destructive upgrade.
-- Run the entire file as one transaction. Never DROP existing application tables.
-- After migration, bind the legacy plan to its real Auth account using SETUP.md.
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, email TEXT, display_name TEXT, photo_url TEXT,
  partner_name TEXT, phone_number TEXT, role TEXT NOT NULL DEFAULT 'USER',
  is_active BOOLEAN DEFAULT FALSE, allow_custom_api_key BOOLEAN DEFAULT FALSE,
  enable_cloud_storage BOOLEAN DEFAULT TRUE, wedding_date DATE,
  show_countdown BOOLEAN DEFAULT TRUE, joined_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.plan_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_uid TEXT NOT NULL,
  owner_email TEXT, owner_name TEXT, partner_uid UUID, partner_email TEXT,
  share_code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','revoked')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_data (
  id TEXT PRIMARY KEY, guests JSONB DEFAULT '[]', budget_items JSONB DEFAULT '[]',
  procedures JSONB DEFAULT '{}', fengshui_profile JSONB,
  fengshui_results JSONB DEFAULT '{"harmony":null,"dates":[]}', invitation JSONB,
  wedding_date DATE, last_updated TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.public_invitations (
  uid TEXT PRIMARY KEY, invitation_json JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.invitation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), uid TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('rsvp','wish')), name TEXT NOT NULL,
  phone TEXT, attending TEXT, guest_count INT, message TEXT,
  selected_event_ids TEXT[] DEFAULT '{}', email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.analytics_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), timestamp BIGINT NOT NULL,
  uid TEXT DEFAULT 'guest', page TEXT, user_agent TEXT, ip TEXT, referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.guest_usage (
  ip_id TEXT PRIMARY KEY, ip TEXT NOT NULL, feng_shui_count INT DEFAULT 0,
  ai_chat_count INT DEFAULT 0, speech_count INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Remove all old application policies BEFORE changing columns they depend on.
-- This includes broad anon policies from the historical no-auth workaround.
DO $$ DECLARE p RECORD; BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND tablename IN
      ('profiles','plan_shares','user_data','public_invitations','invitation_responses','analytics_logs','guest_usage')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename); END LOOP;
END $$;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.user_data DROP CONSTRAINT IF EXISTS user_data_id_fkey;
ALTER TABLE public.public_invitations DROP CONSTRAINT IF EXISTS public_invitations_uid_fkey;
ALTER TABLE public.plan_shares DROP CONSTRAINT IF EXISTS plan_shares_owner_uid_fkey;
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.user_data ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.public_invitations ALTER COLUMN uid TYPE TEXT USING uid::text;
ALTER TABLE public.plan_shares ALTER COLUMN owner_uid TYPE TEXT USING owner_uid::text;
ALTER TABLE public.invitation_responses ALTER COLUMN uid TYPE TEXT USING uid::text;
ALTER TABLE public.invitation_responses ADD COLUMN IF NOT EXISTS selected_event_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.invitation_responses ADD COLUMN IF NOT EXISTS email TEXT;

CREATE TABLE IF NOT EXISTS private.plan_owners (
  plan_uid TEXT PRIMARY KEY, auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
REVOKE ALL ON private.plan_owners FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_plan(plan_uid TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND (
    auth.uid()::text = plan_uid OR EXISTS (
      SELECT 1 FROM private.plan_owners p WHERE p.plan_uid = $1 AND p.auth_user_id = auth.uid()
    )
  );
$$;
REVOKE ALL ON FUNCTION public.can_manage_plan(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_plan(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_access_plan(plan_uid TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.can_manage_plan($1) OR (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.plan_shares s
    WHERE s.owner_uid = $1 AND s.partner_uid = auth.uid() AND s.status = 'active'
  ));
$$;
REVOKE ALL ON FUNCTION public.can_access_plan(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_plan(TEXT) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_usage ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles, public.user_data, public.plan_shares, public.invitation_responses,
  public.analytics_logs, public.guest_usage FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.user_data, public.plan_shares TO authenticated;
GRANT SELECT ON public.invitation_responses TO authenticated;
GRANT INSERT ON public.invitation_responses TO anon, authenticated;
REVOKE ALL ON public.public_invitations FROM anon, authenticated;
GRANT SELECT ON public.public_invitations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.public_invitations TO authenticated;
GRANT SELECT, INSERT ON public.analytics_logs TO authenticated;

CREATE POLICY owner_profiles ON public.profiles FOR ALL TO authenticated
  USING (public.can_manage_plan(id)) WITH CHECK (public.can_manage_plan(id));
CREATE POLICY members_data ON public.user_data FOR ALL TO authenticated
  USING (public.can_access_plan(id)) WITH CHECK (public.can_access_plan(id));
CREATE POLICY owner_only_delete_data ON public.user_data AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.can_manage_plan(id));
CREATE POLICY public_invite_read ON public.public_invitations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY members_invite_write ON public.public_invitations FOR ALL TO authenticated
  USING (public.can_access_plan(uid)) WITH CHECK (public.can_access_plan(uid));
CREATE POLICY owner_only_delete_invitation ON public.public_invitations AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.can_manage_plan(uid));
CREATE POLICY owner_share ON public.plan_shares FOR ALL TO authenticated
  USING (public.can_manage_plan(owner_uid)) WITH CHECK (public.can_manage_plan(owner_uid));
CREATE POLICY partner_share_read ON public.plan_shares FOR SELECT TO authenticated USING (partner_uid = auth.uid());
CREATE POLICY owner_responses_read ON public.invitation_responses FOR SELECT TO authenticated
  USING (public.can_access_plan(uid));
CREATE POLICY guest_submit_response ON public.invitation_responses FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) BETWEEN 1 AND 100
    AND coalesce(char_length(phone),0) <= 30 AND coalesce(char_length(email),0) <= 254
    AND coalesce(char_length(message),0) <= 2000
    AND coalesce(cardinality(selected_event_ids),0) <= 20
    AND ((kind='rsvp' AND attending IN ('yes','no') AND (guest_count IS NULL OR guest_count BETWEEN 1 AND 100))
      OR (kind='wish' AND char_length(trim(message)) BETWEEN 1 AND 2000 AND phone IS NULL))
    AND EXISTS (SELECT 1 FROM public.public_invitations i WHERE i.uid = invitation_responses.uid
      AND CASE WHEN kind='wish' THEN i.invitation_json->>'guestbookEnabled' ELSE i.invitation_json->>'rsvpEnabled' END = 'true')
  );
CREATE POLICY own_analytics_read ON public.analytics_logs FOR SELECT TO authenticated USING (public.can_manage_plan(uid));
CREATE POLICY own_analytics_insert ON public.analytics_logs FOR INSERT TO authenticated WITH CHECK (public.can_manage_plan(uid));

-- Never expose phone/email/RSVP rows to public guests; return a wish projection.
CREATE OR REPLACE FUNCTION public.get_public_wishes(plan_uid TEXT)
RETURNS TABLE(id UUID, name TEXT, message TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT r.id, r.name, r.message, r.created_at FROM public.invitation_responses r
  JOIN public.public_invitations i ON i.uid = r.uid
  WHERE r.uid = $1 AND r.kind = 'wish' AND i.invitation_json->>'guestbookEnabled' = 'true'
  ORDER BY r.created_at DESC LIMIT 200;
$$;
REVOKE ALL ON FUNCTION public.get_public_wishes(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_wishes(TEXT) TO anon, authenticated;

-- Atomic compare-and-save: no last-write-wins overwrite after a stale read.
CREATE OR REPLACE FUNCTION public.save_plan(plan_uid TEXT, plan_data JSONB, expected_updated_at TIMESTAMPTZ)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE previous TIMESTAMPTZ; revision TIMESTAMPTZ := clock_timestamp(); BEGIN
  IF NOT public.can_access_plan(plan_uid) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
  SELECT last_updated INTO previous FROM public.user_data WHERE id = plan_uid FOR UPDATE;
  IF FOUND AND previous IS DISTINCT FROM expected_updated_at THEN
    RAISE EXCEPTION 'Plan changed on another device; reload before saving' USING ERRCODE='40001';
  END IF;
  IF coalesce(jsonb_typeof(plan_data->'guests'),'') <> 'array' OR coalesce(jsonb_typeof(plan_data->'budgetItems'),'') <> 'array' THEN
    RAISE EXCEPTION 'Invalid plan payload' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.user_data(id,guests,budget_items,procedures,fengshui_profile,fengshui_results,invitation,wedding_date,last_updated)
  VALUES (plan_uid,plan_data->'guests',plan_data->'budgetItems',coalesce(plan_data->'procedures','{}'),
    plan_data->'fengShuiProfile',plan_data->'fengShuiResults',plan_data->'invitation',
    nullif(plan_data->>'weddingDate','')::date,revision)
  ON CONFLICT(id) DO UPDATE SET guests=EXCLUDED.guests,budget_items=EXCLUDED.budget_items,
    procedures=EXCLUDED.procedures,fengshui_profile=EXCLUDED.fengshui_profile,
    fengshui_results=EXCLUDED.fengshui_results,invitation=EXCLUDED.invitation,
    wedding_date=EXCLUDED.wedding_date,last_updated=revision;
  IF jsonb_typeof(plan_data->'invitation') = 'object' THEN
    INSERT INTO public.public_invitations(uid,invitation_json,updated_at)
    VALUES(plan_uid,plan_data->'invitation',revision)
    ON CONFLICT(uid) DO UPDATE SET invitation_json=EXCLUDED.invitation_json,updated_at=revision;
  END IF;
  RETURN revision;
END $$;
REVOKE ALL ON FUNCTION public.save_plan(TEXT,JSONB,TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_plan(TEXT,JSONB,TIMESTAMPTZ) TO authenticated;

-- A share code is resolved server-side instead of publicly listing all codes.
CREATE OR REPLACE FUNCTION public.join_plan_by_code(invite_code TEXT)
RETURNS SETOF public.plan_shares LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE invitation public.plan_shares; BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
  SELECT * INTO invitation FROM public.plan_shares WHERE share_code=upper(trim(invite_code)) FOR UPDATE;
  IF NOT FOUND OR invitation.status='revoked' THEN RAISE EXCEPTION 'Invalid invite'; END IF;
  IF public.can_manage_plan(invitation.owner_uid) THEN RAISE EXCEPTION 'Cannot join own plan'; END IF;
  IF invitation.partner_uid IS NOT NULL AND invitation.partner_uid<>auth.uid() THEN RAISE EXCEPTION 'Plan already joined'; END IF;
  UPDATE public.plan_shares SET partner_uid=auth.uid(),status='active' WHERE id=invitation.id;
  RETURN QUERY SELECT * FROM public.plan_shares WHERE id=invitation.id;
END $$;
REVOKE ALL ON FUNCTION public.join_plan_by_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_plan_by_code(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_shared_plan(share_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE invitation public.plan_shares; BEGIN
  SELECT * INTO invitation FROM public.plan_shares WHERE id=share_id FOR UPDATE;
  IF auth.uid() IS NULL OR NOT FOUND OR NOT (
    public.can_manage_plan(invitation.owner_uid) OR coalesce(invitation.partner_uid=auth.uid(),false)
  ) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
  UPDATE public.plan_shares SET partner_uid=null,partner_email='',status='pending' WHERE id=share_id;
END $$;
REVOKE ALL ON FUNCTION public.leave_shared_plan(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_shared_plan(UUID) TO authenticated;

CREATE TABLE IF NOT EXISTS private.ai_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_day DATE NOT NULL, daily_count INT NOT NULL,
  minute_start TIMESTAMPTZ NOT NULL, minute_count INT NOT NULL
);
REVOKE ALL ON private.ai_usage FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.consume_ai_quota(plan_uid TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE accepted UUID; BEGIN
  IF NOT public.can_manage_plan(plan_uid) THEN RETURN false; END IF;
  INSERT INTO private.ai_usage(user_id,usage_day,daily_count,minute_start,minute_count)
  VALUES(auth.uid(),current_date,1,date_trunc('minute',now()),1)
  ON CONFLICT(user_id) DO UPDATE SET
    usage_day=current_date,
    daily_count=CASE WHEN ai_usage.usage_day=current_date THEN ai_usage.daily_count+1 ELSE 1 END,
    minute_start=date_trunc('minute',now()),
    minute_count=CASE WHEN ai_usage.minute_start=date_trunc('minute',now()) THEN ai_usage.minute_count+1 ELSE 1 END
  WHERE (ai_usage.usage_day<>current_date OR ai_usage.daily_count<200)
    AND (ai_usage.minute_start<>date_trunc('minute',now()) OR ai_usage.minute_count<10)
  RETURNING user_id INTO accepted;
  RETURN accepted IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.consume_ai_quota(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(TEXT) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_inv_resp_uid ON public.invitation_responses(uid,kind,created_at DESC);

-- Storage is optional in the disposable DB. Preserve unrelated bucket policies.
DO $$ BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS wedplan_owner_guard ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS wedplan_owner_files ON storage.objects';
    EXECUTE $p$CREATE POLICY wedplan_owner_guard ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
      USING (bucket_id <> 'wedkho' OR public.can_manage_plan(split_part(name,'/',1)))
      WITH CHECK (bucket_id <> 'wedkho' OR public.can_manage_plan(split_part(name,'/',1)))$p$;
    EXECUTE $p$CREATE POLICY wedplan_owner_files ON storage.objects FOR ALL TO authenticated
      USING (bucket_id='wedkho' AND public.can_manage_plan(split_part(name,'/',1)))
      WITH CHECK (bucket_id='wedkho' AND public.can_manage_plan(split_part(name,'/',1)))$p$;
  END IF;
END $$;
COMMIT;
