import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/** null when sign-in isn't configured for this build (see `.env.example`). */
export const supabase: SupabaseClient | null =
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : null;

/** Current access token for planner API calls. Supabase refreshes it when needed. */
export async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error('Sign-in is not configured');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return token;
}

/**
 * Email sign-in link. SPEC-GAP: the login method (email vs phone OTP) is an open decision (§19);
 * email works with no SMS provider. `shouldCreateUser: false` — planners are onboarded, not self-registered.
 */
export async function sendSignInLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Sign-in is not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/events` },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
