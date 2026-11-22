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

/** Email and password sign-in. Sends no email, so Supabase's email rate limit never applies. */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Sign-in is not configured');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Turns Supabase Auth's error codes into what the planner should do next. */
export function signInErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  switch (code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Check both and try again.';
    case 'email_not_confirmed':
      return 'This account isn’t confirmed yet. Confirm the user in Supabase, then try again.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many sign-in emails were sent recently. Wait a while (up to an hour), then try again.';
    case 'otp_disabled':
    case 'signup_disabled':
    case 'user_not_found':
      return "There's no planner account for this email. Ask for an account to be set up.";
    case 'email_address_not_authorized':
      return "This project's email service can't send to this address yet. Set up custom SMTP in Supabase.";
    default:
      return "Couldn't send the link. Check your connection and try again.";
  }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
