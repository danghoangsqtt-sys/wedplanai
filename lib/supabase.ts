import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Display setup state rather than throwing while the app module is loading.
export const supabase = createClient(
  supabaseUrl || 'https://configuration-required.invalid',
  supabaseAnonKey || 'configuration-required',
);

// --- Supabase table name constants ---
export const TABLES = {
  PROFILES: 'profiles',
  USER_DATA: 'user_data',
  PUBLIC_INVITATIONS: 'public_invitations',
  ANALYTICS_LOGS: 'analytics_logs',
  GUEST_USAGE: 'guest_usage',
  PLAN_SHARES: 'plan_shares',
  INVITATION_RESPONSES: 'invitation_responses',
} as const;
