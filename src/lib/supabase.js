import { createClient } from "@supabase/supabase-js";

// Public project URL + publishable/anon key only. Both come from build-time
// NEXT_PUBLIC_ env vars; never put a service-role key here.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client = null;

// Created lazily (browser only) so static prerendering never touches storage.
export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}
