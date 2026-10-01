import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://cisddayhekkktcomnqhz.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_KY6C_OH6GHS4rvRSofxw_Q_T3NZeLKx';

/**
 * Standard Supabase client for browser-side queries.
 * Operates strictly with the public anonymous key subject to Row Level Security (RLS).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to check whether real Supabase credentials have been configured.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || supabaseAnonKey;
  return (
    !!url &&
    url !== 'https://placeholder.supabase.co' &&
    !!key &&
    key !== 'placeholder-anon-key'
  );
};
