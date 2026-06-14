import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env.local for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
