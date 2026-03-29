import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client singleton, or null if env vars are not set.
 * Returning null (instead of throwing) lets the app run in offline/test mode
 * without a Supabase project configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (_client !== null) return _client;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !key) return null;

  _client = createClient(url, key, {
    auth: {
      // Store Supabase session in localStorage under its own key, separate
      // from the chorequest_state key managed by localStorage.ts.
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return _client;
}
