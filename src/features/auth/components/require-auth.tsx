import { Navigate, Outlet } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '../hooks/use-session';

/** Guards planner routes. The API still checks every request; this only routes the UI. */
export function RequireAuth() {
  const session = useSession();
  if (session.status === 'loading') {
    return (
      <div aria-busy="true" aria-label="Loading" className="mx-auto max-w-5xl p-8">
        <Skeleton className="h-9 w-48" />
      </div>
    );
  }
  if (session.status !== 'signed-in') return <Navigate to="/sign-in" replace />;
  return <Outlet />;
}
