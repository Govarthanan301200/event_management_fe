import { useState } from 'react';
import { Navigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useSession } from '../hooks/use-session';
import { MagicLinkForm } from './magic-link-form';
import { PasswordSignInForm } from './password-sign-in-form';

type Method = 'password' | 'link';

/**
 * Planner sign-in. Password is the default because it sends no email; the emailed link stays
 * available. SPEC-GAP: the final login method is still an open decision (spec §19).
 */
export function SignInPage() {
  const session = useSession();
  const [method, setMethod] = useState<Method>('password');

  if (session.status === 'signed-in') return <Navigate to="/events" replace />;
  const unconfigured = session.status === 'unconfigured';

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-title-serif">Sign in</h1>
      {unconfigured ? (
        <p role="alert" className="text-body text-danger">
          ⚠ Sign-in isn&apos;t set up for this build. Add VITE_SUPABASE_URL and
          VITE_SUPABASE_PUBLISHABLE_KEY to .env.
        </p>
      ) : null}
      {method === 'password' ? (
        <PasswordSignInForm disabled={unconfigured} />
      ) : (
        <MagicLinkForm disabled={unconfigured} />
      )}
      <Button
        variant="link"
        className="self-start px-0 text-gold"
        onClick={() => {
          setMethod(method === 'password' ? 'link' : 'password');
        }}
      >
        {method === 'password'
          ? 'Email me a sign-in link instead'
          : 'Sign in with a password instead'}
      </Button>
    </main>
  );
}
