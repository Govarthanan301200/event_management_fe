import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../api/supabase';
import { SessionContext, type SessionState } from './session-store';

type SessionProviderProps = { children: ReactNode };

/** Low-frequency global value (hooks rule): the planner's Supabase session. */
export function SessionProvider({ children }: SessionProviderProps) {
  const [state, setState] = useState<SessionState>(
    supabase ? { status: 'loading' } : { status: 'unconfigured' },
  );

  // External system: Supabase Auth's session store.
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: 'signed-in', session } : { status: 'signed-out' });
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext value={state}>{children}</SessionContext>;
}
