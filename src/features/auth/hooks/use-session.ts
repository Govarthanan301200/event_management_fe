import { use } from 'react';
import { SessionContext, type SessionState } from './session-store';

export function useSession(): SessionState {
  return use(SessionContext);
}
