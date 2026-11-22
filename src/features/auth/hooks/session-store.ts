import type { Session } from '@supabase/supabase-js';
import { createContext } from 'react';

export type SessionState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; session: Session };

export const SessionContext = createContext<SessionState>({ status: 'loading' });
