import { createClient } from '@supabase/supabase-js';

// @ts-ignore — Vite injects import.meta.env at build time
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
} as const;
