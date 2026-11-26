import { Navigate } from 'react-router';
import { useMediaQuery } from '@/hooks/use-media-query';

/** On a phone the day is run from Today; on the web, Events (decision 2026-11-26). */
export function HomeRedirect() {
  const phone = useMediaQuery('(max-width: 639px)');
  return <Navigate to={phone ? '/today' : '/events'} replace />;
}
